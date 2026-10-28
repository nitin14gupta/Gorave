import asyncio
import json
import time
import uuid
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
from typing import Optional
from middleware.auth import get_current_user
from db.config import get_db
from utils.jwt import decode_token
from utils.push import send_push
from utils.link_preview import fetch_link_preview, UnsafeUrlError
from utils import chat_realtime as rt

router = APIRouter(tags=["chat"])

# Must match the `limit` default on GET /messages below — it's the only page size
# the client ever requests, so it's the only one ever cached/invalidated.
DEFAULT_MSG_PAGE_SIZE = 20
MSG_CACHE_TTL_SECONDS = 120


def _msg_cache_key(conv_id: str) -> str:
    return f"conv_msgs:{conv_id}:{DEFAULT_MSG_PAGE_SIZE}"


# Sockets, Redis fan-out, presence, rate limits, tickets and push batching
# live in utils/chat_realtime.py; these names keep the routes below readable.
_get_redis = rt.get_redis
_warn_redis = rt.warn_redis
_emit = rt.emit
_notify_inbox = rt.emit_inbox

# Every column a message is sent to the app with.
MSG_COLUMNS = (
    "id::text, conversation_id::text, sender_id::text, content, content_type, metadata, "
    "sent_at, read_at, delivered_at, reactions, forward_score, client_id::text, "
    "view_limit, views_used, media_purged_at"
)

# View once / view twice: photos and videos only, and a view-once video can
# be at most 12 seconds (a little slack for how phones round durations).
VIEW_LIMITS = {1, 2}
LIMITED_TYPES = {"image", "video"}
VIEW_ONCE_MAX_VIDEO_SECONDS = 12
# The link handed out on open only needs to last while the file downloads.
LIMITED_URL_TTL_SECONDS = 5 * 60
# What a limited message may show before it's opened: its shape, never the file.
_LIMITED_PUBLIC_METADATA = ("width", "height", "duration")


# What an app may send. A "ticket" card is created only by the server when
# someone passes a ticket on (routes/ticket_transfer.py), never by a client.
CLIENT_CONTENT_TYPES = {"text", "event", "profile", "image", "voice", "video", "gif"}


def _check_view_limit(view_limit, content_type: str, metadata) -> Optional[int]:
    """None for a normal message, 1 or 2 for view once/twice. Raises ValueError
    with what to tell the sender when the combination isn't allowed."""
    if view_limit in (None, 0):
        return None
    if view_limit not in VIEW_LIMITS:
        raise ValueError("View limit must be once or twice")
    if content_type not in LIMITED_TYPES:
        raise ValueError("Only photos and videos can be sent as view once")
    md = metadata if isinstance(metadata, dict) else {}
    if not (md.get("url") or md.get("key")):
        raise ValueError("Missing the photo or video")
    if content_type == "video" and view_limit == 1:
        try:
            duration = float(md.get("duration") or 0)
        except (TypeError, ValueError):
            duration = 0
        if duration <= 0 or duration > VIEW_ONCE_MAX_VIDEO_SECONDS + 0.5:
            raise ValueError(f"View once videos can be up to {VIEW_ONCE_MAX_VIDEO_SECONDS} seconds")
    return int(view_limit)


def _hide_limited_media(msg: dict) -> dict:
    """A view once/twice message goes out to everyone (sender included)
    without its file: just the shape, and whether it's been opened. The file
    is only reachable through POST /chat/messages/{id}/view."""
    if not msg.get("view_limit"):
        msg.pop("media_purged_at", None)
        return msg
    md = msg.get("metadata") if isinstance(msg.get("metadata"), dict) else {}
    out = {**msg, "metadata": {k: md[k] for k in _LIMITED_PUBLIC_METADATA if k in md} or None}
    out["media_expired"] = msg.get("media_purged_at") is not None
    out.pop("media_purged_at", None)
    return out


def _parse_client_id(value) -> Optional[str]:
    """The phone's own id for a message (a UUID), or None for older app versions."""
    if not isinstance(value, str):
        return None
    try:
        return str(uuid.UUID(value))
    except ValueError:
        return None


def _insert_message(
    cur, conv_id: str, uid: str, content, content_type: str, metadata,
    client_id: Optional[str] = None, forward_score: int = 0, forwarded_from_id: Optional[str] = None,
    view_limit: Optional[int] = None,
) -> tuple[dict, bool]:
    """Save a message once per (sender, client_id). Returns (row, created):
    a retry of something already saved gets the saved row back and
    created=False, so it is never stored, broadcast or pushed twice."""
    cur.execute(
        f"""
        INSERT INTO messages (conversation_id, sender_id, content, content_type, metadata,
                              client_id, forward_score, forwarded_from_id, view_limit)
        VALUES (%s::uuid, %s::uuid, %s, %s, %s, %s::uuid, %s, %s::uuid, %s)
        ON CONFLICT (sender_id, client_id) WHERE client_id IS NOT NULL DO NOTHING
        RETURNING {MSG_COLUMNS}
        """,
        (conv_id, uid, content, content_type, json.dumps(metadata) if metadata else None,
         client_id, forward_score, forwarded_from_id, view_limit),
    )
    row = cur.fetchone()
    if row:
        cur.execute("UPDATE conversations SET last_message_at = NOW() WHERE id = %s::uuid", (conv_id,))
        return dict(row), True
    cur.execute(
        f"SELECT {MSG_COLUMNS} FROM messages WHERE sender_id = %s::uuid AND client_id = %s::uuid",
        (uid, client_id),
    )
    return dict(cur.fetchone()), False


def _serialize(msg: dict) -> dict:
    out = dict(msg)
    for k in ("sent_at", "read_at", "delivered_at", "unsent_at", "edited_at"):
        if out.get(k) is not None and not isinstance(out[k], str):
            out[k] = out[k].isoformat()
    return rt.with_signed_media(_hide_limited_media(out))


async def _announce_delivered(conv_ids, uid: str) -> None:
    """The recipient's app now has these chats' messages: flip the sender's ticks."""
    for conv_id in conv_ids:
        await _emit(conv_id, {"type": "delivered", "conversation_id": conv_id, "user_id": uid}, skip_user=uid)


