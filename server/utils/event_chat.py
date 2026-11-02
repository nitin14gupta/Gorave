"""Event group chat rules: who's in, when it opens and closes, who gets told.

A chat is one row in conversations (kind='event'), with its people in
conversation_members. sync_member() is the single place that decides
membership, called from every moment a ticket starts or stops being good.
"""
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from db.config import get_db
from utils.push import get_event_image_url, send_push_many
from utils.r2_client import r2_client
from utils import chat_realtime as rt

CLOSE_AFTER = timedelta(hours=24)
HIDE_AFTER = timedelta(days=7)
DELETE_AFTER = timedelta(days=30)
PUSH_GAP_MINUTES = 30
SOON = timedelta(hours=1)
# Same rule as the album: no end time means start + 6h.
ENDED_SQL = "COALESCE(e.end_time, e.date_time + INTERVAL '6 hours')"
ACTIVE_MEMBER = "m.left_at IS NULL AND m.removed_at IS NULL"
# Lines people read rather than say; they don't count as unread.
CHATTER = "msg.content_type <> 'system' AND msg.unsent_at IS NULL"


def ensure_chat(cur, event_id: str) -> str:
    cur.execute(
        """
        INSERT INTO conversations (kind, event_id, status) VALUES ('event', %s::uuid, 'active')
        ON CONFLICT (event_id) WHERE event_id IS NOT NULL DO NOTHING
        """,
        (event_id,),
    )
    cur.execute("SELECT id::text FROM conversations WHERE event_id = %s::uuid", (event_id,))
    conv_id = cur.fetchone()["id"]
    cur.execute(
        """
        INSERT INTO conversation_members (conversation_id, user_id, role)
        SELECT %s::uuid, host_id, 'host' FROM events WHERE id = %s::uuid
        ON CONFLICT DO NOTHING
        """,
        (conv_id, event_id),
    )
    return conv_id


def post_system(cur, conv_id: str, host_id: str, text: str) -> dict:
    cur.execute(
        """
        INSERT INTO messages (conversation_id, sender_id, content, content_type)
        VALUES (%s::uuid, %s::uuid, %s, 'system')
        RETURNING id::text, conversation_id::text, sender_id::text, content, content_type, sent_at
        """,
        (conv_id, host_id, text),
    )
    row = dict(cur.fetchone())
    row["sent_at"] = row["sent_at"].isoformat()
    cur.execute("UPDATE conversations SET last_message_at = NOW() WHERE id = %s::uuid", (conv_id,))
    return row


def sync_member(cur, event_id: str, user_id: str) -> None:
    """Puts someone in or out to match their ticket. Safe to call any time, and
    a problem here can never break the payment or cancel it's running inside."""
    cur.execute("SAVEPOINT event_chat_sync")
    try:
        _sync(cur, str(event_id), str(user_id))
        cur.execute("RELEASE SAVEPOINT event_chat_sync")
    except Exception as e:
        logging.warning(f"event chat sync failed for {event_id}/{user_id}: {e}")
        cur.execute("ROLLBACK TO SAVEPOINT event_chat_sync")


def _sync(cur, event_id: str, user_id: str) -> None:
    cur.execute("SELECT host_id::text, is_cancelled FROM events WHERE id = %s::uuid", (event_id,))
    ev = cur.fetchone()
    if not ev:
        return
    cur.execute(
        "SELECT 1 FROM event_attendees WHERE event_id = %s::uuid AND user_id = %s::uuid AND status = 'going' AND refunded_at IS NULL",
        (event_id, user_id),
    )
    has_ticket = cur.fetchone() is not None
    conv_id = ensure_chat(cur, event_id)
    cur.execute("SELECT closed_at FROM conversations WHERE id = %s::uuid", (conv_id,))
    if cur.fetchone()["closed_at"]:
        return
    cur.execute(
        "SELECT left_at, removed_at FROM conversation_members WHERE conversation_id = %s::uuid AND user_id = %s::uuid",
        (conv_id, user_id),
    )
    member = cur.fetchone()
    if user_id == ev["host_id"]:
        return
    wanted = has_ticket and not ev["is_cancelled"]
    if wanted and (member is None or (member["left_at"] and not member["removed_at"])):
        cur.execute(
            """
            INSERT INTO conversation_members (conversation_id, user_id) VALUES (%s::uuid, %s::uuid)
            ON CONFLICT (conversation_id, user_id) DO UPDATE SET left_at = NULL, joined_at = NOW()
            """,
            (conv_id, user_id),
        )
        cur.execute("SELECT split_part(name, ' ', 1) AS first FROM users WHERE id = %s::uuid", (user_id,))
        row = cur.fetchone()
        post_system(cur, conv_id, ev["host_id"], f"{(row and row['first']) or 'Someone'} joined")
    elif not wanted and member and not member["left_at"]:
        cur.execute(
            "UPDATE conversation_members SET left_at = NOW() WHERE conversation_id = %s::uuid AND user_id = %s::uuid",
            (conv_id, user_id),
        )


