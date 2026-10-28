"""Live chat plumbing shared by routes/chat.py.

How a message reaches people, Instagram/WhatsApp style:

- Every server process keeps its own open sockets (`conv_sockets` per chat,
  `user_sockets` per person for the inbox screen) and delivers to them
  directly.
- For people connected to a *different* process, the event is published to
  Redis. Each process has ONE Redis subscriber (`_Hub`), subscribed only to
  the chats and inboxes it has sockets for, instead of one Redis connection
  per open screen. Everything a process publishes carries its id, so its own
  subscriber skips it (it was already delivered locally).
- Presence ("online", "has this chat open"), rate limits, socket tickets and
  push batching live in Redis so they hold across processes. When Redis is
  down everything falls back to this process alone and keeps working.
"""
import asyncio
import json
import os
import secrets
import time
import uuid
from collections import deque
from typing import Optional

from utils.push import send_push

WORKER_ID = uuid.uuid4().hex
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")


# ── Redis ────────────────────────────────────────────────────────────────────

_redis = None
_redis_retry_at = 0.0
_last_warn = 0.0


def warn_redis(context: str, e: Exception) -> None:
    global _last_warn
    now = time.monotonic()
    if now - _last_warn > 60:
        _last_warn = now
        print(f"[CHAT] Redis unavailable ({context}): {e!r} — falling back to this process only", flush=True)


async def get_redis():
    """Shared async client, or None while Redis is unreachable (retried every 5s,
    so a dead Redis doesn't add a connect timeout to every message)."""
    global _redis, _redis_retry_at
    if _redis is not None:
        return _redis
    now = time.monotonic()
    if now < _redis_retry_at:
        return None
    try:
        import redis.asyncio as aioredis
        client = aioredis.from_url(
            REDIS_URL, decode_responses=True,
            socket_connect_timeout=2, health_check_interval=30,
        )
        await client.ping()
        _redis = client
    except Exception as e:
        _redis_retry_at = now + 5
        warn_redis("connect", e)
    return _redis


# ── Sockets on this process ──────────────────────────────────────────────────

conv_sockets: dict[str, set] = {}
user_sockets: dict[str, set] = {}
SEND_TIMEOUT_SECONDS = 3


async def _deliver_local(sockets: Optional[set], data: dict, exclude=None, skip_user: Optional[str] = None) -> None:
    if not sockets:
        return
    text = json.dumps(data)
    targets = [
        ws for ws in list(sockets)
        if ws is not exclude and not (skip_user and getattr(ws.state, "uid", None) == skip_user)
    ]

    async def send(ws):
        try:
            # One stalled phone must not hold up everyone else in the room.
            await asyncio.wait_for(ws.send_text(text), SEND_TIMEOUT_SECONDS)
        except Exception:
            sockets.discard(ws)

    await asyncio.gather(*(send(ws) for ws in targets))


async def _publish(channel: str, data: dict, skip_user: Optional[str]) -> None:
    r = await get_redis()
    if not r:
        return
    try:
        await r.publish(channel, json.dumps({"_origin": WORKER_ID, "skip_user": skip_user, "data": data}))
    except Exception as e:
        warn_redis("publish", e)


async def emit(conv_id: str, data: dict, exclude=None, skip_user: Optional[str] = None) -> None:
    """Send an event to everyone with this chat open, on every process.
    `exclude` skips one socket (the one that sent it); `skip_user` skips all of
    one person's sockets (never echo someone's own typing/presence/sends)."""
    await _deliver_local(conv_sockets.get(conv_id), data, exclude, skip_user)
    await _publish(f"conv:{conv_id}", data, skip_user)


async def emit_inbox(user_ids, conv_id: str) -> None:
    """Tell people's chat lists that this conversation changed (bump it, refetch)."""
    payload = {"type": "conversation_updated", "conversation_id": conv_id}
    for uid in {u for u in user_ids if u}:
        await _deliver_local(user_sockets.get(uid), payload)
        await _publish(f"inbox:{uid}", payload, None)


