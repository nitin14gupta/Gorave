import asyncio
import json
import os
import time
import uuid
from collections import deque
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
from typing import Optional
from middleware.auth import get_current_user
from db.config import get_db
from utils.jwt import decode_token
from utils.push import send_push
from utils.link_preview import fetch_link_preview, UnsafeUrlError

router = APIRouter(tags=["chat"])

# Must match the `limit` default on GET /messages below — it's the only page size
# the client ever requests, so it's the only one ever cached/invalidated.
DEFAULT_MSG_PAGE_SIZE = 20
MSG_CACHE_TTL_SECONDS = 120


def _msg_cache_key(conv_id: str) -> str:
    return f"conv_msgs:{conv_id}:{DEFAULT_MSG_PAGE_SIZE}"


# Every event is delivered to this worker's own sockets directly and published
# to Redis for the other workers. Tagging what we publish with this id lets our
# own Redis listeners skip it, so nobody on this worker gets everything twice.
_WORKER_ID = uuid.uuid4().hex


# ── In-memory socket registry (fallback when Redis is unavailable) ────────────

_conv_sockets: dict[str, set] = {}
# Per-user sockets for the conversation LIST screen — lets it reorder/update
# live (like WhatsApp) without being connected to any specific conversation's
# /ws/chat/{conv_id} room.
_user_sockets: dict[str, set] = {}


async def _broadcast_local(conv_id: str, data: dict, exclude=None, exclude_user: Optional[str] = None) -> None:
    """Broadcast directly to every WS in this conversation except the sender
    (one socket via `exclude`, or all of a user's sockets via `exclude_user`)."""
    room = _conv_sockets.get(conv_id, set())
    dead = set()
    for ws in list(room):
        if ws is exclude:
            continue
        if exclude_user and getattr(ws.state, "uid", None) == exclude_user:
            continue
        try:
            await ws.send_text(json.dumps(data))
        except Exception:
            dead.add(ws)
    room -= dead


async def _broadcast_user_local(user_id: str, data: dict) -> None:
    """Push directly to every open inbox socket for this user (their other devices/tabs)."""
    room = _user_sockets.get(user_id, set())
    dead = set()
    for ws in list(room):
        try:
            await ws.send_text(json.dumps(data))
        except Exception:
            dead.add(ws)
    room -= dead


class RateLimiter:
    """Simple in-memory sliding-window limiter, one bucket per key. Not shared
    across processes — same tradeoff as _conv_sockets/_user_sockets above,
    which are already per-worker-only with Redis pub/sub as the cross-server
    fallback. Good enough to stop a single abusive/buggy client from spamming
    DB writes + broadcasts + push notifications."""

    def __init__(self, max_events: int, window_seconds: float):
        self.max_events = max_events
        self.window_seconds = window_seconds
        self._buckets: dict[str, deque] = {}

    def allow(self, key: str) -> bool:
        now = time.monotonic()
        bucket = self._buckets.setdefault(key, deque())
        while bucket and now - bucket[0] > self.window_seconds:
            bucket.popleft()
        if len(bucket) >= self.max_events:
            return False
        bucket.append(now)
        return True

    def discard(self, key: str) -> None:
        self._buckets.pop(key, None)


# Message sends: ~1.5/sec sustained, bursts up to 15 in a 10s window.
_message_limiter = RateLimiter(max_events=15, window_seconds=10)
_typing_limiter = RateLimiter(max_events=20, window_seconds=10)
_reaction_limiter = RateLimiter(max_events=20, window_seconds=10)


async def _emit(conv_id: str, data: dict, exclude=None, exclude_user: Optional[str] = None) -> None:
    """Send an event to everyone in a conversation: this worker's sockets
    directly, every other worker through Redis (whose listeners already skip
    a user's own messages)."""
    await _broadcast_local(conv_id, data, exclude=exclude, exclude_user=exclude_user)
    await _publish(f"conv:{conv_id}", data)


async def _notify_inbox(participant_ids: set[str], conv_id: str) -> None:
    """Tells both participants' conversation-list screens that this
    conversation has a new last message, so they can bump it to the top —
    in-memory first (same-worker), Redis as fallback for multi-server."""
    payload = {"type": "conversation_updated", "conversation_id": conv_id}
    for pid in participant_ids:
        if not pid:
            continue
        await _broadcast_user_local(pid, payload)
        await _publish(f"inbox:{pid}", payload)


# ── Redis helpers ─────────────────────────────────────────────────────────────

_redis = None
_redis_last_warn = 0.0
_REDIS_WARN_COOLDOWN_SECONDS = 60.0