def note_moved(cur, event_id: str, host_id: str) -> None:
    """The event moved: tell the chat, and let the automatic lines run again."""
    cur.execute("SELECT id::text FROM conversations WHERE event_id = %s::uuid AND closed_at IS NULL", (event_id,))
    conv = cur.fetchone()
    if conv:
        post_system(cur, conv["id"], host_id, "The date of this event has changed.")
        cur.execute("UPDATE conversations SET moments = '{}' WHERE id = %s::uuid", (conv["id"],))


def leave_all(cur, user_id: str) -> None:
    """Account deleted."""
    cur.execute("UPDATE conversation_members SET left_at = NOW() WHERE user_id = %s::uuid AND left_at IS NULL", (user_id,))


def close_for_cancelled_event(cur, event_id: str, host_id: str) -> None:
    cur.execute("SELECT id::text, closed_at FROM conversations WHERE event_id = %s::uuid", (event_id,))
    conv = cur.fetchone()
    if not conv or conv["closed_at"]:
        return
    post_system(cur, conv["id"], host_id, "This event was cancelled, so the chat has closed.")
    cur.execute("UPDATE conversations SET closed_at = NOW() WHERE id = %s::uuid", (conv["id"],))


def summary_for_event(cur, event_id: str, user_id: str) -> Optional[dict]:
    """The event page's way in. None when this person isn't in the chat."""
    cur.execute(
        f"""
        SELECT c.closed_at, m.last_read_at,
            (SELECT COUNT(*)::int FROM messages msg
             WHERE msg.conversation_id = c.id AND msg.sender_id <> m.user_id AND msg.sent_at > m.last_read_at AND {CHATTER}) AS unread
        FROM conversations c JOIN conversation_members m ON m.conversation_id = c.id
        WHERE c.event_id = %s::uuid AND m.user_id = %s::uuid AND {ACTIVE_MEMBER}
          AND (c.closed_at IS NULL OR c.closed_at > NOW() - INTERVAL '{HIDE_AFTER.days} days')
        """,
        (event_id, user_id),
    )
    row = cur.fetchone()
    return {"unread": row["unread"], "closed": row["closed_at"] is not None} if row else None


# ── Pushes ───────────────────────────────────────────────────────────────────

def _chat_data(event_id: str) -> dict:
    return {"type": "event_chat", "event_id": event_id}


def push_update(event_id: str, conv_id: str, title: str, line: str, host_id: str) -> None:
    """A host update reaches everyone, muted or not: it can be "doors moved to 9"."""
    from routes.notifications import notify_chat_update
    with get_db() as (cur, conn):
        cur.execute(f"SELECT m.user_id::text FROM conversation_members m WHERE m.conversation_id = %s::uuid AND m.user_id <> %s::uuid AND {ACTIVE_MEMBER}", (conv_id, host_id))
        users = [r["user_id"] for r in cur.fetchall()]
        for u in users:
            notify_chat_update(cur, u, event_id, title, line)
        conn.commit()
    image = get_event_image_url(event_id)
    send_push_many([{"user_id": u, "title": title, "body": line, "data": _chat_data(event_id), "image_url": image} for u in users], category="attending")


def _due_for_rollup(cur, where: str, params: tuple) -> list:
    """People with unread chatter whose 30-minute gap has passed. Stamps them."""
    cur.execute(
        f"""
        WITH due AS (
            SELECT m.conversation_id, m.user_id,
                (SELECT COUNT(*)::int FROM messages msg
                 WHERE msg.conversation_id = m.conversation_id AND msg.sender_id <> m.user_id
                   AND msg.sent_at > m.last_read_at AND {CHATTER}) AS unread
            FROM conversation_members m JOIN conversations c ON c.id = m.conversation_id
            WHERE {ACTIVE_MEMBER} AND NOT m.muted AND c.closed_at IS NULL
              AND (m.last_pushed_at IS NULL OR m.last_pushed_at < NOW() - INTERVAL '{PUSH_GAP_MINUTES} minutes')
              AND {where}
        )
        UPDATE conversation_members m SET last_pushed_at = NOW()
        FROM due JOIN conversations c ON c.id = due.conversation_id JOIN events e ON e.id = c.event_id
        WHERE m.conversation_id = due.conversation_id AND m.user_id = due.user_id AND due.unread > 0
        RETURNING m.user_id::text, due.unread, c.event_id::text, e.title
        """,
        params,
    )
    return cur.fetchall()


def _send_rollups(rows: list) -> int:
    send_push_many([
        {"user_id": r["user_id"], "title": r["title"], "body": f"{r['unread']} new {'message' if r['unread'] == 1 else 'messages'}", "data": _chat_data(r["event_id"])}
        for r in rows
    ], category="attending")
    return len(rows)


