import asyncio
import json
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from db.config import get_db
from middleware.auth import get_current_user
from routes.chat import (
    CLIENT_CONTENT_TYPES, MAX_MESSAGE_CHARS, MSG_COLUMNS, WS_SESSION_EXPIRED, _insert_message,
    _parse_client_id, _receive, _serialize, _ws_user,
)
from utils import chat_realtime as rt, event_chat as ec

router = APIRouter(tags=["event-chat"])

CLOSED_FOR_GOOD = f"(c.closed_at IS NULL OR c.closed_at > NOW() - INTERVAL '{ec.HIDE_AFTER.days} days')"
SEEN_LIMIT = 50
MEMBER_FACE = "(SELECT ph.url FROM user_photos ph WHERE ph.user_id = u.id ORDER BY ph.position LIMIT 1)"
MESSAGE_SELECT = "m.id::text, m.conversation_id::text, m.sender_id::text, m.content, m.content_type, m.metadata, m.sent_at, m.reactions, m.client_id::text, m.edited_at"
SENDER_COLUMNS = f"u.name AS sender_name, {MEMBER_FACE} AS sender_avatar"


def _load(cur, event_id: str, uid: str) -> dict:
    """The chat and this person's place in it, or the reason they can't be here."""
    cur.execute(
        f"""
        SELECT c.id::text, c.event_id::text, c.posting_locked, c.closed_at, c.pinned_message_id::text,
            e.title, e.host_id::text, e.date_time::text, e.cover_photos, e.area,
            m.role, m.muted, m.left_at, m.removed_at
        FROM conversations c JOIN events e ON e.id = c.event_id
        LEFT JOIN conversation_members m ON m.conversation_id = c.id AND m.user_id = %s::uuid
        WHERE c.event_id = %s::uuid AND {CLOSED_FOR_GOOD}
        """,
        (uid, event_id),
    )
    chat = cur.fetchone()
    if not chat:
        raise HTTPException(status_code=404, detail="This chat is no longer available")
    if not chat["role"] or chat["left_at"] or chat["removed_at"]:
        raise HTTPException(status_code=403, detail="This chat is for confirmed guests")
    return dict(chat)


def _require_host(chat: dict) -> None:
    if chat["role"] != "host":
        raise HTTPException(status_code=403, detail="Only the host can do this")


def _block_error(chat: dict, uid: str) -> Optional[str]:
    if chat["closed_at"]:
        return "closed"
    if chat["posting_locked"] and chat["host_id"] != uid:
        return "locked"
    return None


def _out(row: dict, host_id: str) -> dict:
    d = dict(row)
    name, avatar = d.pop("sender_name", None), d.pop("sender_avatar", None)
    d = rt.with_signed_media(_serialize(d))
    d["sender"] = {"id": d["sender_id"], "name": name, "avatar": avatar, "is_host": d["sender_id"] == host_id}
    return d


def _blocked_ids(cur, uid: str) -> list:
    cur.execute(
        """
        SELECT blocked_id::text AS other FROM user_blocks WHERE blocker_id = %s::uuid
        UNION SELECT blocker_id::text FROM user_blocks WHERE blocked_id = %s::uuid
        """,
        (uid, uid),
    )
    return [r["other"] for r in cur.fetchall()]


def _member_count(cur, conv_id: str) -> int:
    cur.execute(f"SELECT COUNT(*)::int AS n FROM conversation_members m WHERE m.conversation_id = %s::uuid AND {ec.ACTIVE_MEMBER}", (conv_id,))
    return cur.fetchone()["n"]


def _pinned(cur, conv_id: str, message_id: Optional[str], host_id: str) -> Optional[dict]:
    if not message_id:
        return None
    cur.execute(
        f"""
        SELECT {MESSAGE_SELECT}, {SENDER_COLUMNS} FROM messages m JOIN users u ON u.id = m.sender_id
        WHERE m.id = %s::uuid AND m.conversation_id = %s::uuid AND m.unsent_at IS NULL
        """,
        (message_id, conv_id),
    )
    row = cur.fetchone()
    return _out(row, host_id) if row else None


def _cover(photos) -> Optional[str]:
    first = photos[0] if photos else None
    return first if isinstance(first, str) else (first or {}).get("url") if first else None


