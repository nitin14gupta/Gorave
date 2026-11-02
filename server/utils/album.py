"""After-party album rules: who's in, what they see, and who gets told.

Guests scanned at the door and the host share one private album once the
event ends. Adding closes 7 days later; viewing stays open. Lives here rather
than in routes/album.py because the event page and the wrap-up job need it too.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

from db.config import get_db
from utils import chat_realtime as rt
from utils.push import send_push, get_event_image_url

ADD_WINDOW = timedelta(days=7)
# Same rule as routes/events.py _event_ended: no end time means start + 6h.
EVENT_LENGTH_FALLBACK = timedelta(hours=6)
PROMPT_DELAY_HOURS = 12
# Don't reach back to old events the first time this runs.
PROMPT_MAX_AGE_DAYS = 3
PUSH_GAP = timedelta(hours=2)
PREVIEW_COUNT = 5

BLOCK_FILTER = """
    NOT EXISTS (
        SELECT 1 FROM user_blocks b
        WHERE (b.blocker_id = %(me)s::uuid AND b.blocked_id = p.uploader_id)
           OR (b.blocker_id = p.uploader_id AND b.blocked_id = %(me)s::uuid)
    )
    AND NOT EXISTS (SELECT 1 FROM event_photo_reports r WHERE r.photo_id = p.id AND r.reporter_id = %(me)s::uuid)
"""
VISIBLE = "p.removed_at IS NULL AND p.hidden_at IS NULL"
VOTES = "(SELECT COUNT(*) FROM event_photo_votes v WHERE v.photo_id = p.id)"
ATTENDED_SQL = "ea.status = 'going' AND ea.checked_in_at IS NOT NULL"


def signed(key: str) -> Optional[str]:
    return rt.sign_chat_key(key) if rt.chat_media_private() else None


def access(cur, event_id: str, user_id: str) -> Optional[dict]:
    """None if the event doesn't exist. Nobody gets in before it has ended."""
    cur.execute(
        """
        SELECT e.host_id::text, e.date_time, e.end_time, e.is_cancelled,
            EXISTS (
                SELECT 1 FROM event_attendees ea
                WHERE ea.event_id = e.id AND ea.user_id = %s::uuid AND """ + ATTENDED_SQL + """
            ) AS attended
        FROM events e WHERE e.id = %s::uuid AND e.is_published = TRUE
        """,
        (user_id, event_id),
    )
    ev = cur.fetchone()
    if not ev:
        return None
    ended_at = ev["end_time"] or ev["date_time"] + EVENT_LENGTH_FALLBACK
    closes_at = ended_at + ADD_WINDOW
    now = datetime.now(timezone.utc)
    is_host = ev["host_id"] == user_id
    can_view = (is_host or ev["attended"]) and now > ended_at and not ev["is_cancelled"]
    return {"can_view": can_view, "can_add": can_view and now <= closes_at, "is_host": is_host, "closes_at": closes_at}


def summary(cur, event_id: str, user_id: str) -> Optional[dict]:
    """The event page's album row. None when this viewer isn't allowed in."""
    a = access(cur, event_id, user_id)
    if not a or not a["can_view"]:
        return None
    params = {"event_id": event_id, "me": user_id, "limit": PREVIEW_COUNT}
    cur.execute(f"SELECT COUNT(*)::int AS n FROM event_photos p WHERE p.event_id = %(event_id)s::uuid AND {VISIBLE} AND {BLOCK_FILTER}", params)
    count = cur.fetchone()["n"]
    cur.execute(
        f"""
        SELECT p.storage_key FROM event_photos p
        WHERE p.event_id = %(event_id)s::uuid AND {VISIBLE} AND {BLOCK_FILTER}
        ORDER BY {VOTES} DESC, p.created_at DESC LIMIT %(limit)s
        """,
        params,
    )
    preview = [{"url": signed(r["storage_key"]), "key": r["storage_key"]} for r in cur.fetchall()]
    return {"can_view": True, "can_add": a["can_add"], "count": count, "preview": preview, "closes_at": a["closes_at"].isoformat()}


def _people_line(names: list, photos: int, title: str) -> str:
    who = names[0] if len(names) == 1 else f"{names[0]} and {len(names) - 1} {'other' if len(names) == 2 else 'others'}"
    return f"{who} added {photos} {'photo' if photos == 1 else 'photos'} to {title}."