def _warn_redis(context: str, e: Exception) -> None:
    global _redis_last_warn
    now = time.monotonic()
    if now - _redis_last_warn > _REDIS_WARN_COOLDOWN_SECONDS:
        _redis_last_warn = now
        print(f"[CHAT] Redis unavailable ({context}): {e!r} — "
              f"caching disabled, cross-server broadcast degraded", flush=True)


async def _get_redis():
    global _redis
    if _redis is None:
        try:
            import redis.asyncio as aioredis
            _redis = aioredis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"), decode_responses=True)
            await _redis.ping()
        except Exception as e:
            _redis = None
            _warn_redis("connect", e)
    return _redis


async def _publish(channel: str, data: dict) -> None:
    r = await _get_redis()
    if r:
        try:
            await r.publish(channel, json.dumps({**data, "_origin": _WORKER_ID}))
        except Exception as e:
            _warn_redis("publish", e)


# ── Auth helper for WebSocket ─────────────────────────────────────────────────

def _user_from_token(token: str) -> dict:
    payload = decode_token(token)
    user_id = payload.get("sub") if payload else None
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    return {"id": user_id}


# ── Pydantic models ───────────────────────────────────────────────────────────

# Same cap as Instagram DMs; the app stops typing at it and tells you to
# send and carry on in a new message.
MAX_MESSAGE_CHARS = 1000


class SendMessageRequest(BaseModel):
    content: Optional[str] = Field(None, max_length=MAX_MESSAGE_CHARS)
    content_type: str = "text"
    metadata: Optional[dict] = None


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
                SELECT content, content_type, sender_id, sent_at FROM messages
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
                           unsent_at, edited_at, deleted_for, forward_score
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
                           unsent_at, edited_at, deleted_for, forward_score
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
            if d.get("sent_at"):
                d["sent_at"] = d["sent_at"].isoformat()
            if d.get("unsent_at"):
                d["unsent_at"] = d["unsent_at"].isoformat()
            if d.get("edited_at"):
                d["edited_at"] = d["edited_at"].isoformat()
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

    return result


@router.patch("/chat/conversations/{conv_id}/read")
def mark_read(conv_id: str, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, conn):
        _get_conversation(cur, conv_id, uid)
        cur.execute(
            """
            UPDATE messages SET read_at = NOW()
            WHERE conversation_id = %s::uuid
              AND sender_id != %s::uuid
              AND read_at IS NULL
            """,
            (conv_id, uid),
        )
        conn.commit()
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
            "UPDATE messages SET content = NULL, metadata = NULL, reactions = NULL, unsent_at = NOW() WHERE id = %s::uuid",
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
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    uid = current_user["id"]
    # Shares a bucket with the WS "message" path (keyed by uid) — spam sent
    # via REST fallback and spam sent via the socket are bounded together.
    if not _message_limiter.allow(f"msg:{uid}"):
        raise HTTPException(status_code=429, detail="You're sending messages too fast")

    partner_id = None
    with get_db() as (cur, conn):
        conv = _get_conversation(cur, conv_id, uid)
        if conv["status"] != "active":
            raise HTTPException(status_code=403, detail="Conversation not yet active")

        partner_id = conv["user2_id"] if conv["user1_id"] == uid else conv["user1_id"]

        # Same block check as the WS "message" path — the REST endpoint used
        # to skip this entirely, which meant anything sent through it
        # (voice fallback, and now ShareToChatSheet) could bypass a block.
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

        cur.execute(
            """
            INSERT INTO messages (conversation_id, sender_id, content, content_type, metadata)
            VALUES (%s::uuid, %s::uuid, %s, %s, %s)
            RETURNING id::text, conversation_id::text, sender_id::text, content, content_type,
                      metadata, sent_at, read_at, reactions, forward_score
            """,
            (conv_id, uid, body.content, body.content_type, json.dumps(body.metadata) if body.metadata else None),
        )
        msg = dict(cur.fetchone())
        cur.execute(
            "UPDATE conversations SET last_message_at = NOW() WHERE id = %s::uuid",
            (conv_id,),
        )
        cur.execute("SELECT name FROM users WHERE id = %s::uuid", (uid,))
        sender_row = cur.fetchone()
        sender_name = sender_row["name"] if sender_row else "Someone"
        conn.commit()

    out = {**msg, "sent_at": msg["sent_at"].isoformat()}
    await _deliver_new_message(conv_id, out, uid, partner_id, sender_name, background_tasks)
    return out


