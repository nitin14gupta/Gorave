import io
import uuid

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

MAX_PHOTOS_PER_PERSON = 15
MAX_PHOTOS_PER_EVENT = 300
HIDE_AFTER_REPORTS = 3
BEST_COUNT = 6
BEST_MIN_VOTES = 2
REPORT_REASONS = {
    "not from this event", "nudity or sexual content", "posted without consent",
    "harassment or bullying", "violence", "spam or junk", "something else",
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
        "voted": row["voted"],
    }


# ── GET /events/{id}/album ────────────────────────────────────────────────

@router.get("/{event_id}/album")
def list_album(
    event_id: str,
    offset: int = Query(0, ge=0),
    limit: int = Query(60, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    uid = current_user["id"]
    columns = f"""
        p.id::text, p.storage_key, p.width, p.height, p.created_at, p.uploader_id::text,
        u.name AS uploader_name,
        (SELECT ph.url FROM user_photos ph WHERE ph.user_id = u.id ORDER BY ph.position LIMIT 1) AS uploader_avatar,
        EXISTS (SELECT 1 FROM event_photo_votes mv WHERE mv.photo_id = p.id AND mv.user_id = %(me)s::uuid) AS voted
    """
    shown = f"p.event_id = %(event_id)s::uuid AND {album.VISIBLE} AND {album.BLOCK_FILTER}"
    with get_db() as (cur, _):
        a = _require_view(cur, event_id, uid)
        params = {"event_id": event_id, "me": uid, "limit": limit + 1, "offset": offset, "best": BEST_COUNT, "min": BEST_MIN_VOTES}
        cur.execute(
            f"""
            SELECT {columns} FROM event_photos p JOIN users u ON u.id = p.uploader_id
            WHERE {shown} AND {album.VOTES} >= %(min)s
            ORDER BY {album.VOTES} DESC, p.created_at DESC
            LIMIT %(best)s
            """,
            params,
        )
        best = cur.fetchall()
        params["best_ids"] = [b["id"] for b in best]
        # One photo from each person, then the next from each, and so on, so
        # someone adding a lot can't fill the screen.
        cur.execute(
            f"""
            SELECT {columns} FROM event_photos p JOIN users u ON u.id = p.uploader_id
            WHERE {shown} AND NOT (p.id = ANY(%(best_ids)s::uuid[]))
            ORDER BY ROW_NUMBER() OVER (PARTITION BY p.uploader_id ORDER BY p.created_at DESC), p.created_at DESC, p.id
            LIMIT %(limit)s OFFSET %(offset)s
            """,
            params,
        )
        rows = cur.fetchall()
        cur.execute(f"SELECT COUNT(*)::int AS n FROM event_photos p WHERE {shown}", params)
        count = cur.fetchone()["n"]

    has_more = len(rows) > limit
    rows = rows[:limit]
    return {
        "best": [_serialize(r, uid, a["is_host"]) for r in best],
        "photos": [_serialize(r, uid, a["is_host"]) for r in rows],
        "count": count,
        "next_offset": offset + limit if has_more else None,
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


# ── DELETE /events/{id}/album/uploader/{user_id} ── host clears one person ─

@router.delete("/{event_id}/album/uploader/{user_id}")
def remove_uploader_photos(event_id: str, user_id: str, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, conn):
        a = _require_view(cur, event_id, uid)
        if not a["is_host"]:
            raise HTTPException(status_code=403, detail="Only the host can do this")
        cur.execute(
            """
            UPDATE event_photos SET removed_at = NOW(), removed_by = %s::uuid
            WHERE event_id = %s::uuid AND uploader_id = %s::uuid AND removed_at IS NULL
            RETURNING storage_key
            """,
            (uid, event_id, user_id),
        )
        keys = [r["storage_key"] for r in cur.fetchall()]
        conn.commit()
    for key in keys:
        r2_client.delete_file(key, bucket=rt.CHAT_BUCKET)
    return {"removed": len(keys)}


# ── POST / DELETE /events/{id}/album/{photo_id}/vote ── "Best of the night" ──
# Private by design: no counts, no list of who voted, no notification. Votes
# only decide what rises to the top, and you can't vote for your own photo.

def _vote(event_id: str, photo_id: str, uid: str, on: bool) -> dict:
    enforce_rate_limit(f"album:vote:{uid}", max_events=120, window_seconds=60)
    with get_db() as (cur, conn):
        _require_view(cur, event_id, uid)
        photo = _get_photo(cur, event_id, photo_id)
        if photo["uploader_id"] == uid:
            raise HTTPException(status_code=400, detail="That one's yours")
        if on:
            cur.execute(
                "INSERT INTO event_photo_votes (photo_id, user_id) VALUES (%s::uuid, %s::uuid) ON CONFLICT DO NOTHING",
                (photo_id, uid),
            )
        else:
            cur.execute("DELETE FROM event_photo_votes WHERE photo_id = %s::uuid AND user_id = %s::uuid", (photo_id, uid))
        conn.commit()
    return {"voted": on}


@router.post("/{event_id}/album/{photo_id}/vote")
def vote_photo(event_id: str, photo_id: str, current_user: dict = Depends(get_current_user)):
    return _vote(event_id, photo_id, current_user["id"], True)


@router.delete("/{event_id}/album/{photo_id}/vote")
def unvote_photo(event_id: str, photo_id: str, current_user: dict = Depends(get_current_user)):
    return _vote(event_id, photo_id, current_user["id"], False)


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