class _Hub:
    """One Redis subscription per process, shared by all its sockets. Channels
    are reference-counted: subscribed when the first socket for a chat opens
    here, unsubscribed when the last one closes. Survives Redis restarts by
    re-subscribing everything it still needs."""

    def __init__(self):
        self._refs: dict[str, int] = {}
        self._ps = None
        self._fresh = False
        self._task: Optional[asyncio.Task] = None

    async def join(self, channel: str) -> None:
        self._refs[channel] = self._refs.get(channel, 0) + 1
        if self._refs[channel] == 1 and self._ps is not None and not self._fresh:
            try:
                await self._ps.subscribe(channel)
            except Exception as e:
                warn_redis("subscribe", e)
                await self._reset()
        if self._task is None or self._task.done():
            self._task = asyncio.create_task(self._run())

    async def leave(self, channel: str) -> None:
        n = self._refs.get(channel, 0) - 1
        if n > 0:
            self._refs[channel] = n
            return
        self._refs.pop(channel, None)
        if self._ps is not None and not self._fresh:
            try:
                await self._ps.unsubscribe(channel)
            except Exception as e:
                warn_redis("unsubscribe", e)

    async def _reset(self) -> None:
        ps, self._ps = self._ps, None
        if ps is not None:
            try:
                await ps.aclose()
            except Exception:
                pass

    async def _run(self) -> None:
        backoff = 1.0
        while True:
            if not self._refs:
                await self._reset()
                if not self._refs:  # nobody joined while we were closing
                    return
            if self._ps is None:
                r = await get_redis()
                if r is None:
                    await asyncio.sleep(backoff)
                    backoff = min(backoff * 2, 30)
                    continue
                self._ps = r.pubsub(ignore_subscribe_messages=True)
                self._fresh = True
            try:
                if self._fresh:
                    wanted = set(self._refs)
                    if not wanted:
                        continue  # everyone left meanwhile; the top of the loop closes up
                    await self._ps.subscribe(*wanted)
                    self._fresh = False
                    # Chats opened or closed while that was in flight.
                    missing, stale = set(self._refs) - wanted, wanted - set(self._refs)
                    if missing:
                        await self._ps.subscribe(*missing)
                    if stale:
                        await self._ps.unsubscribe(*stale)
                msg = await self._ps.get_message(timeout=1.0)
                backoff = 1.0
                if msg and msg.get("type") == "message":
                    await self._dispatch(msg["channel"], msg["data"])
            except asyncio.CancelledError:
                raise
            except Exception as e:
                warn_redis("subscriber", e)
                await self._reset()
                await asyncio.sleep(backoff)
                backoff = min(backoff * 2, 30)

    async def _dispatch(self, channel: str, raw: str) -> None:
        try:
            env = json.loads(raw)
        except ValueError:
            return
        if env.get("_origin") == WORKER_ID:
            return  # already delivered on this process
        data, skip_user = env.get("data") or {}, env.get("skip_user")
        if channel.startswith("conv:"):
            await _deliver_local(conv_sockets.get(channel[5:]), data, None, skip_user)
        elif channel.startswith("inbox:"):
            await _deliver_local(user_sockets.get(channel[6:]), data)


_hub = _Hub()


async def join_conv(conv_id: str, ws, uid: str) -> None:
    ws.state.uid = uid
    conv_sockets.setdefault(conv_id, set()).add(ws)
    await _hub.join(f"conv:{conv_id}")


async def leave_conv(conv_id: str, ws) -> None:
    room = conv_sockets.get(conv_id)
    if room is not None:
        room.discard(ws)
        if not room:
            conv_sockets.pop(conv_id, None)
    await _hub.leave(f"conv:{conv_id}")


async def join_inbox(ws, uid: str) -> None:
    ws.state.uid = uid
    user_sockets.setdefault(uid, set()).add(ws)
    await _hub.join(f"inbox:{uid}")


async def leave_inbox(ws, uid: str) -> None:
    room = user_sockets.get(uid)
    if room is not None:
        room.discard(ws)
        if not room:
            user_sockets.pop(uid, None)
    await _hub.leave(f"inbox:{uid}")


def has_local_socket(conv_id: str, uid: str) -> bool:
    return any(getattr(ws.state, "uid", None) == uid for ws in conv_sockets.get(conv_id, ()))


# ── Presence ─────────────────────────────────────────────────────────────────

PRESENCE_TTL_SECONDS = 35  # sockets ping every 25s


async def mark_present(uid: str, conv_id: str) -> None:
    """Online, and has this chat open (which means: no push for it)."""
    r = await get_redis()
    if not r:
        return
    try:
        pipe = r.pipeline()
        pipe.set(f"online:{uid}", "1", ex=PRESENCE_TTL_SECONDS)
        pipe.set(f"inchat:{conv_id}:{uid}", "1", ex=PRESENCE_TTL_SECONDS)
        await pipe.execute()
    except Exception as e:
        warn_redis("presence", e)


async def clear_present(uid: str, conv_id: str) -> None:
    # Another of their sockets for this chat is still open here: keep it.
    if has_local_socket(conv_id, uid):
        return
    r = await get_redis()
    if not r:
        return
    try:
        await r.delete(f"online:{uid}", f"inchat:{conv_id}:{uid}")
    except Exception as e:
        warn_redis("clear presence", e)


