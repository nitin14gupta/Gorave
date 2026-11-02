import io
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, Query, UploadFile, status
from PIL import Image
from pydantic import BaseModel

from db.config import get_db
from middleware.auth import get_current_user
from middleware.rate_limit import enforce_rate_limit
from routes.notifications import notify_report_submitted
from routes.upload import CHAT_IMAGE_MAX_DIMENSION, MAX_PHOTO_SIZE, RAW_IMAGE_UPLOAD_CAP, _is_image, _read_capped
from utils import album, chat_realtime as rt
from utils.image_utils import ImageConversionError, convert_to_webp
from utils.r2_client import r2_client

router = APIRouter(prefix="/events", tags=["album"])

MAX_PHOTOS_PER_PERSON = 30
MAX_PHOTOS_PER_EVENT = 300
HIDE_AFTER_REPORTS = 3
REPORT_REASONS = {
    "not from this event", "nudity or sexual content", "posted without consent",
    "harassment or bullying", "violence", "something else",
}


def _require_view(cur, event_id: str, uid: str) -> dict:
    a = album.access(cur, event_id, uid)
    if not a:
        raise HTTPException(status_code=404, detail="Event not found")
    if not a["can_view"]:
        raise HTTPException(status_code=403, detail="The album is for people who were there")
    return a


def _check_room(cur, event_id: str, uid: str) -> None:
    cur.execute(
        """
        SELECT COUNT(*)::int AS total, (COUNT(*) FILTER (WHERE uploader_id = %s::uuid))::int AS mine
        FROM event_photos WHERE event_id = %s::uuid AND removed_at IS NULL
        """,
        (uid, event_id),
    )
    n = cur.fetchone()
    if n["mine"] >= MAX_PHOTOS_PER_PERSON:
        raise HTTPException(status_code=400, detail=f"You can add up to {MAX_PHOTOS_PER_PERSON} photos")
    if n["total"] >= MAX_PHOTOS_PER_EVENT:
        raise HTTPException(status_code=400, detail="This album is full")


def _serialize(row: dict, uid: str, is_host: bool) -> dict:
    mine = row["uploader_id"] == uid
    return {
        "id": row["id"],
        "url": album.signed(row["storage_key"]),
        "key": row["storage_key"],
        "width": row["width"],
        "height": row["height"],
        "created_at": row["created_at"].isoformat(),
        "uploader": {"id": row["uploader_id"], "name": row["uploader_name"], "avatar": row["uploader_avatar"]},
        "mine": mine,
        "can_delete": mine or is_host,
    }


# ── GET /events/{id}/album ────────────────────────────────────────────────