async def _invalidate_page_cache(conv_id: str) -> None:
    r = await _get_redis()
    if r:
        try:
            await r.delete(_msg_cache_key(conv_id))
        except Exception as e:
            _warn_redis("invalidate message cache", e)


# ── Pydantic models ───────────────────────────────────────────────────────────

# Same cap as Instagram DMs; the app stops typing at it and tells you to
# send and carry on in a new message.
MAX_MESSAGE_CHARS = 1000


class SendMessageRequest(BaseModel):
    content: Optional[str] = Field(None, max_length=MAX_MESSAGE_CHARS)
    content_type: str = "text"
    metadata: Optional[dict] = None
    # The phone's id for this message; retries reuse it (see _insert_message).
    client_id: Optional[str] = None
    # None = keep in chat, 1 = view once, 2 = view twice (photos/videos only).
    view_limit: Optional[int] = None


class MessageReportRequest(BaseModel):
    reason: str
    description: Optional[str] = None


# ── Helper: verify conversation participant ───────────────────────────────────

def _get_conversation(cur, conv_id: str, user_id: str) -> dict:
    cur.execute(
        """
        SELECT id::text, user1_id::text, user2_id::text, status
        FROM conversations
        WHERE id = %s::uuid AND (user1_id = %s::uuid OR user2_id = %s::uuid)
        """,
        (conv_id, user_id, user_id),
    )
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return dict(row)


# ── REST endpoints ────────────────────────────────────────────────────────────

@router.post("/chat/ws-ticket")
async def get_ws_ticket(current_user: dict = Depends(get_current_user)):
    """A one-time, 30-second pass for opening a chat or inbox socket, so the
    access token never goes in a socket URL (where proxies log it)."""
    uid = current_user["id"]
    if not await rt.allow(f"ticket:{uid}", (60, 60)):
        raise HTTPException(status_code=429, detail="Too many connection attempts")
    return {"ticket": await rt.issue_ticket(uid), "expires_in": rt.TICKET_TTL_SECONDS}


@router.get("/chat/link-preview")
async def get_link_preview(url: str = Query(...), current_user: dict = Depends(get_current_user)):
    """Fetches OG title/description/image for a link shared in chat — the
    same kind of unfurl WhatsApp/Instagram/iMessage do. Requires auth (like
    every other endpoint here) mainly to keep this from being an open proxy."""
    try:
        return await fetch_link_preview(url)
    except UnsafeUrlError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception:
        # Fetch/parse failures shouldn't break the chat UI — the client falls
        # back to a plain link when title/description/image all come back None.
        return {"url": url, "hostname": None, "title": None, "description": None, "image": None}


@router.get("/chat/conversations")
def list_conversations(
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    active_limit: int = Query(20, ge=1, le=100),
    active_offset: int = Query(0, ge=0),
    include_hidden: bool = Query(False),
):
    uid = current_user["id"]
    hidden_filter_sql = (
        ""
        if include_hidden
        else "\n              AND NOT (%s::uuid = ANY(COALESCE(c.hidden_by, '{}'::uuid[])))"
    )
    with get_db() as (cur, _):
        cur.execute(
            """
            SELECT
                c.id::text,
                c.status,
                c.last_message_at,
                c.user1_id::text,
                c.user2_id::text,
                -- Partner info
                CASE WHEN c.user1_id = %s::uuid THEN c.user2_id ELSE c.user1_id END AS partner_id,
                CASE WHEN c.user1_id = %s::uuid THEN u2.name ELSE u1.name END AS partner_name,
                CASE WHEN c.user1_id = %s::uuid THEN u2.username ELSE u1.username END AS partner_username,
                CASE WHEN c.user1_id = %s::uuid THEN p2.url ELSE p1.url END AS partner_avatar,
                CASE WHEN c.user1_id = %s::uuid THEN COALESCE(u2.is_deleted, FALSE) ELSE COALESCE(u1.is_deleted, FALSE) END AS partner_is_deleted,
                CASE WHEN c.user1_id = %s::uuid THEN u2.last_seen_at ELSE u1.last_seen_at END AS partner_last_seen_at,
                -- Last message
                m.content AS last_message,
                m.content_type AS last_message_type,
                m.view_limit AS last_view_limit,
                m.sender_id::text AS last_sender_id,
                m.sent_at AS last_sent_at,
                -- Unread count (messages not read by current user sent by partner)
                (
                    SELECT COUNT(*) FROM messages msg
                    WHERE msg.conversation_id = c.id
                      AND msg.sender_id != %s::uuid
                      AND msg.read_at IS NULL
                )::int AS unread_count,
                -- Block status from current user's perspective
                CASE
                    WHEN EXISTS(
                        SELECT 1 FROM user_blocks
                        WHERE blocker_id = %s::uuid
                          AND blocked_id = CASE WHEN c.user1_id = %s::uuid THEN c.user2_id ELSE c.user1_id END
                    ) THEN 'i_blocked'
                    WHEN EXISTS(
                        SELECT 1 FROM user_blocks
                        WHERE blocker_id = CASE WHEN c.user1_id = %s::uuid THEN c.user2_id ELSE c.user1_id END
                          AND blocked_id = %s::uuid
                    ) THEN 'they_blocked'
                    ELSE 'none'
                END AS block_status
            FROM conversations c
            JOIN users u1 ON u1.id = c.user1_id
            JOIN users u2 ON u2.id = c.user2_id
            LEFT JOIN LATERAL (
                SELECT url FROM user_photos
                WHERE user_id = c.user1_id ORDER BY position LIMIT 1
            ) p1 ON true
            LEFT JOIN LATERAL (
                SELECT url FROM user_photos
                WHERE user_id = c.user2_id ORDER BY position LIMIT 1
            ) p2 ON true
            LEFT JOIN LATERAL (
                -- Unsent messages are excluded here so the preview falls back
                -- to the previous message, exactly as if the unsent one was
                -- never sent at all — no "message was unsent" trace anywhere.
                SELECT content, content_type, sender_id, sent_at, view_limit FROM messages
                WHERE conversation_id = c.id
                  AND NOT (%s::uuid = ANY(COALESCE(deleted_for, '{}'::uuid[])))
                  AND unsent_at IS NULL
                ORDER BY sent_at DESC LIMIT 1
            ) m ON true
            WHERE (c.user1_id = %s::uuid OR c.user2_id = %s::uuid)""" + hidden_filter_sql + """
            ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
            """,
            (uid, uid, uid, uid, uid, uid, uid, uid, uid, uid, uid, uid, uid, uid) + (() if include_hidden else (uid,)),
        )
        rows = cur.fetchall()

    # Opening the inbox means this phone now has everything sent to you.
    with get_db() as (cur, conn):
        cur.execute(
            """
            UPDATE messages m SET delivered_at = NOW()
            FROM conversations c
            WHERE m.conversation_id = c.id
              AND (c.user1_id = %s::uuid OR c.user2_id = %s::uuid)
              AND c.status = 'active'
              AND m.sender_id != %s::uuid
              AND m.delivered_at IS NULL
            RETURNING m.conversation_id::text
            """,
            (uid, uid, uid),
        )
        delivered_convs = {row["conversation_id"] for row in cur.fetchall()}
        conn.commit()
    if delivered_convs:
        background_tasks.add_task(_announce_delivered, delivered_convs, uid)

    all_convs = []
    for r in rows:
        d = dict(r)
        d["partner_id"] = str(d["partner_id"])
        # Same rule as the thread: a deleted account's last message isn't shown.
        if d.get("partner_is_deleted") and str(d.get("last_sender_id")) == d["partner_id"]:
            d["last_message"] = None
            d["last_message_type"] = "unavailable"
        all_convs.append(d)

    pending = [c for c in all_convs if c["status"] == "pending" and c["last_sender_id"] != uid]
    active_all = [c for c in all_convs if c["status"] == "active"]
    locked = [c for c in all_convs if c["status"] == "pending" and c["last_sender_id"] == uid]

    active_page = active_all[active_offset:active_offset + active_limit]
    has_more = active_offset + active_limit < len(active_all)

    return {
        "pending": pending,
        "active": active_page,
        "locked": locked,
        "active_total": len(active_all),
        "has_more": has_more,
    }