def _save_message(event_id: str, uid: str, content, content_type: str, metadata, client_id) -> tuple:
    """Everything a guest message has to pass, for the socket and REST alike.
    Returns (saved, created, chat, error code)."""
    with get_db() as (cur, conn):
        try:
            chat = _load(cur, event_id, uid)
        except HTTPException:
            return None, False, None, "gone"
        error = _block_error(chat, uid)
        if error:
            return None, False, chat, error
        msg, created = _insert_message(cur, chat["id"], uid, content, content_type, metadata, client_id=client_id)
        cur.execute(f"SELECT {SENDER_COLUMNS} FROM users u WHERE u.id = %s::uuid", (uid,))
        sender = cur.fetchone()
        conn.commit()
    return _out({**msg, **sender}, chat["host_id"]), created, chat, None


async def _announce(event_id: str, chat: dict, out: dict, uid: str, metadata: Optional[dict], exclude=None) -> None:
    await rt.emit(chat["id"], {"type": "message", **out}, exclude=exclude)
    with get_db() as (cur, _):
        cur.execute(f"SELECT m.user_id::text FROM conversation_members m WHERE m.conversation_id = %s::uuid AND {ec.ACTIVE_MEMBER}", (chat["id"],))
        members = [r["user_id"] for r in cur.fetchall()]
    await rt.emit_inbox(set(members), chat["id"])
    in_chat = {u for u, here in zip(members, await asyncio.gather(*(rt.has_chat_open(u, chat["id"]) for u in members))) if here}
    await asyncio.to_thread(ec.push_chatter, chat["id"], uid, in_chat)
    reply_to = ((metadata or {}).get("reply_to") or {}).get("message_id")
    if reply_to:
        await asyncio.to_thread(ec.push_reply, event_id, chat["id"], chat["title"], uid, (out["sender"]["name"] or "Someone").split(" ")[0], reply_to)


# ── List and read ────────────────────────────────────────────────────────────

@router.get("/event-chats")
def list_chats(current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, _):
        blocked = _blocked_ids(cur, uid)
        cur.execute(
            f"""
            SELECT c.event_id::text, c.closed_at, c.last_message_at, c.posting_locked, m.muted,
                e.title, e.date_time::text, e.cover_photos,
                (SELECT COUNT(*)::int FROM conversation_members cm WHERE cm.conversation_id = c.id AND cm.left_at IS NULL AND cm.removed_at IS NULL) AS member_count,
                (SELECT COUNT(*)::int FROM messages msg
                 WHERE msg.conversation_id = c.id AND msg.sender_id <> m.user_id AND msg.sent_at > m.last_read_at
                   AND {ec.CHATTER} AND NOT (msg.sender_id = ANY(%(blocked)s::uuid[]))) AS unread_count,
                last.content AS last_message, last.content_type AS last_message_type, last.sent_at AS last_sent_at,
                split_part(last_u.name, ' ', 1) AS last_sender_name, last.sender_id::text AS last_sender_id
            FROM conversation_members m
            JOIN conversations c ON c.id = m.conversation_id
            JOIN events e ON e.id = c.event_id
            LEFT JOIN LATERAL (
                SELECT msg.content, msg.content_type, msg.sent_at, msg.sender_id FROM messages msg
                WHERE msg.conversation_id = c.id AND msg.unsent_at IS NULL AND NOT (msg.sender_id = ANY(%(blocked)s::uuid[]))
                ORDER BY msg.sent_at DESC LIMIT 1
            ) last ON TRUE
            LEFT JOIN users last_u ON last_u.id = last.sender_id
            WHERE m.user_id = %(me)s::uuid AND {ec.ACTIVE_MEMBER} AND {CLOSED_FOR_GOOD}
            ORDER BY (c.closed_at IS NULL) DESC, COALESCE(c.last_message_at, c.created_at) DESC
            """,
            {"me": uid, "blocked": blocked},
        )
        rows = cur.fetchall()
    return [{
        **{k: v for k, v in r.items() if k not in ("cover_photos", "closed_at", "last_message_at", "last_sent_at")},
        "cover": _cover(r["cover_photos"]),
        "closed": r["closed_at"] is not None,
        "last_sent_at": r["last_sent_at"].isoformat() if r["last_sent_at"] else None,
    } for r in rows]


@router.get("/event-chats/{event_id}")
def get_chat(event_id: str, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, _):
        chat = _load(cur, event_id, uid)
        return {
            "event_id": chat["event_id"], "conversation_id": chat["id"], "title": chat["title"], "date_time": chat["date_time"],
            "area": chat["area"], "cover": _cover(chat["cover_photos"]), "host_id": chat["host_id"],
            "is_host": chat["role"] == "host", "posting_locked": chat["posting_locked"], "closed": chat["closed_at"] is not None,
            "muted": chat["muted"], "member_count": _member_count(cur, chat["id"]),
            "pinned": _pinned(cur, chat["id"], chat["pinned_message_id"], chat["host_id"]),
            "blocked_ids": _blocked_ids(cur, uid),
        }