async def _deliver_new_message(
    conv_id: str, out: dict, sender_id: str, partner_id: Optional[str],
    sender_name: str, background_tasks: BackgroundTasks,
) -> None:
    """After a REST insert: drop the cached first page, send the message live
    to both sides (the sender's other devices too), bump both inboxes, push."""
    r = await _get_redis()
    if r:
        try:
            await r.delete(_msg_cache_key(conv_id))
        except Exception as e:
            _warn_redis("invalidate cache on REST send", e)
    # The sender's app adds its own copy from the HTTP response.
    await _emit(conv_id, {"type": "message", **out}, exclude_user=sender_id)
    asyncio.create_task(_notify_inbox({sender_id, partner_id}, conv_id))
    if partner_id:
        # Deliberately generic — no message preview in the push payload, even
        # though the server can read the plaintext, to avoid leaking content
        # into notification trays/lockscreens. Same copy for text and media.
        background_tasks.add_task(
            send_push, partner_id, sender_name, "Sent you a message",
            {"type": "conversation", "conv_id": conv_id},
        )


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
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    """Copy one message into up to 5 of your chats. The server reads the
    source itself, so only something you can actually see can be forwarded,
    and the copy never says who first sent it."""
    uid = current_user["id"]
    targets = list(dict.fromkeys(body.conversation_ids))  # de-dupe, keep order

    with get_db() as (cur, conn):
        cur.execute(
            """
            SELECT m.content, m.content_type, m.metadata, m.forward_score,
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
        failed: list[dict] = []
        for conv_id in targets:
            # Same per-user bucket as typing a message, so forwarding can't be
            # used to get around the send rate limit.
            if not _message_limiter.allow(f"msg:{uid}"):
                failed.append({"conversation_id": conv_id, "reason": "rate_limited"})
                continue
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
            cur.execute(
                """
                INSERT INTO messages (conversation_id, sender_id, content, content_type, metadata,
                                      forward_score, forwarded_from_id)
                VALUES (%s::uuid, %s::uuid, %s, %s, %s, %s, %s::uuid)
                RETURNING id::text, conversation_id::text, sender_id::text, content, content_type,
                          metadata, sent_at, read_at, reactions, forward_score
                """,
                (conv_id, uid, src["content"], src["content_type"],
                 json.dumps(metadata) if metadata else None, score, msg_id),
            )
            msg = dict(cur.fetchone())
            cur.execute("UPDATE conversations SET last_message_at = NOW() WHERE id = %s::uuid", (conv_id,))
            sent.append((conv_id, partner_id, {**msg, "sent_at": msg["sent_at"].isoformat()}))
        conn.commit()

    for conv_id, partner_id, out in sent:
        await _deliver_new_message(conv_id, out, uid, partner_id, sender_name, background_tasks)

    return {"sent": [c for c, _, _ in sent], "failed": failed, "messages": [o for _, _, o in sent]}


# ── WebSocket ─────────────────────────────────────────────────────────────────

@router.websocket("/ws/chat/{conv_id}")
async def chat_websocket(
    conv_id: str,
    websocket: WebSocket,
    token: str = Query(...),
):
    # Auth
    try:
        user = _user_from_token(token)
    except HTTPException:
        await websocket.close(code=4001)
        return

    uid = user["id"]
    partner_id: str | None = None

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
    websocket.state.uid = uid

    # Register this socket for direct in-memory broadcast
    _conv_sockets.setdefault(conv_id, set()).add(websocket)

    r = await _get_redis()

    async def redis_listener():
        if not r:
            return
        try:
            async with r.pubsub() as ps:
                await ps.subscribe(f"conv:{conv_id}")
                async for raw in ps.listen():
                    if raw["type"] != "message":
                        continue
                    data = json.loads(raw["data"])
                    # Already delivered on this worker by _broadcast_local.
                    if data.pop("_origin", None) == _WORKER_ID:
                        continue
                    # Never echo someone's own message, typing or presence back to them.
                    if data.get("sender_id") == uid or data.get("user_id") == uid:
                        continue
                    try:
                        await websocket.send_text(json.dumps(data))
                    except Exception:
                        break
        except Exception as e:
            _warn_redis(f"pubsub listener conv:{conv_id}", e)

    listener_task = asyncio.create_task(redis_listener())

    async def _mark_online():
        if not r:
            return
        try:
            await r.set(f"online:{uid}", "1", ex=35)
        except Exception as e:
            _warn_redis("set online presence", e)

    async def _touch_last_seen():
        # Real DB write, throttled to once/60s per user so a chat screen's
        # 25s keepalive pings don't hammer the users table.
        if not r:
            with get_db() as (cur, conn):
                cur.execute("UPDATE users SET last_seen_at = NOW() WHERE id = %s::uuid", (uid,))
                conn.commit()
            return
        try:
            if await r.set(f"lastseen_throttle:{uid}", "1", ex=60, nx=True):
                with get_db() as (cur, conn):
                    cur.execute("UPDATE users SET last_seen_at = NOW() WHERE id = %s::uuid", (uid,))
                    conn.commit()
        except Exception as e:
            _warn_redis("throttle last_seen write", e)

    # Mark user online, tell the partner we just came online, and tell
    # ourselves whether the partner is currently online.
    await _mark_online()
    await _touch_last_seen()
    partner_online = False
    if r and partner_id:
        try:
            partner_online = bool(await r.get(f"online:{partner_id}"))
        except Exception as e:
            _warn_redis("read partner online", e)
    await websocket.send_text(json.dumps({"type": "online", "user_id": partner_id, "is_online": partner_online}))
    online_payload = {"type": "online", "user_id": uid, "is_online": True}
    await _emit(conv_id, online_payload, exclude=websocket)

    try:
        while True:
            try:
                raw = await asyncio.wait_for(websocket.receive_text(), timeout=25.0)
            except asyncio.TimeoutError:
                # Keepalive ping
                await websocket.send_text(json.dumps({"type": "pong"}))
                await _mark_online()
                await _touch_last_seen()
                continue

            data = json.loads(raw)
            msg_type = data.get("type")

            if msg_type == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
                await _mark_online()
                await _touch_last_seen()

            elif msg_type == "typing":
                if not _typing_limiter.allow(f"typing:{uid}"):
                    continue
                payload = {
                    "type": "typing",
                    "user_id": uid,
                    "is_typing": data.get("is_typing", False),
                    "mode": data.get("mode", "text"),
                }
                await _emit(conv_id, payload, exclude=websocket)

            elif msg_type == "read":
                with get_db() as (cur, conn):
                    cur.execute(
                        """
                        UPDATE messages SET read_at = NOW()
                        WHERE conversation_id = %s::uuid
                          AND sender_id != %s::uuid AND read_at IS NULL
                        """,
                        (conv_id, uid),
                    )
                    conn.commit()
                await _emit(conv_id, {"type": "read", "user_id": uid}, exclude=websocket)

            elif msg_type == "reaction":
                if not _reaction_limiter.allow(f"reaction:{uid}"):
                    continue
                msg_id = data.get("message_id")
                emoji = data.get("emoji")
                if msg_id and emoji:
                    # Get message author for push notification
                    with get_db() as (cur, _):
                        cur.execute(
                            "SELECT sender_id::text FROM messages WHERE id = %s::uuid AND conversation_id = %s::uuid",
                            (msg_id, conv_id),
                        )
                        msg_row = cur.fetchone()
                        msg_author_id = msg_row["sender_id"] if msg_row else None
                        if msg_author_id and msg_author_id != uid:
                            cur.execute("SELECT name FROM users WHERE id = %s::uuid", (uid,))
                            reactor_row = cur.fetchone()
                            reactor_name = reactor_row["name"] if reactor_row else "Someone"
                            asyncio.create_task(asyncio.to_thread(
                                send_push, msg_author_id, f"{reactor_name} reacted",
                                f"{reactor_name} reacted to your message",
                                {"type": "conversation", "conv_id": conv_id},
                            ))
                if msg_id:
                    with get_db() as (cur, conn):
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
                    payload = {"type": "reaction", "message_id": msg_id, "user_id": uid, "emoji": emoji}
                    await websocket.send_text(json.dumps(payload))
                    await _emit(conv_id, payload, exclude=websocket)

            elif msg_type == "message":
                if not _message_limiter.allow(f"msg:{uid}"):
                    await websocket.send_text(json.dumps({"type": "error", "code": "rate_limited"}))
                    continue

                content = data.get("content")
                content_type = data.get("content_type", "text")
                metadata = data.get("metadata")

                # Block check before inserting
                if partner_id:
                    with get_db() as (cur, _):
                        cur.execute(
                            """
                            SELECT 1 FROM user_blocks
                            WHERE (blocker_id = %s::uuid AND blocked_id = %s::uuid)
                               OR (blocker_id = %s::uuid AND blocked_id = %s::uuid)
                            """,
                            (uid, partner_id, partner_id, uid),
                        )
                        if cur.fetchone():
                            await websocket.send_text(json.dumps({"type": "error", "code": "blocked"}))
                            continue

                try:
                    with get_db() as (cur, conn):
                        cur.execute(
                            """
                            INSERT INTO messages (conversation_id, sender_id, content, content_type, metadata)
                            VALUES (%s::uuid, %s::uuid, %s, %s, %s)
                            RETURNING id::text, conversation_id::text, sender_id::text,
                                      content, content_type, metadata, sent_at, read_at, reactions,
                                      forward_score
                            """,
                            (conv_id, uid, content, content_type,
                             json.dumps(metadata) if metadata else None),
                        )
                        msg = dict(cur.fetchone())
                        cur.execute(
                            "UPDATE conversations SET last_message_at = NOW() WHERE id = %s::uuid",
                            (conv_id,),
                        )
                        conn.commit()
                except Exception as db_err:
                    print(f"[WS] message insert failed: {db_err}", flush=True)
                    await websocket.send_text(json.dumps({"type": "error", "code": "send_failed"}))
                    continue

                out = {
                    "type": "message",
                    **msg,
                    "sent_at": msg["sent_at"].isoformat(),
                }
                # Invalidate the cached initial message page for this conversation
                if r:
                    try:
                        await r.delete(_msg_cache_key(conv_id))
                    except Exception as e:
                        _warn_redis("invalidate cache on WS message", e)
                # Echo back to sender immediately
                await websocket.send_text(json.dumps(out))
                # Broadcast to partner — in-memory first (always works), Redis as fallback for multi-server
                await _emit(conv_id, out, exclude=websocket)
                await _notify_inbox({uid, partner_id}, conv_id)

                # Push notification to partner
                if partner_id:
                    with get_db() as (cur, _):
                        cur.execute("SELECT name FROM users WHERE id = %s::uuid", (uid,))
                        ws_sender_row = cur.fetchone()
                        ws_sender_name = ws_sender_row["name"] if ws_sender_row else "Someone"
                    # Same deliberate no-preview policy as the REST send path above.
                    ws_preview = "Sent you a message"
                    asyncio.create_task(asyncio.to_thread(
                        send_push, partner_id, ws_sender_name, ws_preview,
                        {"type": "conversation", "conv_id": conv_id},
                    ))

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"[WS] chat/{conv_id} unexpected error: {e}", flush=True)
    finally:
        listener_task.cancel()
        # Deregister from in-memory room
        _conv_sockets.get(conv_id, set()).discard(websocket)
        _message_limiter.discard(f"msg:{uid}")
        _typing_limiter.discard(f"typing:{uid}")
        _reaction_limiter.discard(f"reaction:{uid}")
        try:
            with get_db() as (cur, conn):
                cur.execute("UPDATE users SET last_seen_at = NOW() WHERE id = %s::uuid", (uid,))
                conn.commit()
        except Exception as e:
            print(f"[WS] failed to write last_seen_at on disconnect: {e}", flush=True)
        offline_payload = {"type": "online", "user_id": uid, "is_online": False}
        await _emit(conv_id, offline_payload)
        if r:
            try:
                await r.delete(f"online:{uid}")
            except Exception as e:
                _warn_redis("clear online presence", e)


@router.websocket("/ws/inbox")
async def inbox_websocket(websocket: WebSocket, token: str = Query(...)):
    """One socket per open conversation-list screen. Doesn't join any
    conversation room — it only receives `conversation_updated` pings (see
    _notify_inbox above) so the list can bump the right row to the top and
    refetch, the same way WhatsApp's chat list updates live."""
    try:
        user = _user_from_token(token)
    except HTTPException:
        await websocket.close(code=4001)
        return

    uid = user["id"]
    await websocket.accept()
    _user_sockets.setdefault(uid, set()).add(websocket)

    r = await _get_redis()

    async def redis_listener():
        if not r:
            return
        try:
            async with r.pubsub() as ps:
                await ps.subscribe(f"inbox:{uid}")
                async for raw in ps.listen():
                    if raw["type"] != "message":
                        continue
                    data = json.loads(raw["data"])
                    if data.pop("_origin", None) == _WORKER_ID:
                        continue
                    try:
                        await websocket.send_text(json.dumps(data))
                    except Exception:
                        break
        except Exception as e:
            _warn_redis(f"pubsub listener inbox:{uid}", e)

    listener_task = asyncio.create_task(redis_listener())

    try:
        while True:
            try:
                await asyncio.wait_for(websocket.receive_text(), timeout=25.0)
            except asyncio.TimeoutError:
                await websocket.send_text(json.dumps({"type": "pong"}))
                continue
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"[WS] inbox/{uid} unexpected error: {e}", flush=True)
    finally:
        listener_task.cancel()
        _user_sockets.get(uid, set()).discard(websocket)