@router.get("/chat/conversations/{conv_id}/messages")
async def list_messages(
    conv_id: str,
    before: Optional[str] = Query(None),
    limit: int = Query(DEFAULT_MSG_PAGE_SIZE, le=100),
    current_user: dict = Depends(get_current_user),
):
    uid = current_user["id"]
    with get_db() as (cur, _):
        conv = _get_conversation(cur, conv_id, uid)
        if conv["status"] != "active":
            raise HTTPException(status_code=403, detail="Conversation not yet active")

    # Redis cache for the initial page (no cursor, default page size) — TTL 120s.
    # The cache holds the RAW rows shared across both participants, so "deleted
    # for me" filtering must happen per-request below, never baked into the
    # cached payload. Only the default page size is cached/invalidated — a
    # non-default `limit` always goes straight to the DB.
    cacheable = not before and limit == DEFAULT_MSG_PAGE_SIZE
    cache_key = _msg_cache_key(conv_id)
    cached_result = None
    if cacheable:
        r = await _get_redis()
        if r:
            try:
                cached = await r.get(cache_key)
                if cached:
                    cached_result = json.loads(cached)
            except Exception as e:
                _warn_redis("get message cache", e)

    if cached_result is not None:
        result = cached_result
    else:
        with get_db() as (cur, _):
            # Unsent messages are excluded entirely — unsend means gone
            # without a trace for both participants, not a placeholder bubble.
            if before:
                cur.execute(
                    """
                    SELECT id::text, conversation_id::text, sender_id::text,
                           content, content_type, metadata, sent_at, read_at, reactions,
                           unsent_at, edited_at, deleted_for, forward_score,
                           delivered_at, client_id::text,
                           view_limit, views_used, media_purged_at
                    FROM messages
                    WHERE conversation_id = %s::uuid AND sent_at < %s
                      AND unsent_at IS NULL
                    ORDER BY sent_at DESC
                    LIMIT %s
                    """,
                    (conv_id, before, limit),
                )
            else:
                cur.execute(
                    """
                    SELECT id::text, conversation_id::text, sender_id::text,
                           content, content_type, metadata, sent_at, read_at, reactions,
                           unsent_at, edited_at, deleted_for, forward_score,
                           delivered_at, client_id::text,
                           view_limit, views_used, media_purged_at
                    FROM messages
                    WHERE conversation_id = %s::uuid
                      AND unsent_at IS NULL
                    ORDER BY sent_at DESC
                    LIMIT %s
                    """,
                    (conv_id, limit),
                )
            rows = cur.fetchall()

        result = []
        for r_row in rows:
            d = dict(r_row)
            for k in ("sent_at", "read_at", "delivered_at", "unsent_at", "edited_at", "media_purged_at"):
                if d.get(k) is not None:
                    d[k] = d[k].isoformat()
            result.append(d)

        # Cache the initial page (raw, unfiltered)
        if cacheable:
            r = await _get_redis()
            if r:
                try:
                    await r.set(cache_key, json.dumps(result), ex=MSG_CACHE_TTL_SECONDS)
                except Exception as e:
                    _warn_redis("set message cache", e)

    # Per-request filtering: hide messages this user deleted-for-themselves,
    # and never leak the deleted_for list itself to any client.
    result = [m for m in result if uid not in (m.get("deleted_for") or [])]
    for m in result:
        m.pop("deleted_for", None)

    # A deleted account's messages are no longer shown (like Instagram): the
    # bubble stays so the conversation reads in order, the content doesn't.
    partner = conv["user2_id"] if conv["user1_id"] == uid else conv["user1_id"]
    with get_db() as (cur, _):
        cur.execute("SELECT COALESCE(is_deleted, FALSE) AS d FROM users WHERE id = %s::uuid", (partner,))
        prow = cur.fetchone()
    if prow and prow["d"]:
        for m in result:
            if m.get("sender_id") == partner:
                m.update(content=None, content_type="unavailable", metadata=None, reactions=None, edited_at=None)

    # Opening the chat delivers anything the inbox hadn't picked up yet.
    if not before:
        with get_db() as (cur, conn):
            cur.execute(
                """
                UPDATE messages SET delivered_at = NOW()
                WHERE conversation_id = %s::uuid AND sender_id != %s::uuid AND delivered_at IS NULL
                RETURNING 1
                """,
                (conv_id, uid),
            )
            newly_delivered = bool(cur.fetchall())
            conn.commit()
        if newly_delivered:
            await _invalidate_page_cache(conv_id)
            await _announce_delivered([conv_id], uid)

    # Private media gets a fresh, expiring link per request (never cached).
    return [rt.with_signed_media(_hide_limited_media(m)) for m in result]


