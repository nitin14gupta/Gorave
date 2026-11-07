from typing import Optional

from fastapi import APIRouter, Query, Depends, HTTPException
from pydantic import BaseModel

from db.config import get_db
from middleware.admin_auth import get_current_admin
from routes.chat import _msg_cache_key
from utils import album, chat_realtime as rt
from utils.r2_client import r2_client
from utils.admin_audit import log_action
from utils.push import send_push

router = APIRouter(prefix="/admin/reports", tags=["admin-reports"])


def _paginated(cur, count_sql, count_params, list_sql, list_params, page, page_size):
    cur.execute(count_sql, count_params)
    total = cur.fetchone()["count"]
    cur.execute(list_sql, [*list_params, page_size, (page - 1) * page_size])
    return cur.fetchall(), total


# ── GET /admin/reports/users ───────────────────────────────────────────────────

@router.get("/users")
def list_user_reports(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    current_admin: dict = Depends(get_current_admin),
):
    with get_db() as (cur, _):
        rows, total = _paginated(
            cur,
            "SELECT COUNT(*)::int AS count FROM user_reports",
            [],
            """
            SELECT ur.id::text, ur.reason, ur.created_at,
                   reporter.id::text AS reporter_id, reporter.name AS reporter_name, reporter.phone AS reporter_phone,
                   reported.id::text AS reported_id, reported.name AS reported_name, reported.phone AS reported_phone
            FROM user_reports ur
            JOIN users reporter ON reporter.id = ur.reporter_id
            JOIN users reported ON reported.id = ur.reported_id
            ORDER BY ur.created_at DESC
            LIMIT %s OFFSET %s
            """,
            [],
            page, page_size,
        )
    return {"items": rows, "total": total, "page": page, "page_size": page_size}


# ── Album photos: the takedown queue ─────────────────────────────────────────

class DecisionBody(BaseModel):
    note: Optional[str] = None


def _status_sql(alias: str, status: str) -> str:
    return f"{alias}.resolved_at IS NULL" if status == "open" else f"{alias}.resolved_at IS NOT NULL"


