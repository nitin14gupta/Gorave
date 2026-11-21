"""Re-engagement pushes, in the "Picks for you" category (users can turn it off).

- Weekend digest, Thursday evening (6 to 9 PM IST): "4 nights in Mumbai this
  weekend · 2 friends going". Once a week per person, only if there's
  something to say.
- Saved and filling up: an event you hotlisted is nearly full (or its early
  bird is almost gone). Once per event per person.

Run from main.py every 15 minutes; both are safe to run again.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

from db.config import get_db
from routes.notifications import _insert_notification
from utils.push import send_push_many

IST = timezone(timedelta(hours=5, minutes=30))
CATEGORY = "discover"

# Events someone could still join: live, upcoming, host not locked, not theirs,
# not already in, and the crowd rule lets them in. `u` is the person.
JOINABLE = """
    e.is_published AND NOT e.is_cancelled AND e.city = u.city
    AND NOT EXISTS (SELECT 1 FROM users h WHERE h.id = e.host_id AND COALESCE(h.is_locked, FALSE))
    AND e.host_id <> u.id
    AND NOT EXISTS (SELECT 1 FROM event_attendees x WHERE x.event_id = e.id AND x.user_id = u.id AND x.status IN ('going', 'waitlist', 'requested', 'declined'))
    AND (e.women_pct IS NULL OR (e.women_pct NOT IN (0, 100))
         OR (e.women_pct = 100 AND u.gender = 'Female') OR (e.women_pct = 0 AND u.gender = 'Male'))