@router.patch("/chat/conversations/{conv_id}/read")
async def mark_read(conv_id: str, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, conn):
        _get_conversation(cur, conv_id, uid)
        cur.execute(
            """
            UPDATE messages SET read_at = NOW(), delivered_at = COALESCE(delivered_at, NOW())
            WHERE conversation_id = %s::uuid
              AND sender_id != %s::uuid
              AND read_at IS NULL
            RETURNING 1
            """,
            (conv_id, uid),
        )
        changed = bool(cur.fetchall())
        conn.commit()
    await rt.clear_pending_push(uid, conv_id)
    if changed:
        await _invalidate_page_cache(conv_id)
        await _emit(conv_id, {"type": "read", "user_id": uid}, skip_user=uid)
    return {"ok": True}


@router.delete("/chat/conversations/{conv_id}", status_code=200)
def delete_conversation(conv_id: str, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, conn):
        _get_conversation(cur, conv_id, uid)
        cur.execute(
            """
            UPDATE conversations
            SET hidden_by = array_append(
                COALESCE(hidden_by, '{}'::uuid[]),
                %s::uuid
            )
            WHERE id = %s::uuid
              AND NOT (%s::uuid = ANY(COALESCE(hidden_by, '{}'::uuid[])))
            """,
            (uid, conv_id, uid),
        )
        conn.commit()
    return {"ok": True}


@router.post("/chat/messages/{msg_id}/report", status_code=200)
def report_message(
    msg_id: str,
    body: MessageReportRequest,
    current_user: dict = Depends(get_current_user),
):
    uid = current_user["id"]
    with get_db() as (cur, conn):
        cur.execute(
            """
            SELECT m.id::text, m.conversation_id::text
            FROM messages m
            JOIN conversations c ON c.id = m.conversation_id
            WHERE m.id = %s::uuid AND (c.user1_id = %s::uuid OR c.user2_id = %s::uuid)
            """,
            (msg_id, uid, uid),
        )
        msg_row = cur.fetchone()
        if not msg_row:
            raise HTTPException(status_code=404, detail="Message not found")
        try:
            cur.execute(
                """
                INSERT INTO message_reports (message_id, reporter_id, reason, description)
                VALUES (%s::uuid, %s::uuid, %s, %s)
                """,
                (msg_id, uid, body.reason, body.description),
            )
            from routes.notifications import notify_report_submitted
            # entity_type="conversation" (not "message") — there's no screen
            # that can deep-link to one specific message, but the client can
            # already route straight to the conversation itself.
            notify_report_submitted(cur, uid, "conversation", msg_row["conversation_id"])
            conn.commit()
        except Exception:
            # Already reported by this user (unique constraint) — treat as success
            conn.rollback()
    return {"ok": True}


