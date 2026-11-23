"""Your month on Gorave: a shareable recap of last month.

One card per person per month, picked by what they did:
  host     hosted at least one night
  first    their first ever night out happened this month
  regular  went out at least once
  quiet    nothing this month (shown in the app only, never offered to share)

Every stat has a fallback so a card never shows a zero. The push goes out on
the 1st at 11 AM IST to people with something to show (see send_month_recap),
once a month (users.last_recap_month).
"""
from collections import Counter
from datetime import date, datetime, timedelta, timezone
from typing import Optional

from db.config import get_db
from routes.notifications import _insert_notification
from utils.push import send_push_many
from utils.visibility import live, not_blocked
from utils.digests import JOINABLE

IST = timezone(timedelta(hours=5, minutes=30))
CATEGORY = "discover"
MONTHS = ["January", "February", "March", "April", "May", "June", "July",
          "August", "September", "October", "November", "December"]
TYPE_LABEL = {"house_party": "House parties", "rooftop": "Rooftops", "game_night": "Game nights",
              "dinner": "Dinners", "music": "Music nights"}
PUSH_BATCH = 500  # per run; the loop comes back every 15 minutes


def attended(a: str) -> str:
    """`a` (an event_attendees alias) went: they were scanned in, or they held a
    going spot at a night where the host scanned nobody (many hosts of house
    parties don't use check-in). When a host does scan, no-shows don't count."""
    return (f"({a}.status = 'going' AND ({a}.checked_in_at IS NOT NULL OR NOT EXISTS ("
            f"SELECT 1 FROM event_attendees ci WHERE ci.event_id = {a}.event_id AND ci.checked_in_at IS NOT NULL)))")


def previous_month(now: Optional[datetime] = None) -> str:
    local = (now or datetime.now(timezone.utc)).astimezone(IST)
    first = local.replace(day=1)
    prev = first - timedelta(days=1)
    return f"{prev.year:04d}-{prev.month:02d}"


def parse_month(month: str) -> Optional[tuple]:
    """'2026-11' -> (start_utc, end_utc, first_day). None if malformed."""
    try:
        y, m = (int(p) for p in month.split("-"))
        if not (1 <= m <= 12 and 2024 <= y <= 2100):
            return None
    except (ValueError, AttributeError):
        return None
    start = datetime(y, m, 1, tzinfo=IST)
    end = datetime(y + (m == 12), 1 if m == 12 else m + 1, 1, tzinfo=IST)
    return start.astimezone(timezone.utc), end.astimezone(timezone.utc), date(y, m, 1)


def _photo(cover) -> Optional[str]:
    if not cover:
        return None
    first = cover[0]
    if isinstance(first, str):
        return first
    if isinstance(first, dict):
        return first.get("url")
    return None


def _plural(n: int, one: str, many: str) -> str:
    return one if n == 1 else many


def _weekend_streak(times: list) -> int:
    """Longest run of back-to-back weekends (Fri to Sun, IST) with a night out."""
    fridays = set()
    for t in times:
        d = t.astimezone(IST).date()
        if d.weekday() >= 4:
            fridays.add(d - timedelta(days=d.weekday() - 4))
    best = run = 0
    prev = None
    for f in sorted(fridays):
        run = run + 1 if prev and (f - prev).days == 7 else 1
        best = max(best, run)
        prev = f
    return best