@router.get("/{event_id}/album")
def list_album(
    event_id: str,
    cursor: Optional[str] = Query(None),
    limit: int = Query(60, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    uid = current_user["id"]
    with get_db() as (cur, _):
        a = _require_view(cur, event_id, uid)
        params = {"event_id": event_id, "me": uid, "limit": limit + 1, "at": None, "id": None}
        keyset = ""
        if cursor:
            try:
                at, pid = cursor.split("|")
                params.update(at=datetime.fromisoformat(at), id=str(uuid.UUID(pid)))
            except ValueError:
                raise HTTPException(status_code=400, detail="Bad cursor")
            keyset = "AND (p.created_at, p.id) < (%(at)s, %(id)s::uuid)"
        cur.execute(
            f"""
            SELECT p.id::text, p.storage_key, p.width, p.height, p.created_at, p.uploader_id::text,
                u.name AS uploader_name,
                (SELECT ph.url FROM user_photos ph WHERE ph.user_id = u.id ORDER BY ph.position LIMIT 1) AS uploader_avatar
            FROM event_photos p JOIN users u ON u.id = p.uploader_id
            WHERE p.event_id = %(event_id)s::uuid AND {album.VISIBLE} AND {album.BLOCK_FILTER} {keyset}
            ORDER BY p.created_at DESC, p.id DESC
            LIMIT %(limit)s
            """,
            params,
        )
        rows = cur.fetchall()
        cur.execute(
            f"SELECT COUNT(*)::int AS n FROM event_photos p WHERE p.event_id = %(event_id)s::uuid AND {album.VISIBLE} AND {album.BLOCK_FILTER}",
            params,
        )
        count = cur.fetchone()["n"]

    has_more = len(rows) > limit
    rows = rows[:limit]
    last = rows[-1] if has_more else None
    return {
        "photos": [_serialize(r, uid, a["is_host"]) for r in rows],
        "count": count,
        "next_cursor": f"{last['created_at'].isoformat()}|{last['id']}" if last else None,
        "can_add": a["can_add"],
        "closes_at": a["closes_at"].isoformat(),
    }


# ── POST /events/{id}/album ── one photo per call ─────────────────────────

@router.post("/{event_id}/album", status_code=status.HTTP_201_CREATED)
async def add_photo(
    event_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    uid = current_user["id"]
    # Party photos never go to the public bucket, so no fallback here.
    if not rt.chat_media_private():
        raise HTTPException(status_code=503, detail="Photo albums aren't available right now")
    enforce_rate_limit(f"album:add:{uid}", max_events=60, window_seconds=600, message="Too many photos at once. Try again in a few minutes.")
    if not _is_image(file):
        raise HTTPException(status_code=400, detail="Please choose a photo")

    with get_db() as (cur, _):
        a = _require_view(cur, event_id, uid)
        if not a["can_add"]:
            raise HTTPException(status_code=403, detail="This album has closed for new photos")
        _check_room(cur, event_id, uid)

    contents = await _read_capped(file, RAW_IMAGE_UPLOAD_CAP, "This photo is too large")
    try:
        webp = convert_to_webp(contents, max_dimension=CHAT_IMAGE_MAX_DIMENSION)
    except ImageConversionError:
        raise HTTPException(status_code=400, detail="We couldn't read that photo")
    if len(webp) > MAX_PHOTO_SIZE:
        raise HTTPException(status_code=400, detail="This photo is too large")
    with Image.open(io.BytesIO(webp)) as img:
        width, height = img.size

    stored = r2_client.upload_file(io.BytesIO(webp), "album.webp", folder=f"album/{event_id}", bucket=rt.CHAT_BUCKET)
    key = stored["path"]
    try:
        with get_db() as (cur, conn):
            # Serialises uploads per event, so the caps and the push gap hold.
            cur.execute("SELECT album_last_push_at FROM events WHERE id = %s::uuid FOR UPDATE", (event_id,))
            last_push = cur.fetchone()["album_last_push_at"]
            _check_room(cur, event_id, uid)
            cur.execute(
                """
                INSERT INTO event_photos (event_id, uploader_id, storage_key, width, height)
                VALUES (%s::uuid, %s::uuid, %s, %s, %s)
                RETURNING id::text, created_at
                """,
                (event_id, uid, key, width, height),
            )
            row = cur.fetchone()
            push_now = last_push is None or row["created_at"] - last_push > album.PUSH_GAP
            if push_now:
                cur.execute("UPDATE events SET album_last_push_at = NOW() WHERE id = %s::uuid", (event_id,))
            conn.commit()
    except Exception:
        r2_client.delete_file(key, bucket=rt.CHAT_BUCKET)
        raise

    if push_now:
        background_tasks.add_task(album.send_photos_update, event_id, last_push)
    return {"id": row["id"], "url": album.signed(key), "key": key, "width": width, "height": height}


# ── DELETE /events/{id}/album/{photo_id} ── uploader or host ──────────────

def _get_photo(cur, event_id: str, photo_id: str) -> dict:
    try:
        uuid.UUID(photo_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Photo not found")
    cur.execute(
        """
        SELECT id::text, uploader_id::text, storage_key FROM event_photos
        WHERE id = %s::uuid AND event_id = %s::uuid AND removed_at IS NULL
        """,
        (photo_id, event_id),
    )
    photo = cur.fetchone()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    return photo


@router.delete("/{event_id}/album/{photo_id}")
def remove_photo(event_id: str, photo_id: str, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, conn):
        a = _require_view(cur, event_id, uid)
        photo = _get_photo(cur, event_id, photo_id)
        if photo["uploader_id"] != uid and not a["is_host"]:
            raise HTTPException(status_code=403, detail="Only the person who added it or the host can remove this")
        cur.execute("UPDATE event_photos SET removed_at = NOW(), removed_by = %s::uuid WHERE id = %s::uuid", (uid, photo_id))
        conn.commit()
    r2_client.delete_file(photo["storage_key"], bucket=rt.CHAT_BUCKET)
    return {"ok": True}


# ── POST /events/{id}/album/{photo_id}/report ─────────────────────────────

class PhotoReportBody(BaseModel):
    reason: str


@router.post("/{event_id}/album/{photo_id}/report")
def report_photo(event_id: str, photo_id: str, body: PhotoReportBody, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    if body.reason.strip().lower() not in REPORT_REASONS:
        raise HTTPException(status_code=400, detail="Invalid reason")
    enforce_rate_limit(f"album:report:{uid}", max_events=10, window_seconds=3600)
    with get_db() as (cur, conn):
        _require_view(cur, event_id, uid)
        photo = _get_photo(cur, event_id, photo_id)
        if photo["uploader_id"] == uid:
            raise HTTPException(status_code=400, detail="You can remove your own photo instead")
        cur.execute(
            """
            INSERT INTO event_photo_reports (photo_id, reporter_id, reason)
            VALUES (%s::uuid, %s::uuid, %s)
            ON CONFLICT (photo_id, reporter_id) DO NOTHING
            RETURNING id
            """,
            (photo_id, uid, body.reason[:500]),
        )
        if cur.fetchone():
            notify_report_submitted(cur, uid, "event", event_id)
            cur.execute(
                f"""
                UPDATE event_photos SET hidden_at = NOW()
                WHERE id = %s::uuid AND hidden_at IS NULL
                  AND (SELECT COUNT(*) FROM event_photo_reports r WHERE r.photo_id = %s::uuid) >= {HIDE_AFTER_REPORTS}
                """,
                (photo_id, photo_id),
            )
        conn.commit()
    return {"ok": True}