@router.post("/chat/messages/{msg_id}/unsend", status_code=200)
async def unsend_message(msg_id: str, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, conn):
        cur.execute(
            "SELECT id::text, conversation_id::text, sender_id::text FROM messages WHERE id = %s::uuid",
            (msg_id,),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Message not found")
        row = dict(row)
        if row["sender_id"] != uid:
            raise HTTPException(status_code=403, detail="You can only unsend your own messages")
        conv_id = row["conversation_id"]
        cur.execute(
            # Unsent rows are never shown to anyone, but a photo/video/voice
            # row keeps just its file's link and key so the cleanup job
            # (utils/chat_media_purge.py) can delete the file from storage.
            """
            UPDATE messages
            SET content = NULL, reactions = NULL, unsent_at = NOW(),
                metadata = CASE
                    WHEN content_type IN ('image', 'video', 'gif', 'voice')
                    THEN NULLIF(jsonb_strip_nulls(jsonb_build_object('url', metadata->'url', 'key', metadata->'key')), '{}'::jsonb)
                    ELSE NULL
                END
            WHERE id = %s::uuid
            """,
            (msg_id,),
        )
        conn.commit()

    r = await _get_redis()
    if r:
        try:
            await r.delete(_msg_cache_key(conv_id))
        except Exception as e:
            _warn_redis("invalidate cache on unsend", e)
    payload = {"type": "message_unsent", "message_id": msg_id, "conversation_id": conv_id}
    await _emit(conv_id, payload)
    return {"ok": True}


EDIT_WINDOW_MINUTES = 15


class EditMessageBody(BaseModel):
    content: str = Field(..., max_length=MAX_MESSAGE_CHARS)


@router.patch("/chat/messages/{msg_id}", status_code=200)
async def edit_message(msg_id: str, body: EditMessageBody, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    content = body.content.strip()
    if not content:
        raise HTTPException(status_code=422, detail="Message can't be empty")

    with get_db() as (cur, conn):
        cur.execute(
            """
            SELECT id::text, conversation_id::text, sender_id::text,
                   content_type, unsent_at, sent_at
            FROM messages WHERE id = %s::uuid
            """,
            (msg_id,),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Message not found")
        row = dict(row)
        if row["sender_id"] != uid:
            raise HTTPException(status_code=403, detail="You can only edit your own messages")
        if row["content_type"] != "text":
            raise HTTPException(status_code=422, detail="Only text messages can be edited")
        if row["unsent_at"] is not None:
            raise HTTPException(status_code=422, detail="This message was unsent")

        sent_at = row["sent_at"]
        if sent_at.tzinfo is None:
            sent_at = sent_at.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) - sent_at > timedelta(minutes=EDIT_WINDOW_MINUTES):
            raise HTTPException(status_code=422, detail=f"Editing window has passed ({EDIT_WINDOW_MINUTES} min)")

        conv_id = row["conversation_id"]
        cur.execute(
            "UPDATE messages SET content = %s, edited_at = NOW() WHERE id = %s::uuid RETURNING edited_at",
            (content, msg_id),
        )
        edited_at = cur.fetchone()["edited_at"].isoformat()
        conn.commit()

    r = await _get_redis()
    if r:
        try:
            await r.delete(_msg_cache_key(conv_id))
        except Exception as e:
            _warn_redis("invalidate cache on edit", e)
    payload = {
        "type": "message_edited", "message_id": msg_id, "conversation_id": conv_id,
        "content": content, "edited_at": edited_at,
    }
    await _emit(conv_id, payload)
    return {"ok": True, "content": content, "edited_at": edited_at}


@router.post("/chat/messages/{msg_id}/delete-for-me", status_code=200)
def delete_message_for_me(msg_id: str, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, conn):
        cur.execute(
            """
            SELECT m.id::text
            FROM messages m
            JOIN conversations c ON c.id = m.conversation_id
            WHERE m.id = %s::uuid AND (c.user1_id = %s::uuid OR c.user2_id = %s::uuid)
            """,
            (msg_id, uid, uid),
        )
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Message not found")
        cur.execute(
            """
            UPDATE messages
            SET deleted_for = array_append(COALESCE(deleted_for, '{}'::uuid[]), %s::uuid)
            WHERE id = %s::uuid
              AND NOT (%s::uuid = ANY(COALESCE(deleted_for, '{}'::uuid[])))
            """,
            (uid, msg_id, uid),
        )
        conn.commit()
    return {"ok": True}


@router.post("/chat/conversations/{conv_id}/messages", status_code=201)
async def send_message_rest(
    conv_id: str,
    body: SendMessageRequest,
    current_user: dict = Depends(get_current_user),
):
    uid = current_user["id"]
    # Shares a bucket with the WS "message" path (keyed by uid), across every
    # server process — spam via REST and via the socket are bounded together.
    if not await rt.allow(f"msg:{uid}", rt.MESSAGE_LIMIT):
        raise HTTPException(status_code=429, detail="You're sending messages too fast")
    try:
        metadata = await rt.clean_outgoing_metadata(body.metadata, uid)
    except PermissionError:
        raise HTTPException(status_code=403, detail="That file isn't yours to send")
    if body.content_type not in CLIENT_CONTENT_TYPES:
        raise HTTPException(status_code=422, detail="Unsupported message type")
    try:
        view_limit = _check_view_limit(body.view_limit, body.content_type, metadata)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    with get_db() as (cur, conn):
        conv = _get_conversation(cur, conv_id, uid)
        if conv["status"] != "active":
            raise HTTPException(status_code=403, detail="Conversation not yet active")

        partner_id = conv["user2_id"] if conv["user1_id"] == uid else conv["user1_id"]

        # Same block check as the WS "message" path, so nothing sent through
        # REST (voice fallback, ShareToChatSheet) can bypass a block.
        cur.execute(
            """
            SELECT 1 FROM user_blocks
            WHERE (blocker_id = %s::uuid AND blocked_id = %s::uuid)
               OR (blocker_id = %s::uuid AND blocked_id = %s::uuid)
            """,
            (uid, partner_id, partner_id, uid),
        )
        if cur.fetchone():
            raise HTTPException(status_code=403, detail="You can't message this person")

        msg, created = _insert_message(
            cur, conv_id, uid, body.content, body.content_type, metadata,
            client_id=_parse_client_id(body.client_id), view_limit=view_limit,
        )
        cur.execute("SELECT name FROM users WHERE id = %s::uuid", (uid,))
        sender_row = cur.fetchone()
        sender_name = sender_row["name"] if sender_row else "Someone"
        conn.commit()

    out = _serialize(msg)
    if created:
        await _deliver_new_message(conv_id, out, uid, partner_id, sender_name)
    return out


async def _deliver_new_message(
    conv_id: str, out: dict, sender_id: str, partner_id: Optional[str], sender_name: str,
    push: bool = True,
) -> None:
    """After a REST insert: drop the cached first page, send the message live
    (the sender's own app adds it from the HTTP response), bump both inboxes,
    and push the partner (batched, and skipped while they have the chat open)."""
    await _invalidate_page_cache(conv_id)
    await _emit(conv_id, {"type": "message", **out}, skip_user=sender_id)
    await _notify_inbox({sender_id, partner_id}, conv_id)
    if push:
        asyncio.create_task(rt.notify_new_message(partner_id, conv_id, sender_name))


# ── View once / view twice ────────────────────────────────────────────────────

@router.post("/chat/messages/{msg_id}/view")
async def view_limited_message(msg_id: str, current_user: dict = Depends(get_current_user)):
    """Open a view once/twice photo or video: spends one view and hands back a
    link that lasts 5 minutes. Only the recipient can open it, never the
    sender, and never again once the views are used up."""
    uid = current_user["id"]
    with get_db() as (cur, conn):
        cur.execute(
            """
            SELECT m.sender_id::text, m.conversation_id::text, m.view_limit, m.views_used,
                   m.media_purged_at, m.unsent_at,
                   COALESCE(u.is_deleted, FALSE) AS sender_deleted
            FROM messages m
            JOIN conversations c ON c.id = m.conversation_id
            JOIN users u ON u.id = m.sender_id
            WHERE m.id = %s::uuid AND (c.user1_id = %s::uuid OR c.user2_id = %s::uuid)
              AND NOT (%s::uuid = ANY(COALESCE(m.deleted_for, '{}'::uuid[])))
            """,
            (msg_id, uid, uid, uid),
        )
        row = cur.fetchone()
        if not row or row["unsent_at"] is not None or row["sender_deleted"] or not row["view_limit"]:
            raise HTTPException(status_code=404, detail="Message not found")
        if row["sender_id"] == uid:
            raise HTTPException(status_code=403, detail="You can't open a view once message you sent")
        if row["media_purged_at"] is not None:
            raise HTTPException(status_code=410, detail="This has expired")
        # Spend a view atomically: two taps at once can't both get the last one.
        cur.execute(
            """
            UPDATE messages
            SET views_used = views_used + 1,
                first_viewed_at = COALESCE(first_viewed_at, NOW()),
                last_viewed_at = NOW(),
                read_at = COALESCE(read_at, NOW()),
                delivered_at = COALESCE(delivered_at, NOW())
            WHERE id = %s::uuid AND views_used < view_limit AND media_purged_at IS NULL
            RETURNING content_type, metadata, view_limit, views_used
            """,
            (msg_id,),
        )
        spent = cur.fetchone()
        conn.commit()
    if not spent:
        raise HTTPException(status_code=410, detail="Already opened")

    md = spent["metadata"] or {}
    key = md.get("key")
    if key and rt.chat_media_private():
        url = rt.sign_chat_key(key, LIMITED_URL_TTL_SECONDS)
    else:
        url = md.get("url")
    conv_id = row["conversation_id"]
    await _invalidate_page_cache(conv_id)
    # Sender sees "Opened"; the viewer's other devices update their count.
    await _emit(conv_id, {
        "type": "message_viewed", "message_id": msg_id,
        "views_used": spent["views_used"], "view_limit": spent["view_limit"],
    })
    return {
        "url": url,
        "content_type": spent["content_type"],
        "metadata": {k: md[k] for k in _LIMITED_PUBLIC_METADATA if k in md},
        "view_limit": spent["view_limit"],
        "views_used": spent["views_used"],
    }


# ── Forward ───────────────────────────────────────────────────────────────────

FORWARDABLE_TYPES = {"text", "image", "video", "voice", "gif", "event", "profile"}
# Instagram-style: pick a few chats and send. Past FREQUENT_FORWARD_SCORE hops
# the app shows "Forwarded many times" and only one chat at a time is allowed.
MAX_FORWARD_TARGETS = 5
FREQUENT_FORWARD_SCORE = 5
# Context that belongs to the original thread, not the copy.
_THREAD_ONLY_METADATA = ("reply_to",)


class ForwardMessageBody(BaseModel):
    conversation_ids: list[str] = Field(..., min_length=1, max_length=MAX_FORWARD_TARGETS)


@router.post("/chat/messages/{msg_id}/forward", status_code=200)
async def forward_message(
    msg_id: str,
    body: ForwardMessageBody,
    current_user: dict = Depends(get_current_user),
):
    """Copy one message into up to 5 of your chats. The server reads the
    source itself, so only something you can actually see can be forwarded,
    and the copy never says who first sent it."""
    uid = current_user["id"]
    targets = list(dict.fromkeys(body.conversation_ids))  # de-dupe, keep order
    # Each chat counts as one send in the same bucket as typing a message, so
    # forwarding can't be used to get around the send rate limit.
    failed: list[dict] = []
    allowed: list[str] = []
    for conv_id in targets:
        if await rt.allow(f"msg:{uid}", rt.MESSAGE_LIMIT):
            allowed.append(conv_id)
        else:
            failed.append({"conversation_id": conv_id, "reason": "rate_limited"})

    with get_db() as (cur, conn):
        cur.execute(
            """
            SELECT m.content, m.content_type, m.metadata, m.forward_score, m.view_limit,
                   COALESCE(u.is_deleted, FALSE) AS sender_deleted
            FROM messages m
            JOIN conversations c ON c.id = m.conversation_id
            JOIN users u ON u.id = m.sender_id
            WHERE m.id = %s::uuid
              AND (c.user1_id = %s::uuid OR c.user2_id = %s::uuid)
              AND m.unsent_at IS NULL
              AND NOT (%s::uuid = ANY(COALESCE(m.deleted_for, '{}'::uuid[])))
            """,
            (msg_id, uid, uid, uid),
        )
        src = cur.fetchone()
        if not src or src["sender_deleted"]:
            raise HTTPException(status_code=404, detail="Message not found")
        src = dict(src)
        if src["content_type"] not in FORWARDABLE_TYPES:
            raise HTTPException(status_code=422, detail="This message can't be forwarded")
        if src["view_limit"]:
            raise HTTPException(status_code=422, detail="View once photos and videos can't be forwarded")
        if src["forward_score"] >= FREQUENT_FORWARD_SCORE and len(targets) > 1:
            raise HTTPException(
                status_code=422,
                detail="This was forwarded many times, so it can go to one chat at a time",
            )

        metadata = dict(src["metadata"] or {})
        for k in _THREAD_ONLY_METADATA:
            metadata.pop(k, None)
        score = src["forward_score"] + 1

        cur.execute("SELECT name FROM users WHERE id = %s::uuid", (uid,))
        me = cur.fetchone()
        sender_name = me["name"] if me else "Someone"

        sent: list[tuple[str, Optional[str], dict]] = []
        for conv_id in allowed:
            cur.execute(
                """
                SELECT c.user1_id::text, c.user2_id::text, c.status,
                       COALESCE(p.is_deleted, FALSE) AS partner_deleted,
                       EXISTS (
                         SELECT 1 FROM user_blocks b
                         WHERE (b.blocker_id = %s::uuid AND b.blocked_id = p.id)
                            OR (b.blocker_id = p.id AND b.blocked_id = %s::uuid)
                       ) AS blocked
                FROM conversations c
                JOIN users p ON p.id = CASE WHEN c.user1_id = %s::uuid THEN c.user2_id ELSE c.user1_id END
                WHERE c.id = %s::uuid AND (c.user1_id = %s::uuid OR c.user2_id = %s::uuid)
                """,
                (uid, uid, uid, conv_id, uid, uid),
            )
            conv = cur.fetchone()
            if not conv or conv["status"] != "active":
                failed.append({"conversation_id": conv_id, "reason": "not_found"})
                continue
            if conv["blocked"] or conv["partner_deleted"]:
                failed.append({"conversation_id": conv_id, "reason": "unavailable"})
                continue
            partner_id = conv["user2_id"] if conv["user1_id"] == uid else conv["user1_id"]
            msg, _ = _insert_message(
                cur, conv_id, uid, src["content"], src["content_type"], metadata,
                forward_score=score, forwarded_from_id=msg_id,
            )
            sent.append((conv_id, partner_id, _serialize(msg)))
        conn.commit()

    for conv_id, partner_id, out in sent:
        await _deliver_new_message(conv_id, out, uid, partner_id, sender_name)

    return {"sent": [c for c, _, _ in sent], "failed": failed, "messages": [o for _, _, o in sent]}


# ── WebSocket ─────────────────────────────────────────────────────────────────

# A socket logs in again at least this often (the app reconnects with a fresh
# ticket), so a revoked or expired session can't keep a socket open forever.
WS_SESSION_SECONDS = 3600
WS_SESSION_EXPIRED = 4000  # close code the app treats as "reconnect now"
WS_PING_SECONDS = 25


async def _ws_user(ticket: Optional[str], token: Optional[str]) -> Optional[tuple[str, float]]:
    """(user id, session deadline) from a one-time ticket — or, for app versions
    from before tickets, the access token in the URL, cut off when it expires."""
    if ticket:
        uid = await rt.redeem_ticket(ticket)
        return (uid, time.monotonic() + WS_SESSION_SECONDS) if uid else None
    if token:
        payload = decode_token(token)
        uid = payload.get("sub") if payload else None
        if not uid:
            return None
        exp = payload.get("exp")
        left = (exp - time.time()) if exp else WS_SESSION_SECONDS
        return uid, time.monotonic() + max(0.0, min(left, WS_SESSION_SECONDS))
    return None


async def _receive(websocket: WebSocket, deadline: float) -> Optional[str]:
    """Next frame, None on the ping interval. Raises TimeoutError at the deadline."""
    left = deadline - time.monotonic()
    if left <= 0:
        raise TimeoutError
    try:
        return await asyncio.wait_for(websocket.receive_text(), timeout=min(WS_PING_SECONDS, left))
    except asyncio.TimeoutError:
        if deadline - time.monotonic() <= 0:
            raise TimeoutError
        return None


def _touch_last_seen(uid: str) -> None:
    with get_db() as (cur, conn):
        cur.execute("UPDATE users SET last_seen_at = NOW() WHERE id = %s::uuid", (uid,))
        conn.commit()


async def _touch_last_seen_throttled(uid: str) -> None:
    # A real DB write, at most once a minute per user, so 25s keepalive pings
    # don't hammer the users table.
    r = await _get_redis()
    try:
        if r is None or await r.set(f"lastseen_throttle:{uid}", "1", ex=60, nx=True):
            _touch_last_seen(uid)
    except Exception as e:
        _warn_redis("throttle last_seen write", e)


@router.websocket("/ws/chat/{conv_id}")
async def chat_websocket(
    conv_id: str,
    websocket: WebSocket,
    ticket: Optional[str] = Query(None),
    token: Optional[str] = Query(None),
):
    auth = await _ws_user(ticket, token)
    if not auth:
        await websocket.close(code=4001)
        return
    uid, deadline = auth

    # Verify participant + active status, fetch partner_id for block checks
    try:
        with get_db() as (cur, _):
            cur.execute(
                """
                SELECT id::text, status, user1_id::text, user2_id::text FROM conversations
                WHERE id = %s::uuid AND (user1_id = %s::uuid OR user2_id = %s::uuid)
                  AND status = 'active'
                """,
                (conv_id, uid, uid),
            )
            conv_row = cur.fetchone()
            if not conv_row:
                await websocket.close(code=4003)
                return
            conv_row = dict(conv_row)
            partner_id = conv_row["user2_id"] if conv_row["user1_id"] == uid else conv_row["user1_id"]
    except Exception:
        await websocket.close(code=4003)
        return

    await websocket.accept()
    await rt.join_conv(conv_id, websocket, uid)

    # Online, "has this chat open" (so no pushes for it), and nothing waiting
    # to be summarised in a push any more.
    await rt.mark_present(uid, conv_id)
    await rt.clear_pending_push(uid, conv_id)
    await _touch_last_seen_throttled(uid)
    await websocket.send_text(json.dumps({
        "type": "online", "user_id": partner_id, "is_online": await rt.is_online(partner_id),
    }))
    await _emit(conv_id, {"type": "online", "user_id": uid, "is_online": True}, exclude=websocket, skip_user=uid)

    sender_name: Optional[str] = None

    async def keepalive():
        await rt.mark_present(uid, conv_id)
        await _touch_last_seen_throttled(uid)

    try:
        while True:
            try:
                raw = await _receive(websocket, deadline)
            except TimeoutError:
                await websocket.close(code=WS_SESSION_EXPIRED)
                break
            if raw is None:
                await websocket.send_text(json.dumps({"type": "pong"}))
                await keepalive()
                continue

            try:
                data = json.loads(raw)
            except ValueError:
                continue
            msg_type = data.get("type")

            if msg_type == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
                await keepalive()

            elif msg_type == "typing":
                if not await rt.allow(f"typing:{uid}", rt.TYPING_LIMIT):
                    continue
                payload = {
                    "type": "typing",
                    "user_id": uid,
                    "is_typing": data.get("is_typing", False),
                    "mode": data.get("mode", "text"),
                }
                await _emit(conv_id, payload, exclude=websocket, skip_user=uid)

            elif msg_type == "read":
                with get_db() as (cur, conn):
                    cur.execute(
                        """
                        UPDATE messages SET read_at = NOW(), delivered_at = COALESCE(delivered_at, NOW())
                        WHERE conversation_id = %s::uuid
                          AND sender_id != %s::uuid AND read_at IS NULL
                        RETURNING 1
                        """,
                        (conv_id, uid),
                    )
                    changed = bool(cur.fetchall())
                    conn.commit()
                await rt.clear_pending_push(uid, conv_id)
                if changed:
                    await _invalidate_page_cache(conv_id)
                    await _emit(conv_id, {"type": "read", "user_id": uid}, exclude=websocket, skip_user=uid)

            elif msg_type == "reaction":
                if not await rt.allow(f"reaction:{uid}", rt.REACTION_LIMIT):
                    continue
                msg_id = data.get("message_id")
                emoji = data.get("emoji")
                if not msg_id:
                    continue
                with get_db() as (cur, conn):
                    cur.execute(
                        "SELECT sender_id::text FROM messages WHERE id = %s::uuid AND conversation_id = %s::uuid",
                        (msg_id, conv_id),
                    )
                    msg_row = cur.fetchone()
                    if not msg_row:
                        continue
                    msg_author_id = msg_row["sender_id"]
                    if emoji:
                        cur.execute(
                            "UPDATE messages SET reactions = COALESCE(reactions, '{}'::jsonb) || %s::jsonb "
                            "WHERE id = %s::uuid AND conversation_id = %s::uuid",
                            (json.dumps({uid: emoji}), msg_id, conv_id),
                        )
                    else:
                        cur.execute(
                            "UPDATE messages SET reactions = COALESCE(reactions, '{}'::jsonb) - %s "
                            "WHERE id = %s::uuid AND conversation_id = %s::uuid",
                            (uid, msg_id, conv_id),
                        )
                    conn.commit()
                    if emoji and msg_author_id != uid and sender_name is None:
                        cur.execute("SELECT name FROM users WHERE id = %s::uuid", (uid,))
                        row = cur.fetchone()
                        sender_name = row["name"] if row else "Someone"
                await _invalidate_page_cache(conv_id)
                payload = {"type": "reaction", "message_id": msg_id, "user_id": uid, "emoji": emoji}
                await websocket.send_text(json.dumps(payload))
                await _emit(conv_id, payload, exclude=websocket, skip_user=uid)
                # Only worth a push if they aren't looking at the chat right now.
                if emoji and msg_author_id != uid and not await rt.has_chat_open(msg_author_id, conv_id):
                    asyncio.create_task(asyncio.to_thread(
                        send_push, msg_author_id, f"{sender_name} reacted",
                        f"{sender_name} reacted to your message",
                        {"type": "conversation", "conv_id": conv_id},
                    ))

            elif msg_type == "message":
                client_id = _parse_client_id(data.get("client_id"))
                if not await rt.allow(f"msg:{uid}", rt.MESSAGE_LIMIT):
                    await websocket.send_text(json.dumps({"type": "error", "code": "rate_limited", "client_id": client_id}))
                    continue

                content_type = data.get("content_type", "text")
                content = data.get("content")
                if isinstance(content, str) and len(content) > MAX_MESSAGE_CHARS:
                    await websocket.send_text(json.dumps({"type": "error", "code": "too_long", "client_id": client_id}))
                    continue
                if content_type not in CLIENT_CONTENT_TYPES:
                    await websocket.send_text(json.dumps({"type": "error", "code": "invalid", "detail": "Unsupported message type", "client_id": client_id}))
                    continue
                try:
                    metadata = await rt.clean_outgoing_metadata(data.get("metadata"), uid)
                    view_limit = _check_view_limit(data.get("view_limit"), content_type, metadata)
                except PermissionError:
                    await websocket.send_text(json.dumps({"type": "error", "code": "send_failed", "client_id": client_id}))
                    continue
                except ValueError as e:
                    await websocket.send_text(json.dumps({
                        "type": "error", "code": "invalid", "detail": str(e), "client_id": client_id,
                    }))
                    continue

                try:
                    with get_db() as (cur, conn):
                        # Block check before inserting
                        cur.execute(
                            """
                            SELECT 1 FROM user_blocks
                            WHERE (blocker_id = %s::uuid AND blocked_id = %s::uuid)
                               OR (blocker_id = %s::uuid AND blocked_id = %s::uuid)
                            """,
                            (uid, partner_id, partner_id, uid),
                        )
                        if cur.fetchone():
                            await websocket.send_text(json.dumps({"type": "error", "code": "blocked", "client_id": client_id}))
                            continue
                        msg, created = _insert_message(
                            cur, conv_id, uid, content, content_type, metadata,
                            client_id=client_id, view_limit=view_limit,
                        )
                        if created and sender_name is None:
                            cur.execute("SELECT name FROM users WHERE id = %s::uuid", (uid,))
                            row = cur.fetchone()
                            sender_name = row["name"] if row else "Someone"
                        conn.commit()
                except Exception as db_err:
                    print(f"[WS] message insert failed: {db_err}", flush=True)
                    await websocket.send_text(json.dumps({"type": "error", "code": "send_failed", "client_id": client_id}))
                    continue

                out = {"type": "message", **_serialize(msg)}
                # Echo back so the app swaps its waiting bubble for the saved one
                # (a resend of something already saved just gets this echo).
                await websocket.send_text(json.dumps(out))
                if not created:
                    continue
                await _invalidate_page_cache(conv_id)
                # Everyone else in the chat, including the sender's other devices.
                await _emit(conv_id, out, exclude=websocket)
                await _notify_inbox({uid, partner_id}, conv_id)
                asyncio.create_task(rt.notify_new_message(partner_id, conv_id, sender_name or "Someone"))

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"[WS] chat/{conv_id} unexpected error: {e!r}", flush=True)
    finally:
        await rt.leave_conv(conv_id, websocket)
        await rt.clear_present(uid, conv_id)
        try:
            _touch_last_seen(uid)
        except Exception as e:
            print(f"[WS] failed to write last_seen_at on disconnect: {e}", flush=True)
        if not rt.has_local_socket(conv_id, uid):
            await _emit(conv_id, {"type": "online", "user_id": uid, "is_online": False}, skip_user=uid)


@router.websocket("/ws/inbox")
async def inbox_websocket(
    websocket: WebSocket,
    ticket: Optional[str] = Query(None),
    token: Optional[str] = Query(None),
):
    """One socket per open conversation-list screen. Doesn't join any
    conversation room — it only receives `conversation_updated` pings so the
    list can bump the right row to the top and refetch, the way WhatsApp's
    chat list updates live."""
    auth = await _ws_user(ticket, token)
    if not auth:
        await websocket.close(code=4001)
        return
    uid, deadline = auth

    await websocket.accept()
    await rt.join_inbox(websocket, uid)
    try:
        while True:
            try:
                raw = await _receive(websocket, deadline)
            except TimeoutError:
                await websocket.close(code=WS_SESSION_EXPIRED)
                break
            if raw is None:
                await websocket.send_text(json.dumps({"type": "pong"}))
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"[WS] inbox/{uid} unexpected error: {e!r}", flush=True)
    finally:
        await rt.leave_inbox(websocket, uid)