def build_recap(cur, user_id: str, month: str) -> Optional[dict]:
    """The recap for one person and month, or None if they hadn't joined yet."""
    bounds = parse_month(month)
    if not bounds:
        return None
    start, end, _ = bounds
    p = {"me": user_id, "s": start, "e": end}

    cur.execute("SELECT name, created_at FROM users WHERE id = %(me)s::uuid", p)
    u = cur.fetchone()
    if not u or (u["created_at"] and u["created_at"] >= end):
        return None
    first_name = ((u["name"] or "").strip().split() or ["You"])[0]
    label = MONTHS[int(month[5:7]) - 1]

    # Nights out: checked in, not cancelled, started this month.
    cur.execute(
        f"""
        SELECT e.id::text AS id, e.title, e.area, e.event_type, e.date_time, e.cover_photos
        FROM event_attendees ea JOIN events e ON e.id = ea.event_id
        WHERE ea.user_id = %(me)s::uuid AND {attended('ea')}
          AND NOT e.is_cancelled AND e.date_time >= %(s)s AND e.date_time < LEAST(%(e)s, NOW())
        ORDER BY e.date_time DESC
        """, p)
    nights = cur.fetchall()
    p["ids"] = [n["id"] for n in nights] or [None]

    # Nights hosted that have happened.
    cur.execute(
        """
        SELECT e.id::text AS id, e.title, e.cover_photos, e.spots_left, e.date_time
        FROM events e
        WHERE e.host_id = %(me)s::uuid AND e.is_published AND NOT e.is_cancelled
          AND e.date_time >= %(s)s AND e.date_time < LEAST(%(e)s, NOW())
        ORDER BY e.date_time DESC
        """, p)
    hosted = cur.fetchall()
    p["hids"] = [h["id"] for h in hosted] or [None]

    # New connections: vibes accepted this month, either direction, each person once.
    cur.execute(
        f"""
        SELECT COUNT(DISTINCT o.id) AS n
        FROM vibe_requests v
        JOIN users o ON o.id = CASE WHEN v.sender_id = %(me)s::uuid THEN v.receiver_id ELSE v.sender_id END
        WHERE (v.sender_id = %(me)s::uuid OR v.receiver_id = %(me)s::uuid) AND v.status = 'accepted'
          AND v.accepted_at >= %(s)s AND v.accepted_at < %(e)s
          AND {live('o')} AND {not_blocked('o.id', '%(me)s::uuid')}
        """, p)
    connections = cur.fetchone()["n"]

    # People you partied with: checked in to the same nights.
    cur.execute(
        f"""
        SELECT COUNT(DISTINCT o.user_id) AS n
        FROM event_attendees o JOIN users ou ON ou.id = o.user_id
        WHERE o.event_id = ANY(%(ids)s::uuid[]) AND o.user_id <> %(me)s::uuid
          AND {attended('o')}
          AND {live('ou')} AND {not_blocked('ou.id', '%(me)s::uuid')}
        """, p)
    partied = cur.fetchone()["n"]

    cur.execute(
        """SELECT COUNT(*) AS n FROM vibe_requests
           WHERE receiver_id = %(me)s::uuid AND created_at >= %(s)s AND created_at < %(e)s""", p)
    vibes_in = cur.fetchone()["n"]

    kind = "host" if hosted else ("quiet" if not nights else None)
    if kind is None:
        cur.execute(
            f"""SELECT EXISTS (SELECT 1 FROM event_attendees ea JOIN events e ON e.id = ea.event_id
                 WHERE ea.user_id = %(me)s::uuid AND {attended('ea')}
                   AND NOT e.is_cancelled AND e.date_time < %(s)s) AS before""", p)
        before = cur.fetchone()["before"]
        kind = "first" if not before and len(nights) == 1 else "regular"

    def num(v, lbl):
        return {"value": str(v), "label": lbl, "style": "number"}

    def word(v, lbl):
        return {"value": v, "label": lbl, "style": "word"}

    people = None
    if connections:
        people = num(connections, _plural(connections, "new connection", "new connections"))
    elif partied:
        people = num(partied, _plural(partied, "person you partied with", "people you partied with"))

    stats: list = []
    if kind == "host":
        cur.execute(
            f"""SELECT COUNT(*) AS n FROM event_attendees g
               WHERE g.event_id = ANY(%(hids)s::uuid[]) AND {attended('g')}""", p)
        guests = cur.fetchone()["n"]
        cur.execute("SELECT AVG(rating)::float AS avg, COUNT(*) AS n FROM event_reviews WHERE event_id = ANY(%(hids)s::uuid[])", p)
        rv = cur.fetchone()
        cur.execute(
            f"""
            SELECT COUNT(DISTINCT ea.user_id) AS n
            FROM event_attendees ea JOIN events e ON e.id = ea.event_id
            WHERE e.id = ANY(%(hids)s::uuid[]) AND {attended('ea')}
              AND EXISTS (SELECT 1 FROM event_attendees pa JOIN events pe ON pe.id = pa.event_id
                          WHERE pe.host_id = %(me)s::uuid AND pa.user_id = ea.user_id AND {attended('pa')}
                            AND NOT pe.is_cancelled AND pe.date_time < e.date_time)
            """, p)
        came_back = cur.fetchone()["n"]
        sold_out = sum(1 for h in hosted if (h["spots_left"] or 0) <= 0)
        if guests:
            stats.append(num(guests, _plural(guests, "guest through your door", "guests through your door")))
        if rv["n"]:
            stats.append({"value": f"{rv['avg']:.1f}", "label": "from your guests", "style": "rating"})
        if came_back:
            stats.append(num(came_back, "came back again"))
        if sold_out:
            stats.append(num(sold_out, _plural(sold_out, "night sold out", "nights sold out")))
        if nights:
            stats.append(num(len(nights), _plural(len(nights), "night out as a guest", "nights out as a guest")))
        if people:
            stats.append(people)
        headline = [f"{len(hosted)} {_plural(len(hosted), 'night', 'nights')}", "hosted"]
        kicker = f"{first_name} hosted in {label}"
        photo_src = hosted
    elif kind in ("regular", "first"):
        areas, seen = [], set()
        for n in nights:
            a = (n["area"] or "").strip()
            if a and a.lower() not in seen:
                seen.add(a.lower())
                areas.append(a)
        types = Counter(n["event_type"] for n in nights if n["event_type"] in TYPE_LABEL)
        top = types.most_common(1)[0] if types else None
        streak = _weekend_streak([n["date_time"] for n in nights])
        if people:
            stats.append(people)
        if len(areas) > 1:
            stats.append(num(len(areas), "neighbourhoods"))
        elif areas:
            stats.append(word(areas[0], "where it happened" if len(nights) == 1 else "your neighbourhood"))
        if kind == "regular" and top and top[1] >= 2:
            stats.append(word(TYPE_LABEL[top[0]], "your kind of night"))
        if streak >= 2:
            stats.append(num(streak, "weekends in a row"))
        if vibes_in:
            stats.append(num(vibes_in, _plural(vibes_in, "vibe received", "vibes received")))
        if kind == "first":
            stats.append(word("1st", "of many, we hope"))
        if connections and partied:
            stats.append(num(partied, _plural(partied, "person you partied with", "people you partied with")))
        n = len(nights)
        headline = ["Your first", "night out"] if kind == "first" else [f"{n} {_plural(n, 'night', 'nights')}", "out"]
        kicker = f"{first_name}'s {label} on Gorave"
        photo_src = nights
    else:
        headline = ["A quiet", "month"]
        kicker = f"Your {label} on Gorave"
        photo_src = []

    photos = []
    for e in photo_src:
        url = _photo(e["cover_photos"])
        if url:
            photos.append({"url": url, "title": e["title"]})
        if len(photos) == 3:
            break

    recap = {
        "month": month, "month_label": label, "year": int(month[:4]), "kind": kind,
        "shareable": kind != "quiet", "kicker": kicker, "headline": headline,
        "photos": photos, "stats": stats[:4],
        "nights": len(nights), "hosted": len(hosted), "connections": connections,
    }

    if kind == "quiet":
        cur.execute(
            f"""
            SELECT e.id::text AS id, e.title, e.date_time, e.area, e.price_inr, e.cover_photos
            FROM events e, users u
            WHERE u.id = %(me)s::uuid AND {JOINABLE}
              AND e.date_time > NOW() AND e.date_time < NOW() + INTERVAL '7 days'
            ORDER BY e.date_time LIMIT 3
            """, p)
        nearby = cur.fetchall()
        p["nids"] = [n["id"] for n in nearby] or [None]
        cur.execute(
            f"""
            SELECT COUNT(DISTINCT g.user_id) AS n FROM event_attendees g
            WHERE g.event_id = ANY(%(nids)s::uuid[]) AND g.status = 'going'
              AND g.user_id IN (
                SELECT o.user_id FROM event_attendees mine
                JOIN event_attendees o ON o.event_id = mine.event_id AND o.user_id <> mine.user_id
                WHERE mine.user_id = %(me)s::uuid AND {attended('mine')} AND {attended('o')})
            """, p)
        recap["met_going"] = cur.fetchone()["n"]
        recap["nearby"] = [{
            "id": n["id"], "title": n["title"], "date_time": n["date_time"].isoformat(),
            "area": n["area"], "price_inr": n["price_inr"], "photo": _photo(n["cover_photos"]),
        } for n in nearby]
    return recap