"""


def weekend_window(now: datetime) -> tuple:
    """This coming Friday 00:00 to Sunday 23:59 IST, as UTC."""
    local = now.astimezone(IST)
    friday = (local + timedelta(days=(4 - local.weekday()) % 7)).replace(hour=0, minute=0, second=0, microsecond=0)
    return friday.astimezone(timezone.utc), (friday + timedelta(days=3)).astimezone(timezone.utc)


def digest_due(now: datetime) -> bool:
    local = now.astimezone(IST)
    return local.weekday() == 3 and 18 <= local.hour < 21


def _digest_lines(r: dict) -> tuple:
    title = f"{r['nights']} {'night' if r['nights'] == 1 else 'nights'} in {r['city']} this weekend"
    if r["friends"]:
        title += f" · {r['friends']} {'friend' if r['friends'] == 1 else 'friends'} going"
    if r["friend_pick"]:
        who, event_title = r["friend_pick"].split("|", 1)
        body = f"{who} is going to {event_title}. See what else is on." if r["friends"] <= 1 \
            else f"{who} and {r['friends'] - 1} more are going. See what's on."
    else:
        body = "Pick one before the good ones fill up."
    return title, body


def send_weekend_digest(now: Optional[datetime] = None, force: bool = False, only_user: Optional[str] = None) -> int:
    now = now or datetime.now(timezone.utc)
    if not force and not digest_due(now):
        return 0
    start, end = weekend_window(now)
    with get_db() as (cur, conn):
        cur.execute(
            f"""
            SELECT u.id::text, u.city,
                   (SELECT COUNT(*) FROM events e WHERE {JOINABLE} AND e.date_time >= %(start)s AND e.date_time < %(end)s)::int AS nights,
                   (SELECT COUNT(DISTINCT ea.user_id) FROM events e JOIN event_attendees ea ON ea.event_id = e.id AND ea.status = 'going'
                    WHERE {JOINABLE} AND e.date_time >= %(start)s AND e.date_time < %(end)s
                      AND ea.user_id IN (SELECT following_id FROM follows WHERE follower_id = u.id))::int AS friends,
                   (SELECT split_part(fu.name, ' ', 1) || '|' || e.title FROM events e
                      JOIN event_attendees ea ON ea.event_id = e.id AND ea.status = 'going'
                      JOIN users fu ON fu.id = ea.user_id
                    WHERE {JOINABLE} AND e.date_time >= %(start)s AND e.date_time < %(end)s
                      AND ea.user_id IN (SELECT following_id FROM follows WHERE follower_id = u.id)
                    ORDER BY e.date_time LIMIT 1) AS friend_pick
            FROM users u
            WHERE u.city IS NOT NULL AND u.profile_complete
              AND COALESCE(u.is_deleted, FALSE) = FALSE AND COALESCE(u.is_locked, FALSE) = FALSE
              AND COALESCE((u.notification_prefs ->> %(cat)s)::boolean, TRUE)
              -- Once a week, whatever day this runs.
              AND (u.last_weekend_digest_at IS NULL OR u.last_weekend_digest_at < NOW() - INTERVAL '6 days')
              AND (%(only)s::uuid IS NULL OR u.id = %(only)s::uuid)
            """,
            {"start": start, "end": end, "cat": CATEGORY, "only": only_user},
        )
        rows = [r for r in cur.fetchall() if r["nights"] > 0]
        items = []
        for r in rows:
            title, body = _digest_lines(r)
            _insert_notification(cur, r["id"], "weekend_digest", title=title, body=body, entity_type="browse")
            items.append({"user_id": r["id"], "title": title, "body": body, "data": {"type": "weekend_digest"}})
        if rows:
            cur.execute("UPDATE users SET last_weekend_digest_at = NOW() WHERE id = ANY(%s::uuid[])", ([r["id"] for r in rows],))
        conn.commit()
    if items:
        send_push_many(items, category=CATEGORY)
    return len(items)


def send_saved_filling_up() -> int:
    """A saved (hotlisted) event that's nearly full, or whose early bird is
    almost gone, at least 6 hours out. Once per event per person."""
    with get_db() as (cur, conn):
        cur.execute(
            f"""
            SELECT u.id::text AS user_id, e.id::text AS event_id, e.title, e.spots_left,
                   e.early_bird_count - (SELECT COUNT(*) FROM event_attendees eb WHERE eb.event_id = e.id AND eb.pricing = 'early_bird'
                                         AND eb.status IN ('going', 'transferred') AND eb.refunded_at IS NULL) AS eb_left
            FROM event_hotlist hl
            JOIN users u ON u.id = hl.user_id
            JOIN events e ON e.id = hl.event_id
            WHERE {JOINABLE}
              AND e.date_time > NOW() + INTERVAL '6 hours'
              AND COALESCE(u.is_deleted, FALSE) = FALSE AND COALESCE(u.is_locked, FALSE) = FALSE
              AND COALESCE((u.notification_prefs ->> %(cat)s)::boolean, TRUE)
              AND NOT EXISTS (SELECT 1 FROM notifications n WHERE n.user_id = u.id AND n.entity_id = e.id AND n.type = 'saved_filling_up')
            """,
            {"cat": CATEGORY},
        )
        items = []
        for r in cur.fetchall():
            eb_left = r["eb_left"] or 0
            if 0 < eb_left <= 3:
                title = f"Early bird almost gone: {r['title']}"
                body = f"Only {eb_left} early-bird {'ticket' if eb_left == 1 else 'tickets'} left on a night you saved."
            elif 0 < r["spots_left"] <= 5:
                title = f"{r['title']} is filling up"
                body = f"{r['spots_left']} {'spot' if r['spots_left'] == 1 else 'spots'} left on a night you saved."
            else:
                continue
            _insert_notification(cur, r["user_id"], "saved_filling_up", title=title, body=body, entity_id=r["event_id"], entity_type="event")
            items.append({"user_id": r["user_id"], "title": title, "body": body, "data": {"type": "event", "event_id": r["event_id"]}})
        conn.commit()
    if items:
        send_push_many(items, category=CATEGORY)
    return len(items)


# ── Nights: before and after ────────────────────────────────────────────────

def send_host_reminders() -> int:
    """Two hours before doors, to the host: who's coming, who's waiting, and
    that the scanner is ready. Once per event."""
    with get_db() as (cur, conn):
        cur.execute(
            """
            UPDATE events e SET host_reminded_at = NOW()
            WHERE NOT e.is_cancelled AND e.is_published AND e.host_reminded_at IS NULL
              AND e.date_time BETWEEN NOW() + INTERVAL '90 minutes' AND NOW() + INTERVAL '2 hours 15 minutes'
            RETURNING e.id::text, e.host_id::text, e.title, e.join_mode,
                      (SELECT COUNT(*) FROM event_attendees a WHERE a.event_id = e.id AND a.status = 'going')::int AS going,
                      (SELECT COUNT(*) FROM event_attendees a WHERE a.event_id = e.id AND a.status = 'requested')::int AS waiting
            """
        )
        items = []
        for r in cur.fetchall():
            parts = [f"{r['going']} going"]
            if r["waiting"]:
                parts.append(f"{r['waiting']} {'request' if r['waiting'] == 1 else 'requests'} waiting")
            parts.append("scanner ready")
            title = f"{r['title']} starts in 2 hours"
            body = ", ".join(parts) + "."
            _insert_notification(cur, r["host_id"], "host_doors_soon", title=title, body=body, entity_id=r["id"], entity_type="event")
            data = {"type": "event_requests", "event_id": r["id"]} if r["waiting"] else {"type": "event", "event_id": r["id"]}
            items.append({"user_id": r["host_id"], "title": title, "body": body, "data": data})
        conn.commit()
    if items:
        send_push_many(items, category="hosting")
    return len(items)


def send_people_from_last_night(now: Optional[datetime] = None) -> int:
    """The morning after (from 10 AM IST), to everyone who went to a night
    that ended in the last day and a half: see who was there, send a vibe.
    Only when at least two other people were there. Once per ticket."""
    now = now or datetime.now(timezone.utc)
    if now.astimezone(IST).hour < 10:
        return 0
    with get_db() as (cur, conn):
        cur.execute(
            """
            UPDATE event_attendees ea SET people_prompt_sent_at = NOW()
            FROM events e
            WHERE e.id = ea.event_id AND ea.status = 'going' AND ea.people_prompt_sent_at IS NULL
              AND NOT e.is_cancelled
              AND COALESCE(e.end_time, e.date_time + INTERVAL '4 hours') BETWEEN NOW() - INTERVAL '36 hours' AND NOW() - INTERVAL '6 hours'
              AND (SELECT COUNT(*) FROM event_attendees o WHERE o.event_id = e.id AND o.status = 'going' AND o.user_id <> ea.user_id) >= 2
            RETURNING ea.user_id::text, e.id::text AS event_id, e.title,
                      (SELECT COUNT(*) FROM event_attendees o WHERE o.event_id = e.id AND o.status = 'going' AND o.user_id <> ea.user_id)::int AS others
            """
        )
        items = []
        for r in cur.fetchall():
            title = f"Who you met at {r['title']}"
            body = f"{r['others']} people were there. Send a vibe to someone you clicked with."
            _insert_notification(cur, r["user_id"], "people_from_night", title=title, body=body, entity_id=r["event_id"], entity_type="night_people")
            items.append({"user_id": r["user_id"], "title": title, "body": body, "data": {"type": "night_people", "event_id": r["event_id"]}})
        conn.commit()
    if items:
        send_push_many(items, category="social")
    return len(items)