async def is_online(uid: str) -> bool:
    r = await get_redis()
    if not r:
        return False
    try:
        return bool(await r.exists(f"online:{uid}"))
    except Exception as e:
        warn_redis("read presence", e)
        return False


async def has_chat_open(uid: str, conv_id: str) -> bool:
    if has_local_socket(conv_id, uid):
        return True
    r = await get_redis()
    if not r:
        return False
    try:
        return bool(await r.exists(f"inchat:{conv_id}:{uid}"))
    except Exception as e:
        warn_redis("read inchat", e)
        return False


# ── Rate limits (shared across processes) ────────────────────────────────────

class _LocalWindow:
    """Only used while Redis is down: per-process sliding window."""

    def __init__(self):
        self._buckets: dict[str, deque] = {}

    def allow(self, key: str, max_events: int, window: float) -> bool:
        now = time.monotonic()
        bucket = self._buckets.setdefault(key, deque())
        while bucket and now - bucket[0] > window:
            bucket.popleft()
        if len(bucket) >= max_events:
            return False
        bucket.append(now)
        return True


_local_window = _LocalWindow()

# Message sends: bursts up to 15 in 10s. Typing and reactions a little looser.
MESSAGE_LIMIT = (15, 10)
TYPING_LIMIT = (20, 10)
REACTION_LIMIT = (20, 10)


async def allow(key: str, limit: tuple[int, int]) -> bool:
    max_events, window = limit
    r = await get_redis()
    if r:
        try:
            k = f"rl:{key}:{int(time.time() // window)}"
            pipe = r.pipeline()
            pipe.incr(k)
            pipe.expire(k, window + 1)
            count, _ = await pipe.execute()
            return int(count) <= max_events
        except Exception as e:
            warn_redis("rate limit", e)
    return _local_window.allow(key, max_events, window)


# ── Socket tickets (no long-lived token in the socket URL) ───────────────────

TICKET_TTL_SECONDS = 30
_local_tickets: dict[str, tuple[str, float]] = {}


async def issue_ticket(uid: str) -> str:
    """A random, single-use, 30-second pass for opening one socket. Proxies and
    server logs only ever see this, never the access token."""
    ticket = secrets.token_urlsafe(32)
    r = await get_redis()
    if r:
        try:
            await r.set(f"wsticket:{ticket}", uid, ex=TICKET_TTL_SECONDS)
            return ticket
        except Exception as e:
            warn_redis("issue ticket", e)
    now = time.monotonic()
    for t, (_, exp) in list(_local_tickets.items()):
        if exp < now:
            _local_tickets.pop(t, None)
    _local_tickets[ticket] = (uid, now + TICKET_TTL_SECONDS)
    return ticket


async def redeem_ticket(ticket: str) -> Optional[str]:
    r = await get_redis()
    if r:
        try:
            uid = await r.getdel(f"wsticket:{ticket}")
            if uid:
                return uid
        except Exception as e:
            warn_redis("redeem ticket", e)
    entry = _local_tickets.pop(ticket, None)
    if entry and entry[1] >= time.monotonic():
        return entry[0]
    return None


# ── Push notifications for new messages ──────────────────────────────────────

PUSH_GAP_SECONDS = 15


async def _send_message_push(to_uid: str, conv_id: str, sender_name: str, count: int) -> None:
    # Deliberately generic: no message text in pushes, so nothing leaks onto
    # lock screens. Same copy for text and media.
    body = "Sent you a message" if count <= 1 else f"Sent you {count} messages"
    await asyncio.to_thread(send_push, to_uid, sender_name, body, {"type": "conversation", "conv_id": conv_id})


async def _flush_push(r, to_uid: str, conv_id: str, sender_name: str) -> None:
    count = int(await r.getdel(f"pushcount:{to_uid}:{conv_id}") or 0)
    if count > 0 and not await has_chat_open(to_uid, conv_id):
        await _send_message_push(to_uid, conv_id, sender_name, count)


async def _trailing_push(to_uid: str, conv_id: str, sender_name: str) -> None:
    await asyncio.sleep(PUSH_GAP_SECONDS)
    r = await get_redis()
    if not r:
        return
    try:
        await r.delete(f"pushtrail:{to_uid}:{conv_id}")
        await r.set(f"pushgap:{to_uid}:{conv_id}", "1", ex=PUSH_GAP_SECONDS)
        await _flush_push(r, to_uid, conv_id, sender_name)
    except Exception as e:
        warn_redis("trailing push", e)