def send_photos_update(event_id: str, since: Optional[datetime]) -> int:
    """Tells everyone in the album about photos added after `since`. Each
    person only hears about uploaders they aren't blocked with, and never
    about their own photos."""
    from routes.notifications import notify_album_photos

    with get_db() as (cur, conn):
        cur.execute("SELECT title, host_id::text FROM events WHERE id = %s::uuid", (event_id,))
        ev = cur.fetchone()
        if not ev:
            return 0
        cur.execute(
            f"""
            SELECT p.uploader_id::text, COALESCE(NULLIF(split_part(u.name, ' ', 1), ''), 'Someone') AS first_name, COUNT(*)::int AS n
            FROM event_photos p JOIN users u ON u.id = p.uploader_id
            WHERE p.event_id = %s::uuid AND {VISIBLE} AND (%s::timestamptz IS NULL OR p.created_at > %s::timestamptz)
            GROUP BY 1, 2 ORDER BY MIN(p.created_at)
            """,
            (event_id, since, since),
        )
        uploaders = cur.fetchall()
        if not uploaders:
            return 0
        cur.execute(
            f"""
            SELECT ea.user_id::text FROM event_attendees ea WHERE ea.event_id = %s::uuid AND {ATTENDED_SQL}
            UNION SELECT %s
            """,
            (event_id, ev["host_id"]),
        )
        members = [r["user_id"] for r in cur.fetchall()]
        ids = [u["uploader_id"] for u in uploaders]
        cur.execute(
            """
            SELECT blocker_id::text, blocked_id::text FROM user_blocks
            WHERE blocker_id = ANY(%s::uuid[]) OR blocked_id = ANY(%s::uuid[])
            """,
            (ids, ids),
        )
        blocked = {frozenset((r["blocker_id"], r["blocked_id"])) for r in cur.fetchall()}

        outgoing = []
        for member in members:
            seen = [u for u in uploaders if u["uploader_id"] != member and frozenset((u["uploader_id"], member)) not in blocked]
            # Someone who added photos in this batch has just been in the album.
            if not seen or member in ids:
                continue
            line = _people_line([u["first_name"] for u in seen], sum(u["n"] for u in seen), ev["title"])
            notify_album_photos(cur, member, event_id, line)
            outgoing.append((member, line))
        conn.commit()

    image = get_event_image_url(event_id) if outgoing else None
    for member, line in outgoing:
        send_push(member, "New photos in the album", line, {"type": "event_album", "event_id": event_id}, image, category="attending")
    return len(outgoing)


def send_photo_rollups() -> int:
    """Photos added during an event's 2-hour quiet gap go out as one push."""
    with get_db() as (cur, conn):
        cur.execute(
            f"""
            WITH due AS (
                SELECT e.id, e.album_last_push_at AS since FROM events e
                WHERE e.album_last_push_at < NOW() - INTERVAL '{int(PUSH_GAP.total_seconds())} seconds'
                  AND EXISTS (
                      SELECT 1 FROM event_photos p
                      WHERE p.event_id = e.id AND {VISIBLE} AND p.created_at > e.album_last_push_at
                  )
                FOR UPDATE OF e SKIP LOCKED
            )
            UPDATE events e SET album_last_push_at = NOW() FROM due
            WHERE e.id = due.id
            RETURNING e.id::text, due.since
            """
        )
        due = cur.fetchall()
        conn.commit()
    return sum(send_photos_update(d["id"], d["since"]) for d in due)


def send_album_prompts() -> int:
    """"Got pics?", about 12 hours after the end so it doesn't land with the
    rate-your-night push. Stamped before sending: a crash loses a push, it
    never repeats one."""
    from routes.notifications import notify_album_prompt

    ended = "COALESCE(e.end_time, e.date_time + INTERVAL '6 hours')"
    window = f"""
        e.is_cancelled = FALSE AND e.is_published = TRUE
        AND {ended} < NOW() - INTERVAL '{PROMPT_DELAY_HOURS} hours'
        AND {ended} > NOW() - INTERVAL '{PROMPT_MAX_AGE_DAYS} days'
    """
    with get_db() as (cur, conn):
        cur.execute(
            f"""
            UPDATE event_attendees ea SET album_prompt_sent_at = NOW()
            FROM events e
            WHERE e.id = ea.event_id AND {ATTENDED_SQL} AND ea.album_prompt_sent_at IS NULL AND {window}
              AND NOT EXISTS (SELECT 1 FROM event_photos p WHERE p.event_id = e.id AND p.uploader_id = ea.user_id)
            RETURNING ea.user_id::text, e.id::text AS event_id, e.title
            """
        )
        rows = cur.fetchall()
        cur.execute(
            f"""
            UPDATE events e SET album_host_prompt_sent_at = NOW()
            WHERE e.album_host_prompt_sent_at IS NULL AND {window}
              AND NOT EXISTS (SELECT 1 FROM event_photos p WHERE p.event_id = e.id AND p.uploader_id = e.host_id)
            RETURNING e.host_id::text AS user_id, e.id::text AS event_id, e.title
            """
        )
        rows += cur.fetchall()
        for r in rows:
            notify_album_prompt(cur, r["user_id"], r["event_id"], r["title"])
        conn.commit()

    for r in rows:
        send_push(
            r["user_id"], f"Got pics from {r['title']}?",
            "Drop them in the album. Only people who were there can see them.",
            {"type": "event_album", "event_id": r["event_id"]},
            get_event_image_url(r["event_id"]), category="attending",
        )
    return len(rows)