@router.get("/event-chats/{event_id}/messages")
def get_messages(event_id: str, before: Optional[str] = Query(None), limit: int = Query(30, ge=1, le=100), current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, _):
        chat = _load(cur, event_id, uid)
        blocked = _blocked_ids(cur, uid)
        cur.execute(
            f"""
            SELECT {MESSAGE_SELECT}, {SENDER_COLUMNS} FROM messages m JOIN users u ON u.id = m.sender_id
            WHERE m.conversation_id = %(conv)s::uuid AND m.unsent_at IS NULL
              AND NOT (%(me)s::uuid = ANY(COALESCE(m.deleted_for, '{{}}'::uuid[])))
              AND (m.content_type = 'system' OR NOT (m.sender_id = ANY(%(blocked)s::uuid[])))
              AND (%(before)s::timestamptz IS NULL OR m.sent_at < %(before)s::timestamptz)
            ORDER BY m.sent_at DESC LIMIT %(limit)s
            """,
            {"conv": chat["id"], "me": uid, "blocked": blocked, "before": before, "limit": limit},
        )
        rows = cur.fetchall()
        cur.execute(
            f"""
            SELECT m.user_id::text AS id, m.last_read_at, u.name, {MEMBER_FACE} AS avatar
            FROM conversation_members m JOIN users u ON u.id = m.user_id
            WHERE m.conversation_id = %s::uuid AND {ec.ACTIVE_MEMBER} AND m.user_id <> %s::uuid AND NOT (m.user_id = ANY(%s::uuid[]))
            ORDER BY m.last_read_at DESC LIMIT {SEEN_LIMIT}
            """,
            (chat["id"], uid, blocked),
        )
        seen = [{**r, "last_read_at": r["last_read_at"].isoformat()} for r in cur.fetchall()]
    return {"messages": [_out(r, chat["host_id"]) for r in rows], "seen": seen}


class MessageBody(BaseModel):
    content: Optional[str] = None
    content_type: str = "text"
    metadata: Optional[dict] = None
    client_id: Optional[str] = None