@router.get("/photos")
def list_photo_reports(
    status: str = Query(default="open", pattern="^(open|done)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    current_admin: dict = Depends(get_current_admin),
):
    """One row per reported photo, most reported first, with a short-lived link to see it."""
    where = _status_sql("r", status)
    with get_db() as (cur, _):
        rows, total = _paginated(
            cur,
            f"SELECT COUNT(DISTINCT r.photo_id)::int AS count FROM event_photo_reports r WHERE {where}",
            [],
            f"""
            SELECT p.id::text, p.event_id::text, e.title AS event_title, p.created_at, p.hidden_at, p.removed_at, p.storage_key,
                   uploader.id::text AS uploader_id, uploader.name AS uploader_name, uploader.phone AS uploader_phone,
                   COUNT(r.id)::int AS report_count, array_agg(DISTINCT r.reason) AS reasons, MAX(r.created_at) AS last_reported_at,
                   MAX(r.resolution) AS resolution, MAX(r.resolved_at) AS resolved_at
            FROM event_photo_reports r
            JOIN event_photos p ON p.id = r.photo_id
            JOIN events e ON e.id = p.event_id
            JOIN users uploader ON uploader.id = p.uploader_id
            WHERE {where}
            GROUP BY p.id, e.title, uploader.id
            ORDER BY {"report_count DESC, last_reported_at DESC" if status == "open" else "resolved_at DESC"}
            LIMIT %s OFFSET %s
            """,
            [],
            page, page_size,
        )
    items = []
    for r in rows:
        key = r.pop("storage_key")
        url = None
        if key and not r["removed_at"]:
            try:
                url = album.signed(key)
            except Exception:
                url = None
        items.append({**r, "url": url})
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.post("/photos/{photo_id}/remove")
def remove_reported_photo(photo_id: str, body: DecisionBody, current_admin: dict = Depends(get_current_admin)):
    """Takes the photo out of the album for everyone and deletes the file."""
    with get_db() as (cur, conn):
        cur.execute(
            "SELECT p.storage_key, p.uploader_id::text, p.removed_at, e.title FROM event_photos p JOIN events e ON e.id = p.event_id WHERE p.id = %s::uuid",
            (photo_id,),
        )
        photo = cur.fetchone()
        if not photo:
            raise HTTPException(status_code=404, detail="Photo not found")
        cur.execute("UPDATE event_photos SET removed_at = COALESCE(removed_at, NOW()) WHERE id = %s::uuid", (photo_id,))
        cur.execute(
            "UPDATE event_photo_reports SET resolved_at = NOW(), resolved_by = %s::uuid, resolution = 'removed' WHERE photo_id = %s::uuid AND resolved_at IS NULL",
            (current_admin["id"], photo_id),
        )
        conn.commit()
    if not photo["removed_at"]:
        try:
            r2_client.delete_file(photo["storage_key"], bucket=rt.CHAT_BUCKET)
        except Exception as e:
            print(f"[admin] deleting photo file failed: {e!r}", flush=True)
        try:
            send_push(photo["uploader_id"], "Photo removed", f"A photo you added to {photo['title']} was removed because it broke our community guidelines.")
        except Exception:
            pass
    log_action(current_admin["id"], "remove_photo", "photo", photo_id, body.note)
    return {"ok": True}


@router.post("/photos/{photo_id}/keep")
def keep_reported_photo(photo_id: str, body: DecisionBody, current_admin: dict = Depends(get_current_admin)):
    """Nothing wrong with it: closes the reports and puts it back if reports had hidden it."""
    with get_db() as (cur, conn):
        cur.execute(
            "UPDATE event_photo_reports SET resolved_at = NOW(), resolved_by = %s::uuid, resolution = 'kept' WHERE photo_id = %s::uuid AND resolved_at IS NULL RETURNING id",
            (current_admin["id"], photo_id),
        )
        if not cur.fetchall():
            raise HTTPException(status_code=404, detail="No open reports on this photo")
        cur.execute("UPDATE event_photos SET hidden_at = NULL WHERE id = %s::uuid AND removed_at IS NULL", (photo_id,))
        conn.commit()
    log_action(current_admin["id"], "keep_photo", "photo", photo_id, body.note)
    return {"ok": True}


# ── GET /admin/reports/events ──────────────────────────────────────────────────

@router.get("/events")
def list_event_reports(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    current_admin: dict = Depends(get_current_admin),
):
    with get_db() as (cur, _):
        rows, total = _paginated(
            cur,
            "SELECT COUNT(*)::int AS count FROM event_reports",
            [],
            """
            SELECT er.id::text, er.reason, er.description, er.created_at,
                   u.id::text AS reporter_id, u.name AS reporter_name, u.phone AS reporter_phone,
                   e.id::text AS event_id, e.title AS event_title, e.is_cancelled AS event_is_cancelled
            FROM event_reports er
            JOIN users u ON u.id = er.reporter_id
            JOIN events e ON e.id = er.event_id
            ORDER BY er.created_at DESC
            LIMIT %s OFFSET %s
            """,
            [],
            page, page_size,
        )
    return {"items": rows, "total": total, "page": page, "page_size": page_size}


# ── Messages: 1:1 and event group chats ─────────────────────────────────────

_MESSAGE_FIELDS = """
    m.id::text AS message_id, m.content AS message_content, m.content_type AS message_content_type, m.metadata,
    m.sent_at AS message_sent_at, m.unsent_at, m.conversation_id::text,
    sender.id::text AS sender_id, sender.name AS sender_name, sender.phone AS sender_phone,
    c.kind AS chat_kind, c.event_id::text AS event_id, e.title AS event_title
"""


def _media(md) -> Optional[str]:
    """A short-lived link to the photo, video or voice note, for the admin only."""
    if not isinstance(md, dict):
        return None
    out = rt.with_signed_media({"metadata": md})["metadata"]
    return out.get("url") if isinstance(out, dict) else None


@router.get("/messages")
def list_message_reports(
    status: str = Query(default="open", pattern="^(open|done)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    current_admin: dict = Depends(get_current_admin),
):
    """One row per reported message, most reported first, with its media."""
    where = _status_sql("mr", status)
    with get_db() as (cur, _):
        rows, total = _paginated(
            cur,
            f"SELECT COUNT(DISTINCT mr.message_id)::int AS count FROM message_reports mr WHERE {where}",
            [],
            f"""
            SELECT {_MESSAGE_FIELDS},
                   COUNT(mr.id)::int AS report_count, array_agg(DISTINCT mr.reason) AS reasons,
                   array_remove(array_agg(DISTINCT mr.description), NULL) AS descriptions,
                   array_agg(DISTINCT split_part(reporter.name, ' ', 1)) AS reporter_names,
                   MAX(mr.created_at) AS last_reported_at, MAX(mr.resolution) AS resolution, MAX(mr.resolved_at) AS resolved_at
            FROM message_reports mr
            JOIN messages m ON m.id = mr.message_id
            JOIN conversations c ON c.id = m.conversation_id
            LEFT JOIN events e ON e.id = c.event_id
            JOIN users sender ON sender.id = m.sender_id
            JOIN users reporter ON reporter.id = mr.reporter_id
            WHERE {where}
            GROUP BY m.id, sender.id, c.id, e.title
            ORDER BY {"report_count DESC, last_reported_at DESC" if status == "open" else "resolved_at DESC"}
            LIMIT %s OFFSET %s
            """,
            [],
            page, page_size,
        )
    items = []
    for r in rows:
        md = r.pop("metadata")
        items.append({**r, "media_url": None if r["unsent_at"] else _media(md)})
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.get("/messages/{message_id}/context")
def message_context(message_id: str, current_admin: dict = Depends(get_current_admin)):
    """The few messages around a reported one, so the admin can judge it in context.
    Only ever opened from a report."""
    with get_db() as (cur, _):
        cur.execute("SELECT 1 FROM message_reports WHERE message_id = %s::uuid LIMIT 1", (message_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="This message hasn't been reported")
        cur.execute("SELECT conversation_id, sent_at FROM messages WHERE id = %s::uuid", (message_id,))
        anchor = cur.fetchone()
        rows = []
        for op, order in (("<", "DESC"), (">", "ASC")):
            cur.execute(
                f"""
                SELECT m.id::text, m.content, m.content_type, m.metadata, m.sent_at, m.unsent_at, split_part(u.name, ' ', 1) AS sender_name, m.sender_id::text
                FROM messages m JOIN users u ON u.id = m.sender_id
                WHERE m.conversation_id = %s AND m.sent_at {op} %s
                ORDER BY m.sent_at {order} LIMIT 6
                """,
                (anchor["conversation_id"], anchor["sent_at"]),
            )
            part = cur.fetchall()
            rows.extend(reversed(part) if order == "DESC" else part)
            if op == "<":
                cur.execute(
                    "SELECT m.id::text, m.content, m.content_type, m.metadata, m.sent_at, m.unsent_at, split_part(u.name, ' ', 1) AS sender_name, m.sender_id::text FROM messages m JOIN users u ON u.id = m.sender_id WHERE m.id = %s::uuid",
                    (message_id,),
                )
                rows.append(cur.fetchone())
    out = []
    for r in rows:
        md = r.pop("metadata")
        out.append({**r, "content": None if r["unsent_at"] else r["content"], "media_url": None if r["unsent_at"] else _media(md), "reported": r["id"] == message_id})
    return {"messages": out}


@router.post("/messages/{message_id}/remove")
async def remove_reported_message(message_id: str, body: DecisionBody, current_admin: dict = Depends(get_current_admin)):
    """Removes it for everyone in the chat, the same way an unsend does, and
    takes it off open phones straight away."""
    with get_db() as (cur, conn):
        cur.execute("SELECT conversation_id::text, sender_id::text, unsent_at FROM messages WHERE id = %s::uuid", (message_id,))
        msg = cur.fetchone()
        if not msg:
            raise HTTPException(status_code=404, detail="Message not found")
        cur.execute(
            """
            UPDATE messages
            SET content = NULL, reactions = NULL, unsent_at = COALESCE(unsent_at, NOW()),
                metadata = CASE
                    WHEN content_type IN ('image', 'video', 'gif', 'voice')
                    THEN NULLIF(jsonb_strip_nulls(jsonb_build_object('url', metadata->'url', 'key', metadata->'key')), '{}'::jsonb)
                    ELSE NULL
                END
            WHERE id = %s::uuid
            """,
            (message_id,),
        )
        cur.execute(
            "UPDATE message_reports SET resolved_at = NOW(), resolved_by = %s::uuid, resolution = 'removed' WHERE message_id = %s::uuid AND resolved_at IS NULL",
            (current_admin["id"], message_id),
        )
        # A host update that's pinned comes down too.
        cur.execute("UPDATE conversations SET pinned_message_id = NULL WHERE pinned_message_id = %s::uuid", (message_id,))
        conn.commit()
    conv_id = msg["conversation_id"]
    r = await rt.get_redis()
    if r:
        try:
            await r.delete(_msg_cache_key(conv_id))
        except Exception:
            pass
    await rt.emit(conv_id, {"type": "message_unsent", "message_id": message_id, "conversation_id": conv_id})
    if not msg["unsent_at"]:
        try:
            send_push(msg["sender_id"], "Message removed", "A message you sent was removed because it broke our community guidelines.")
        except Exception:
            pass
    log_action(current_admin["id"], "remove_message", "message", message_id, body.note)
    return {"ok": True}


@router.post("/messages/{message_id}/keep")
def keep_reported_message(message_id: str, body: DecisionBody, current_admin: dict = Depends(get_current_admin)):
    with get_db() as (cur, conn):
        cur.execute(
            "UPDATE message_reports SET resolved_at = NOW(), resolved_by = %s::uuid, resolution = 'kept' WHERE message_id = %s::uuid AND resolved_at IS NULL RETURNING id",
            (current_admin["id"], message_id),
        )
        if not cur.fetchall():
            raise HTTPException(status_code=404, detail="No open reports on this message")
        conn.commit()
    log_action(current_admin["id"], "keep_message", "message", message_id, body.note)
    return {"ok": True}


# ── GET /admin/reports/blocks ───────────────────────────────────────────────────

@router.get("/blocks")
def list_blocks(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    current_admin: dict = Depends(get_current_admin),
):
    with get_db() as (cur, _):
        rows, total = _paginated(
            cur,
            "SELECT COUNT(*)::int AS count FROM user_blocks",
            [],
            """
            SELECT ub.id::text, ub.created_at,
                   blocker.id::text AS blocker_id, blocker.name AS blocker_name, blocker.phone AS blocker_phone,
                   blocked.id::text AS blocked_id, blocked.name AS blocked_name, blocked.phone AS blocked_phone
            FROM user_blocks ub
            JOIN users blocker ON blocker.id = ub.blocker_id
            JOIN users blocked ON blocked.id = ub.blocked_id
            ORDER BY ub.created_at DESC
            LIMIT %s OFFSET %s
            """,
            [],
            page, page_size,
        )
    return {"items": rows, "total": total, "page": page, "page_size": page_size}