def push_lines(r: dict) -> tuple:
    title = f"Your {r['month_label']} on Gorave is ready"
    if r["kind"] == "host":
        body = f"{r['hosted']} {_plural(r['hosted'], 'night', 'nights')} hosted. See how it went and share it."
    elif r["kind"] == "first":
        body = "Your first night out, and the people you met. See your month."
    else:
        body = f"{r['nights']} {_plural(r['nights'], 'night', 'nights')} out"
        if r["connections"]:
            body += f", {r['connections']} new {_plural(r['connections'], 'connection', 'connections')}"
        body += ". See your month and share it."
    return title, body


def recap_due(now: datetime) -> bool:
    """The 1st to the 3rd of the month, from 11 AM IST (late runs still catch up)."""
    local = now.astimezone(IST)
    return local.day <= 3 and (local.day > 1 or local.hour >= 11)


def send_month_recap(now: Optional[datetime] = None, force: bool = False) -> int:
    """Push + in-app notification for last month's recap, to people who went
    out or hosted. Once a month per person; safe to run again."""
    now = now or datetime.now(timezone.utc)
    if not force and not recap_due(now):
        return 0
    month = previous_month(now)
    start, end, first_day = parse_month(month)
    items = []
    with get_db() as (cur, conn):
        cur.execute(
            f"""
            WITH active AS (
              SELECT ea.user_id FROM event_attendees ea JOIN events e ON e.id = ea.event_id
              WHERE {attended('ea')} AND NOT e.is_cancelled
                AND e.date_time >= %(s)s AND e.date_time < %(e)s
              UNION
              SELECT e.host_id FROM events e
              WHERE e.is_published AND NOT e.is_cancelled AND e.date_time >= %(s)s AND e.date_time < %(e)s
            ), todo AS (
              SELECT u.id FROM users u JOIN active a ON a.user_id = u.id
              WHERE (u.last_recap_month IS NULL OR u.last_recap_month < %(d)s) AND {live('u')}
              LIMIT {PUSH_BATCH}
            )
            UPDATE users u SET last_recap_month = %(d)s FROM todo WHERE u.id = todo.id
            RETURNING u.id::text AS id
            """, {"s": start, "e": end, "d": first_day})
        ids = [r["id"] for r in cur.fetchall()]
        for uid in ids:
            r = build_recap(cur, uid, month)
            if not r or not r["shareable"]:
                continue
            title, body = push_lines(r)
            _insert_notification(cur, uid, "month_recap", title=title, body=body, entity_type="month_recap")
            item = {"user_id": uid, "title": title, "body": body, "data": {"type": "month_recap", "month": month}}
            if r["photos"]:
                item["image_url"] = r["photos"][0]["url"]
            items.append(item)
        conn.commit()
    if items:
        send_push_many(items, category=CATEGORY)
    return len(items)