def push_chatter(conv_id: str, sender_id: str, skip: set) -> int:
    """Called after each message: tells whoever's 30-minute gap has passed."""
    with get_db() as (cur, conn):
        rows = _due_for_rollup(cur, "m.conversation_id = %s::uuid AND m.user_id <> %s::uuid AND NOT (m.user_id = ANY(%s::uuid[]))", (conv_id, sender_id, list(skip)))
        conn.commit()
    return _send_rollups(rows)


def push_reply(event_id: str, conv_id: str, title: str, sender_id: str, sender_name: str, reply_to_id: str) -> None:
    """A reply to you skips the gap, unless you've muted the chat."""
    with get_db() as (cur, _):
        cur.execute(
            f"""
            SELECT msg.sender_id::text FROM messages msg
            JOIN conversation_members m ON m.conversation_id = msg.conversation_id AND m.user_id = msg.sender_id
            WHERE msg.id = %s::uuid AND msg.conversation_id = %s::uuid AND msg.sender_id <> %s::uuid AND NOT m.muted AND {ACTIVE_MEMBER}
            """,
            (reply_to_id, conv_id, sender_id),
        )
        row = cur.fetchone()
    if row:
        send_push_many([{"user_id": row["sender_id"], "title": title, "body": f"{sender_name} replied to you", "data": _chat_data(event_id)}], category="attending")


# ── The wrap-up job, every 15 minutes ────────────────────────────────────────

MOMENTS = (
    ("soon", "The night starts in about an hour."),
    ("started", "The night has started."),
    ("ended", "That's a wrap. Drop your pics in the album."),
)


def run_lifecycle() -> dict:
    """Moves each chat along: automatic lines, closing, the last push, and
    finally deletion. Times come from the event each run, so moving the event
    moves all of this with it. Returns frames for the caller to send live."""
    now = datetime.now(timezone.utc)
    frames = []
    closed = 0
    with get_db() as (cur, conn):
        cur.execute(
            f"""
            SELECT c.id::text, c.moments, e.host_id::text, e.date_time, {ENDED_SQL} AS ended_at
            FROM conversations c JOIN events e ON e.id = c.event_id
            WHERE c.kind = 'event' AND c.closed_at IS NULL AND e.is_cancelled = FALSE
              AND e.date_time < NOW() + INTERVAL '2 hours'
            """
        )
        for c in cur.fetchall():
            start, end = c["date_time"], c["ended_at"]
            reached = {"soon": now >= start - SOON, "started": now >= start, "ended": now > end}
            current = "ended" if reached["ended"] else "started" if reached["started"] else "soon" if reached["soon"] else None
            seen = set(c["moments"] or [])
            new = [k for k, _ in MOMENTS if reached[k] and k not in seen]
            for key, line in MOMENTS:
                # Only say the latest one if the job missed a beat.
                if key == current and key in new:
                    frames.append((c["id"], post_system(cur, c["id"], c["host_id"], line)))
            if new:
                cur.execute("UPDATE conversations SET moments = moments || %s WHERE id = %s::uuid", (new, c["id"]))
            if now > end + CLOSE_AFTER:
                frames.append((c["id"], post_system(cur, c["id"], c["host_id"], "This chat has closed. Your photos are in the album.")))
                cur.execute("UPDATE conversations SET closed_at = NOW() WHERE id = %s::uuid", (c["id"],))
                closed += 1
        rollups = _due_for_rollup(cur, "TRUE", ())
        conn.commit()
    return {"chat_frames": frames, "chats_closed": closed, "chat_rollups": _send_rollups(rollups), "chats_deleted": _delete_old()}


def _delete_old() -> int:
    """30 days after closing, the messages and their files go for good."""
    with get_db() as (cur, _):
        cur.execute(f"SELECT id::text FROM conversations WHERE kind = 'event' AND closed_at < NOW() - INTERVAL '{DELETE_AFTER.days} days' LIMIT 50")
        chats = [r["id"] for r in cur.fetchall()]
    for conv_id in chats:
        with get_db() as (cur, conn):
            cur.execute("SELECT metadata FROM messages WHERE conversation_id = %s::uuid AND metadata ? 'key'", (conv_id,))
            keys = {r["metadata"]["key"] for r in cur.fetchall()}
            cur.execute("DELETE FROM conversations WHERE id = %s::uuid", (conv_id,))
            conn.commit()
        for key in keys:
            with get_db() as (cur, _):
                # Forwarded in, so the same file may still live in a 1:1 chat.
                cur.execute("SELECT 1 FROM messages WHERE metadata->>'key' = %s LIMIT 1", (key,))
                used = cur.fetchone()
            if not used:
                r2_client.delete_file(key, bucket=rt.CHAT_BUCKET)
    return len(chats)