@router.post("/event-chats/{event_id}/messages")
async def send_message(event_id: str, body: MessageBody, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    if body.content_type not in CLIENT_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Invalid message")
    if body.content and len(body.content) > MAX_MESSAGE_CHARS:
        raise HTTPException(status_code=400, detail="Message is too long")
    if not await rt.allow(f"msg:{uid}", rt.MESSAGE_LIMIT):
        raise HTTPException(status_code=429, detail="Slow down a little")
    metadata = await rt.clean_outgoing_metadata(body.metadata, uid)
    out, created, chat, error = _save_message(event_id, uid, body.content, body.content_type, metadata, _parse_client_id(body.client_id))
    if error:
        raise HTTPException(status_code=403, detail={"gone": "You're no longer in this chat", "closed": "This chat has closed", "locked": "Only the host can post right now"}[error])
    if created:
        background_tasks.add_task(_announce, event_id, chat, out, uid, metadata)
    return out


def _mark_read(event_id: str, uid: str) -> Optional[dict]:
    with get_db() as (cur, conn):
        chat = _load(cur, event_id, uid)
        cur.execute(
            "UPDATE conversation_members SET last_read_at = NOW() WHERE conversation_id = %s::uuid AND user_id = %s::uuid RETURNING last_read_at",
            (chat["id"], uid),
        )
        at = cur.fetchone()["last_read_at"]
        cur.execute(f"SELECT u.name, {MEMBER_FACE} AS avatar FROM users u WHERE u.id = %s::uuid", (uid,))
        me = cur.fetchone()
        conn.commit()
    return {"conv_id": chat["id"], "frame": {"type": "read", "user_id": uid, "name": me["name"], "avatar": me["avatar"], "at": at.isoformat()}}


@router.patch("/event-chats/{event_id}/read")
async def mark_read(event_id: str, current_user: dict = Depends(get_current_user)):
    r = _mark_read(event_id, current_user["id"])
    await rt.emit(r["conv_id"], r["frame"], skip_user=current_user["id"])
    return {"ok": True}


class MuteBody(BaseModel):
    muted: bool


@router.post("/event-chats/{event_id}/mute")
def set_mute(event_id: str, body: MuteBody, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, conn):
        chat = _load(cur, event_id, uid)
        cur.execute("UPDATE conversation_members SET muted = %s WHERE conversation_id = %s::uuid AND user_id = %s::uuid", (body.muted, chat["id"], uid))
        conn.commit()
    return {"muted": body.muted}


@router.get("/event-chats/{event_id}/members")
def get_members(event_id: str, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, _):
        chat = _load(cur, event_id, uid)
        cur.execute(
            f"""
            SELECT m.user_id::text AS id, m.role, m.last_read_at, u.name, u.username, {MEMBER_FACE} AS avatar
            FROM conversation_members m JOIN users u ON u.id = m.user_id
            WHERE m.conversation_id = %s::uuid AND {ec.ACTIVE_MEMBER}
            ORDER BY (m.role = 'host') DESC, m.joined_at
            """,
            (chat["id"],),
        )
        return [{**r, "last_read_at": r["last_read_at"].isoformat()} for r in cur.fetchall()]


# ── Host controls ────────────────────────────────────────────────────────────

class UpdateBody(BaseModel):
    content: str


@router.post("/event-chats/{event_id}/update")
async def post_update(event_id: str, body: UpdateBody, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    text = body.content.strip()
    if not text or len(text) > MAX_MESSAGE_CHARS:
        raise HTTPException(status_code=400, detail="Write a short update")
    with get_db() as (cur, conn):
        chat = _load(cur, event_id, uid)
        _require_host(chat)
        if chat["closed_at"]:
            raise HTTPException(status_code=403, detail="This chat has closed")
        msg, _ = _insert_message(cur, chat["id"], uid, text, "update", None)
        cur.execute("UPDATE conversations SET pinned_message_id = %s::uuid WHERE id = %s::uuid", (msg["id"], chat["id"]))
        cur.execute(f"SELECT {SENDER_COLUMNS} FROM users u WHERE u.id = %s::uuid", (uid,))
        sender = cur.fetchone()
        conn.commit()
    out = _out({**msg, **sender}, chat["host_id"])
    await rt.emit(chat["id"], {"type": "message", **out})
    await rt.emit(chat["id"], {"type": "pinned", "message": out})
    background_tasks.add_task(ec.push_update, event_id, chat["id"], chat["title"], text, uid)
    return out


class LockBody(BaseModel):
    locked: bool


@router.post("/event-chats/{event_id}/lock")
async def set_lock(event_id: str, body: LockBody, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, conn):
        chat = _load(cur, event_id, uid)
        _require_host(chat)
        cur.execute("UPDATE conversations SET posting_locked = %s WHERE id = %s::uuid", (body.locked, chat["id"]))
        line = ec.post_system(cur, chat["id"], uid, "Only the host can post for now." if body.locked else "Everyone can post again.")
        conn.commit()
    await rt.emit(chat["id"], {"type": "locked", "locked": body.locked})
    await rt.emit(chat["id"], {"type": "message", **line, "sender": {"id": uid, "name": None, "avatar": None, "is_host": True}})
    return {"locked": body.locked}


class PinBody(BaseModel):
    message_id: Optional[str] = None


@router.post("/event-chats/{event_id}/pin")
async def set_pin(event_id: str, body: PinBody, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, conn):
        chat = _load(cur, event_id, uid)
        _require_host(chat)
        pinned = _pinned(cur, chat["id"], body.message_id, chat["host_id"])
        if body.message_id and not pinned:
            raise HTTPException(status_code=404, detail="Message not found")
        cur.execute("UPDATE conversations SET pinned_message_id = %s::uuid WHERE id = %s::uuid", (body.message_id, chat["id"]))
        conn.commit()
    await rt.emit(chat["id"], {"type": "pinned", "message": pinned})
    return {"pinned": pinned}


@router.delete("/event-chats/{event_id}/messages/{message_id}")
async def delete_any_message(event_id: str, message_id: str, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, conn):
        chat = _load(cur, event_id, uid)
        _require_host(chat)
        cur.execute(
            "UPDATE messages SET unsent_at = NOW(), content = NULL, reactions = NULL WHERE id = %s::uuid AND conversation_id = %s::uuid AND unsent_at IS NULL RETURNING id",
            (message_id, chat["id"]),
        )
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Message not found")
        conn.commit()
    await rt.emit(chat["id"], {"type": "message_unsent", "message_id": message_id})
    return {"ok": True}


@router.post("/event-chats/{event_id}/members/{user_id}/remove")
async def remove_member(event_id: str, user_id: str, current_user: dict = Depends(get_current_user)):
    """Out of the chat only. Their ticket stays good."""
    uid = current_user["id"]
    with get_db() as (cur, conn):
        chat = _load(cur, event_id, uid)
        _require_host(chat)
        if user_id == uid:
            raise HTTPException(status_code=400, detail="You can't remove yourself")
        cur.execute(
            "UPDATE conversation_members SET removed_at = NOW() WHERE conversation_id = %s::uuid AND user_id = %s::uuid AND removed_at IS NULL RETURNING user_id",
            (chat["id"], user_id),
        )
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="They're not in this chat")
        conn.commit()
    await rt.emit(chat["id"], {"type": "member_removed", "user_id": user_id})
    return {"ok": True}


# ── Live ─────────────────────────────────────────────────────────────────────

@router.websocket("/ws/event-chat/{event_id}")
async def event_chat_socket(event_id: str, websocket: WebSocket, ticket: Optional[str] = Query(None)):
    auth = await _ws_user(ticket, None)
    if not auth:
        await websocket.close(code=4001)
        return
    uid, deadline = auth
    try:
        with get_db() as (cur, _):
            conv_id = _load(cur, event_id, uid)["id"]
    except Exception:
        await websocket.close(code=4003)
        return

    await websocket.accept()
    await rt.join_conv(conv_id, websocket, uid)
    await rt.mark_present(uid, conv_id)

    def still_in() -> bool:
        # Every frame: a removed guest must stop at their next move, not at
        # the end of their session.
        try:
            with get_db() as (cur, _):
                _load(cur, event_id, uid)
            return True
        except HTTPException:
            return False

    async def send(payload: dict) -> None:
        await websocket.send_text(json.dumps(payload))

    try:
        while True:
            try:
                raw = await _receive(websocket, deadline)
            except TimeoutError:
                await websocket.close(code=WS_SESSION_EXPIRED)
                break
            if raw is None:
                await send({"type": "pong"})
                await rt.mark_present(uid, conv_id)
                continue
            try:
                data = json.loads(raw)
            except ValueError:
                continue
            kind = data.get("type")
            if kind == "ping":
                await send({"type": "pong"})
                await rt.mark_present(uid, conv_id)
                continue
            if not still_in():
                await websocket.close(code=4003)
                break

            if kind == "typing":
                if await rt.allow(f"typing:{uid}", rt.TYPING_LIMIT):
                    await rt.emit(conv_id, {
                        "type": "typing", "user_id": uid, "name": data.get("name"),
                        "is_typing": data.get("is_typing", False), "mode": data.get("mode", "text"),
                    }, exclude=websocket, skip_user=uid)

            elif kind == "read":
                r = _mark_read(event_id, uid)
                await rt.emit(conv_id, r["frame"], exclude=websocket, skip_user=uid)

            elif kind == "reaction":
                msg_id, emoji = data.get("message_id"), data.get("emoji")
                if not msg_id or not await rt.allow(f"reaction:{uid}", rt.REACTION_LIMIT):
                    continue
                with get_db() as (cur, conn):
                    if emoji:
                        cur.execute(
                            "UPDATE messages SET reactions = COALESCE(reactions, '{}'::jsonb) || %s::jsonb WHERE id = %s::uuid AND conversation_id = %s::uuid",
                            (json.dumps({uid: emoji}), msg_id, conv_id),
                        )
                    else:
                        cur.execute(
                            "UPDATE messages SET reactions = COALESCE(reactions, '{}'::jsonb) - %s WHERE id = %s::uuid AND conversation_id = %s::uuid",
                            (uid, msg_id, conv_id),
                        )
                    conn.commit()
                payload = {"type": "reaction", "message_id": msg_id, "user_id": uid, "emoji": emoji}
                await send(payload)
                await rt.emit(conv_id, payload, exclude=websocket, skip_user=uid)

            elif kind == "message":
                client_id = _parse_client_id(data.get("client_id"))
                content_type = data.get("content_type", "text")
                content = data.get("content")
                if not await rt.allow(f"msg:{uid}", rt.MESSAGE_LIMIT):
                    await send({"type": "error", "code": "rate_limited", "client_id": client_id})
                elif content_type not in CLIENT_CONTENT_TYPES or (isinstance(content, str) and len(content) > MAX_MESSAGE_CHARS):
                    await send({"type": "error", "code": "invalid", "client_id": client_id})
                else:
                    metadata = await rt.clean_outgoing_metadata(data.get("metadata"), uid)
                    out, created, chat, error = _save_message(event_id, uid, content, content_type, metadata, client_id)
                    if error:
                        await send({"type": "error", "code": error, "client_id": client_id})
                    else:
                        await send({"type": "message", **out})
                        if created:
                            await _announce(event_id, chat, out, uid, metadata, exclude=websocket)

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"[WS] event-chat/{event_id} unexpected error: {e!r}", flush=True)
    finally:
        await rt.leave_conv(conv_id, websocket)
        await rt.clear_present(uid, conv_id)