async def notify_new_message(to_uid: Optional[str], conv_id: str, sender_name: str) -> None:
    """At most one push per chat every 15s, and none while they have the chat
    open. Messages that arrive inside the gap are summed into one trailing
    push: "Sent you 4 messages"."""
    if not to_uid:
        return
    if await has_chat_open(to_uid, conv_id):
        return
    r = await get_redis()
    if not r:
        await _send_message_push(to_uid, conv_id, sender_name, 1)
        return
    try:
        pipe = r.pipeline()
        pipe.incr(f"pushcount:{to_uid}:{conv_id}")
        pipe.expire(f"pushcount:{to_uid}:{conv_id}", 3600)
        await pipe.execute()
        if await r.set(f"pushgap:{to_uid}:{conv_id}", "1", nx=True, ex=PUSH_GAP_SECONDS):
            await _flush_push(r, to_uid, conv_id, sender_name)
        elif await r.set(f"pushtrail:{to_uid}:{conv_id}", "1", nx=True, ex=PUSH_GAP_SECONDS + 5):
            asyncio.create_task(_trailing_push(to_uid, conv_id, sender_name))
    except Exception as e:
        warn_redis("push batching", e)
        await _send_message_push(to_uid, conv_id, sender_name, 1)


async def clear_pending_push(uid: str, conv_id: str) -> None:
    """They opened the chat: whatever was waiting to be summarised is seen."""
    r = await get_redis()
    if not r:
        return
    try:
        await r.delete(f"pushcount:{uid}:{conv_id}")
    except Exception as e:
        warn_redis("clear push count", e)


# ── Private chat media (signed, expiring links) ──────────────────────────────

CHAT_BUCKET = os.getenv("R2_CHAT_BUCKET") or None
SIGNED_URL_TTL_SECONDS = 6 * 3600
UPLOAD_OWNER_TTL_SECONDS = 7 * 24 * 3600
_signer = None


def chat_media_private() -> bool:
    """On once R2_CHAT_BUCKET (a bucket with public access OFF) is set."""
    return CHAT_BUCKET is not None


def _get_signer():
    global _signer
    if _signer is None:
        import boto3
        from botocore.config import Config
        _signer = boto3.client(
            "s3",
            endpoint_url=f"https://{os.getenv('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com",
            aws_access_key_id=os.getenv("R2_ACCESS_KEY"),
            aws_secret_access_key=os.getenv("R2_SECRET_KEY"),
            region_name="auto",
            config=Config(signature_version="s3v4"),
        )
    return _signer


def sign_chat_key(key: str) -> str:
    return _get_signer().generate_presigned_url(
        "get_object", Params={"Bucket": CHAT_BUCKET, "Key": key}, ExpiresIn=SIGNED_URL_TTL_SECONDS,
    )


def with_signed_media(msg: dict) -> dict:
    """Outgoing message: private media gets a fresh link that expires. Stored
    messages keep only the file's key, never a link."""
    md = msg.get("metadata")
    if CHAT_BUCKET and isinstance(md, dict) and isinstance(md.get("key"), str) and md["key"].startswith("chat/"):
        try:
            return {**msg, "metadata": {**md, "url": sign_chat_key(md["key"])}}
        except Exception as e:
            print(f"[CHAT] signing {md['key']!r} failed: {e!r}", flush=True)
    return msg


async def remember_upload(key: str, uid: str) -> None:
    """Who uploaded this file, so only they can attach it to a message."""
    r = await get_redis()
    if r:
        try:
            await r.set(f"chatupload:{key}", uid, ex=UPLOAD_OWNER_TTL_SECONDS)
        except Exception as e:
            warn_redis("remember upload", e)


async def clean_outgoing_metadata(metadata: Optional[dict], uid: str) -> Optional[dict]:
    """Incoming message metadata: a private file must be one this sender
    uploaded, and only its key is stored (the signed link is per-viewer)."""
    if not isinstance(metadata, dict) or "key" not in metadata:
        return metadata
    key = metadata.get("key")
    if not (CHAT_BUCKET and isinstance(key, str) and key.startswith("chat/")):
        return {k: v for k, v in metadata.items() if k != "key"}
    r = await get_redis()
    if r:
        try:
            owner = await r.get(f"chatupload:{key}")
            if owner is not None and owner != uid:
                raise PermissionError("not your upload")
        except PermissionError:
            raise
        except Exception as e:
            warn_redis("check upload owner", e)
    return {k: v for k, v in metadata.items() if k != "url"}
