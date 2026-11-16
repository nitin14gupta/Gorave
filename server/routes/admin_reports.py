from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Query, Depends, HTTPException
from pydantic import BaseModel

from db.config import get_db
from middleware.admin_auth import get_current_admin, require_admin_role
from routes.admin_users import lock_account
from routes.events import _cancel_event_and_refund, _refund_past_event
from routes.notifications import _insert_notification
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
    if not photo["removed_at"]:
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


# ── People: reports grouped by who was reported, then acted on ─────────────

class ActionBody(BaseModel):
    note: Optional[str] = None


def _need_note(body: ActionBody, what: str) -> str:
    note = (body.note or "").strip()
    if not note:
        raise HTTPException(status_code=400, detail=f"Add a {what}. They'll see it.")
    return note


def _warn(user_id: str, note: str) -> None:
    """A note from the team: in their notifications and as a push."""
    with get_db() as (cur, conn):
        _insert_notification(cur, user_id, "safety_warning", title="A note from the Gorave team", body=note)
        conn.commit()
    try:
        send_push(user_id, "A note from the Gorave team", note)
    except Exception:
        pass


@router.get("/users")
def list_user_reports(
    status: str = Query(default="open", pattern="^(open|done)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_admin: dict = Depends(get_current_admin),
):
    """One row per reported person, most reported first."""
    where = _status_sql("ur", status)
    with get_db() as (cur, _):
        rows, total = _paginated(
            cur,
            f"SELECT COUNT(DISTINCT ur.reported_id)::int AS count FROM user_reports ur WHERE {where}",
            [],
            f"""
            SELECT u.id::text AS user_id, u.name, u.username, u.phone, u.city, u.created_at AS joined_at,
                   COALESCE(u.is_locked, FALSE) AS is_locked, (u.id_verified_at IS NOT NULL) AS id_verified,
                   (SELECT p.url FROM user_photos p WHERE p.user_id = u.id ORDER BY p.position LIMIT 1) AS avatar,
                   (SELECT COUNT(*) FROM events e WHERE e.host_id = u.id AND e.is_cancelled = FALSE)::int AS hosted_count,
                   COUNT(ur.id)::int AS report_count, array_agg(DISTINCT ur.reason) AS reasons,
                   array_agg(DISTINCT split_part(rp.name, ' ', 1)) AS reporter_names,
                   MAX(ur.created_at) AS last_reported_at, MAX(ur.resolution) AS resolution,
                   MAX(ur.resolution_note) AS resolution_note, MAX(ur.resolved_at) AS resolved_at,
                   (SELECT COUNT(*) FROM user_reports x WHERE x.reported_id = u.id AND x.resolution IN ('warned', 'locked'))::int AS past_actions
            FROM user_reports ur
            JOIN users u ON u.id = ur.reported_id
            JOIN users rp ON rp.id = ur.reporter_id
            WHERE {where}
            GROUP BY u.id
            ORDER BY {"report_count DESC, last_reported_at DESC" if status == "open" else "resolved_at DESC"}
            LIMIT %s OFFSET %s
            """,
            [],
            page, page_size,
        )
    return {"items": rows, "total": total, "page": page, "page_size": page_size}


def _close_user_reports(user_id: str, admin_id: str, resolution: str, note: Optional[str]) -> int:
    with get_db() as (cur, conn):
        cur.execute(
            """
            UPDATE user_reports SET resolved_at = NOW(), resolved_by = %s::uuid, resolution = %s, resolution_note = %s
            WHERE reported_id = %s::uuid AND resolved_at IS NULL RETURNING id
            """,
            (admin_id, resolution, note, user_id),
        )
        n = len(cur.fetchall())
        conn.commit()
    return n


@router.post("/users/{user_id}/dismiss")
def dismiss_user_reports(user_id: str, body: ActionBody, current_admin: dict = Depends(get_current_admin)):
    """Nothing to act on. Closes the reports; the person isn't told."""
    if not _close_user_reports(user_id, current_admin["id"], "dismissed", body.note):
        raise HTTPException(status_code=404, detail="No open reports on this person")
    log_action(current_admin["id"], "dismiss_user_reports", "user", user_id, body.note)
    return {"ok": True}


@router.post("/users/{user_id}/warn")
def warn_user(user_id: str, body: ActionBody, current_admin: dict = Depends(get_current_admin)):
    """A first step: tell them what's not OK, in your words."""
    note = _need_note(body, "message")
    if not _close_user_reports(user_id, current_admin["id"], "warned", note):
        raise HTTPException(status_code=404, detail="No open reports on this person")
    _warn(user_id, note)
    log_action(current_admin["id"], "warn_user", "user", user_id, note)
    return {"ok": True}


@router.post("/users/{user_id}/lock")
def lock_reported_user(user_id: str, body: ActionBody, current_admin: dict = Depends(require_admin_role("super_admin"))):
    """Locks the account (they can appeal once) and closes the reports."""
    note = _need_note(body, "reason")
    lock_account(user_id, note, current_admin["id"])
    _close_user_reports(user_id, current_admin["id"], "locked", note)
    return {"ok": True}


# ── Events: reports grouped by event, then acted on ────────────────────────

@router.get("/events")
def list_event_reports(
    status: str = Query(default="open", pattern="^(open|done)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_admin: dict = Depends(get_current_admin),
):
    """One row per reported event, most reported first, with what reporters said."""
    where = _status_sql("er", status)
    with get_db() as (cur, _):
        rows, total = _paginated(
            cur,
            f"SELECT COUNT(DISTINCT er.event_id)::int AS count FROM event_reports er WHERE {where}",
            [],
            f"""
            SELECT e.id::text AS event_id, e.title, e.date_time, e.city, e.area, e.price_inr, e.is_cancelled,
                   (e.cover_photos->>0) AS cover,
                   (SELECT COUNT(*) FROM event_attendees ea WHERE ea.event_id = e.id AND ea.status = 'going')::int AS going,
                   h.id::text AS host_id, h.name AS host_name, h.phone AS host_phone, COALESCE(h.is_locked, FALSE) AS host_locked,
                   (h.id_verified_at IS NOT NULL) AS host_verified,
                   (COALESCE(e.end_time, e.date_time) < NOW()) AS is_past, (e.date_time <= NOW()) AS has_started,
                   e.payout_held_at,
                   (SELECT COALESCE(SUM(ea.price_paid_inr + COALESCE(ea.fee_paid_inr, 0)), 0) FROM event_attendees ea WHERE ea.event_id = e.id AND ea.status = 'going' AND ea.payment_id IS NOT NULL AND ea.refunded_at IS NULL)::int AS paid_unrefunded_inr,
                   COUNT(er.id)::int AS report_count, array_agg(DISTINCT er.reason) AS reasons,
                   array_remove(array_agg(DISTINCT er.description), NULL) AS descriptions,
                   MAX(er.created_at) AS last_reported_at, MAX(er.resolution) AS resolution,
                   MAX(er.resolution_note) AS resolution_note, MAX(er.resolved_at) AS resolved_at
            FROM event_reports er
            JOIN events e ON e.id = er.event_id
            JOIN users h ON h.id = e.host_id
            WHERE {where}
            GROUP BY e.id, h.id
            ORDER BY {"report_count DESC, last_reported_at DESC" if status == "open" else "resolved_at DESC"}
            LIMIT %s OFFSET %s
            """,
            [],
            page, page_size,
        )
    return {"items": rows, "total": total, "page": page, "page_size": page_size}


def _close_event_reports(event_id: str, admin_id: str, resolution: str, note: Optional[str]) -> int:
    with get_db() as (cur, conn):
        cur.execute(
            """
            UPDATE event_reports SET resolved_at = NOW(), resolved_by = %s::uuid, resolution = %s, resolution_note = %s
            WHERE event_id = %s::uuid AND resolved_at IS NULL RETURNING id
            """,
            (admin_id, resolution, note, event_id),
        )
        n = len(cur.fetchall())
        conn.commit()
    return n


def _host_of(event_id: str) -> dict:
    with get_db() as (cur, _):
        cur.execute("SELECT host_id::text, is_cancelled, title, (date_time <= NOW()) AS started FROM events WHERE id = %s::uuid", (event_id,))
        ev = cur.fetchone()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    return ev


@router.post("/events/{event_id}/dismiss")
def dismiss_event_reports(event_id: str, body: ActionBody, current_admin: dict = Depends(get_current_admin)):
    if not _close_event_reports(event_id, current_admin["id"], "dismissed", body.note):
        raise HTTPException(status_code=404, detail="No open reports on this event")
    log_action(current_admin["id"], "dismiss_event_reports", "event", event_id, body.note)
    return {"ok": True}


@router.post("/events/{event_id}/warn")
def warn_host(event_id: str, body: ActionBody, current_admin: dict = Depends(get_current_admin)):
    """Tell the host what needs fixing (wrong details, misleading photos, rules)."""
    note = _need_note(body, "message")
    ev = _host_of(event_id)
    if not _close_event_reports(event_id, current_admin["id"], "warned", note):
        raise HTTPException(status_code=404, detail="No open reports on this event")
    _warn(ev["host_id"], f"About {ev['title']}: {note}")
    log_action(current_admin["id"], "warn_host", "event", event_id, note)
    return {"ok": True}


@router.post("/events/{event_id}/cancel")
def cancel_reported_event(event_id: str, body: ActionBody, background_tasks: BackgroundTasks, current_admin: dict = Depends(require_admin_role("super_admin"))):
    """A fake or unsafe event: cancel it. Every guest is refunded and told,
    the same as a force-cancel from the event page."""
    note = _need_note(body, "reason")
    ev = _host_of(event_id)
    if ev["is_cancelled"]:
        raise HTTPException(status_code=400, detail="This event is already cancelled")
    if ev["started"]:
        raise HTTPException(status_code=400, detail="This event has already started. Refund the guests instead.")
    _cancel_event_and_refund(event_id, background_tasks, cancelled_by_admin=True)
    _close_event_reports(event_id, current_admin["id"], "cancelled", note)
    _warn(ev["host_id"], f"We cancelled {ev['title']} after reports from guests. {note}")
    log_action(current_admin["id"], "force_cancel_event", "event", event_id, note)
    return {"ok": True}


@router.post("/events/{event_id}/lock-host")
def lock_reported_host(event_id: str, body: ActionBody, background_tasks: BackgroundTasks, current_admin: dict = Depends(require_admin_role("super_admin"))):
    """The worst case (a scam or a dangerous host): cancel the event if it's
    still on, refund everyone, and lock the host. They can appeal once."""
    note = _need_note(body, "reason")
    ev = _host_of(event_id)
    if ev["started"] and not ev["is_cancelled"]:
        _refund_past_event(event_id, note)
    elif not ev["is_cancelled"]:
        _cancel_event_and_refund(event_id, background_tasks, cancelled_by_admin=True)
    lock_account(ev["host_id"], note, current_admin["id"])
    _close_event_reports(event_id, current_admin["id"], "host_locked", note)
    log_action(current_admin["id"], "force_cancel_event", "event", event_id, note)
    return {"ok": True}


@router.post("/events/{event_id}/refund")
def refund_reported_event(event_id: str, body: ActionBody, current_admin: dict = Depends(require_admin_role("super_admin"))):
    """It already happened and was rigged: refund every guest who paid, and
    the host isn't paid for it."""
    note = _need_note(body, "reason")
    ev = _host_of(event_id)
    if ev["is_cancelled"]:
        raise HTTPException(status_code=400, detail="This event is cancelled, guests were already refunded")
    if not ev["started"]:
        raise HTTPException(status_code=400, detail="This event hasn't started. Cancel it instead.")
    res = _refund_past_event(event_id, note)
    _close_event_reports(event_id, current_admin["id"], "refunded", note)
    _warn(ev["host_id"], f"After reports from guests about {ev['title']}, we refunded them and you won't be paid for it. {note}")
    log_action(current_admin["id"], "refund_event", "event", event_id, f"{note} ({res['refunded']} guests, ₹{res['amount']})")
    return {"ok": True, **res}


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
    if not msg["unsent_at"]:
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
