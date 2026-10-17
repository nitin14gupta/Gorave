"""Public, read-only API for the marketing website (gorave.in).

No auth. Everything here is safe to show a logged-out visitor:
  · location is area + city only (address lines never leave the server) and
    the pin is rounded to ~1 km — same rule as non-guests in the app
  · guests are aggregate counts only — no names, photos or ids
  · only published events; cancelled ones are flagged, not hidden, so shared
    links still resolve
Responses carry Cache-Control so the website/CDN can cache them briefly.
"""
import uuid
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query, Request, Response
from pydantic import BaseModel

from db.config import get_db
from middleware.rate_limit import client_ip, enforce_rate_limit
from routes.places import CITIES, find_city
from routes.users import compute_host_badges
from utils import seats

router = APIRouter(prefix="/public", tags=["public"])

CACHE_HEADER = "public, max-age=60, s-maxage=300, stale-while-revalidate=600"
EVENT_TYPES = {"house_party", "rooftop", "game_night", "dinner", "music", "other"}


def _guard(request: Request, response: Response) -> None:
    enforce_rate_limit(f"public:ip:{client_ip(request)}", max_events=240, window_seconds=60)
    response.headers["Cache-Control"] = CACHE_HEADER


# ── Schemas ───────────────────────────────────────────────────────────────────

class PublicHost(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    avatar: Optional[str] = None
    badges: List[str] = []
    avg_rating: Optional[float] = None
    review_count: int = 0


class PublicEvent(BaseModel):
    id: str
    title: str
    event_type: str
    date_time: str
    end_time: Optional[str] = None
    city: Optional[str] = None
    area: Optional[str] = None
    lat: Optional[float] = None       # rounded to ~1 km
    lng: Optional[float] = None
    price_inr: int
    is_free: bool
    join_mode: str
    women_pct: Optional[int] = None
    age_restriction: int
    capacity: int
    spots_left: int
    attendee_count: int
    cover_photos: List[str] = []
    is_cancelled: bool = False
    host: PublicHost


class PublicEventDetail(PublicEvent):
    description: Optional[str] = None
    rules: Optional[str] = None
    ratio: Optional[dict] = None
    avg_rating: Optional[float] = None
    review_count: int = 0


class PublicEventsPage(BaseModel):
    events: List[PublicEvent]
    total: int
    has_more: bool


class PublicCity(BaseModel):
    name: str
    state: str
    lat: float
    lng: float
    upcoming_events: int


class PublicHostPlace(BaseModel):
    city: str
    area: Optional[str] = None
    count: int = 0

class PublicHostProfile(PublicHost):
    city: Optional[str] = None
    hosted_count: int = 0
    upcoming: List[PublicEvent] = []
    # Where and what they host (published, non-cancelled events), for linking to city/area/type pages.
    places: List[PublicHostPlace] = []
    types: List[str] = []

class PublicHostCard(PublicHost):
    city: Optional[str] = None
    hosted_count: int = 0
    upcoming_count: int = 0
    areas: List[str] = []

class PublicHostsPage(BaseModel):
    hosts: List[PublicHostCard]
    total: int


# ── Shared SQL ────────────────────────────────────────────────────────────────

_EVENT_SELECT = """
    e.id::text, e.title, e.event_type, e.date_time::text, e.end_time::text,
    e.city, e.area,
    ROUND(e.location_lat::numeric, 2)::float AS lat,
    ROUND(e.location_lng::numeric, 2)::float AS lng,
    e.price_inr, (e.price_inr = 0) AS is_free, e.join_mode, e.women_pct, e.age_restriction,
    e.capacity, e.spots_left, e.cover_photos, e.is_cancelled,
    (SELECT COUNT(*) FROM event_attendees ea WHERE ea.event_id = e.id AND ea.status = 'going')::int AS attendee_count,
    u.name AS host_name, u.username AS host_username,
    (SELECT p.url FROM user_photos p WHERE p.user_id = u.id ORDER BY p.position LIMIT 1) AS host_avatar,
    (SELECT COUNT(*) FROM events he WHERE he.host_id = u.id AND he.is_cancelled = FALSE)::int AS host_hosted_count,
    (SELECT ROUND(AVG(er.rating)::numeric, 1)::float FROM event_reviews er JOIN events he2 ON he2.id = er.event_id WHERE he2.host_id = u.id) AS host_avg_rating,
    (SELECT COUNT(*) FROM event_reviews er2 JOIN events he3 ON he3.id = er2.event_id WHERE he3.host_id = u.id)::int AS host_review_count
"""


def _photos(raw) -> List[str]:
    out = []
    for p in raw or []:
        url = p if isinstance(p, str) else (p or {}).get("url")
        if url:
            out.append(url)
    return out


def _shape(row: dict) -> dict:
    d = dict(row)
    d["cover_photos"] = _photos(d.get("cover_photos"))
    d["host"] = {
        "name": None if d.get("host_name") == "[deleted]" else d.get("host_name"),
        "username": d.pop("host_username", None),
        "avatar": d.pop("host_avatar", None),
        "badges": compute_host_badges(d.pop("host_hosted_count", 0) or 0),
        "avg_rating": d.pop("host_avg_rating", None),
        "review_count": d.pop("host_review_count", 0) or 0,
    }
    d.pop("host_name", None)
    return d


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/cities", response_model=List[PublicCity])
def public_cities(request: Request, response: Response):
    _guard(request, response)
    with get_db() as (cur, _):
        cur.execute(
            """
            SELECT city, COUNT(*)::int AS n FROM events
            WHERE is_published = TRUE AND is_cancelled = FALSE AND date_time > NOW() AND city IS NOT NULL
            GROUP BY city
            """
        )
        counts = {r["city"]: r["n"] for r in cur.fetchall()}
    return [
        {"name": c["name"], "state": c["state"], "lat": c["lat"], "lng": c["lng"], "upcoming_events": counts.get(c["name"], 0)}
        for c in CITIES
    ]


@router.get("/events", response_model=PublicEventsPage)
def public_events(
    request: Request,
    response: Response,
    city: Optional[str] = Query(default=None),
    type: Optional[str] = Query(default=None, description="event_type key, e.g. house_party"),
    area: Optional[str] = Query(default=None),
    when: Optional[str] = Query(default=None, pattern="^(tonight|weekend|week)$"),
    free: Optional[bool] = Query(default=None),
    max_price: Optional[int] = Query(default=None, ge=0),
    women_only: Optional[bool] = Query(default=None),
    min_age: Optional[int] = Query(default=None, ge=18, le=25),
    limit: int = Query(default=24, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    _guard(request, response)
    filters = ["e.is_published = TRUE", "e.is_cancelled = FALSE", "e.date_time > NOW()"]
    params: list = []

    if city:
        c = find_city(city)
        if not c:
            return {"events": [], "total": 0, "has_more": False}
        filters.append("e.city = %s")
        params.append(c["name"])
    if type:
        if type not in EVENT_TYPES:
            raise HTTPException(status_code=422, detail="Unknown event type")
        filters.append("e.event_type = %s")
        params.append(type)
    if area:
        filters.append("e.area ILIKE %s")
        params.append(f"%{area}%")
    # IST calendar logic so "tonight" means tonight in India, not UTC.
    if when == "tonight":
        filters.append("(e.date_time AT TIME ZONE 'Asia/Kolkata')::date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date")
    elif when == "weekend":
        filters.append("e.date_time < NOW() + INTERVAL '7 days'")
        filters.append("EXTRACT(ISODOW FROM e.date_time AT TIME ZONE 'Asia/Kolkata') IN (5, 6, 7)")
    elif when == "week":
        filters.append("e.date_time < NOW() + INTERVAL '7 days'")
    if free is True:
        filters.append("e.price_inr = 0")
    elif free is False:
        filters.append("e.price_inr > 0")
    if max_price is not None:
        filters.append("e.price_inr <= %s")
        params.append(max_price)
    if women_only:
        filters.append("e.women_pct = 100")
    if min_age:
        filters.append("e.age_restriction >= %s")
        params.append(min_age)

    where = " AND ".join(filters)
    with get_db() as (cur, _):
        cur.execute(f"SELECT COUNT(*)::int AS n FROM events e WHERE {where}", params)
        total = cur.fetchone()["n"]
        cur.execute(
            f"""
            SELECT {_EVENT_SELECT}
            FROM events e JOIN users u ON u.id = e.host_id
            WHERE {where}
            ORDER BY e.date_time ASC
            LIMIT %s OFFSET %s
            """,
            params + [limit, offset],
        )
        events = [_shape(r) for r in cur.fetchall()]
    return {"events": events, "total": total, "has_more": offset + len(events) < total}


@router.get("/events/{event_id}", response_model=PublicEventDetail)
def public_event(event_id: str, request: Request, response: Response):
    _guard(request, response)
    try:
        uuid.UUID(event_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Event not found")
    with get_db() as (cur, _):
        cur.execute(
            f"""
            SELECT {_EVENT_SELECT}, e.description, e.rules,
                (SELECT ROUND(AVG(rating)::numeric, 1)::float FROM event_reviews WHERE event_id = e.id) AS avg_rating,
                (SELECT COUNT(*) FROM event_reviews WHERE event_id = e.id)::int AS review_count
            FROM events e JOIN users u ON u.id = e.host_id
            WHERE e.id = %s::uuid AND e.is_published = TRUE
            """,
            (event_id,),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Event not found")
        d = _shape(row)
        d["ratio"] = seats.ratio_left(d["capacity"], d["women_pct"], seats.seat_counts(cur, event_id))
    return d


@router.get("/hosts/{username}", response_model=PublicHostProfile)
def public_host(username: str, request: Request, response: Response):
    _guard(request, response)
    with get_db() as (cur, _):
        cur.execute(
            """
            SELECT u.id::text, u.name, u.username, u.city,
                (SELECT p.url FROM user_photos p WHERE p.user_id = u.id ORDER BY p.position LIMIT 1) AS avatar,
                (SELECT COUNT(*) FROM events he WHERE he.host_id = u.id AND he.is_cancelled = FALSE)::int AS hosted_count,
                (SELECT ROUND(AVG(er.rating)::numeric, 1)::float FROM event_reviews er JOIN events he2 ON he2.id = er.event_id WHERE he2.host_id = u.id) AS avg_rating,
                (SELECT COUNT(*) FROM event_reviews er2 JOIN events he3 ON he3.id = er2.event_id WHERE he3.host_id = u.id)::int AS review_count
            FROM users u
            WHERE LOWER(u.username) = LOWER(%s) AND COALESCE(u.is_deleted, FALSE) = FALSE AND COALESCE(u.is_locked, FALSE) = FALSE
            """,
            (username,),
        )
        host = cur.fetchone()
        if not host or host["hosted_count"] == 0:
            # Only hosts have public pages — regular members stay private.
            raise HTTPException(status_code=404, detail="Host not found")
        cur.execute(
            f"""
            SELECT {_EVENT_SELECT}
            FROM events e JOIN users u ON u.id = e.host_id
            WHERE e.host_id = %s::uuid AND e.is_published = TRUE AND e.is_cancelled = FALSE AND e.date_time > NOW()
            ORDER BY e.date_time ASC LIMIT 12
            """,
            (host["id"],),
        )
        upcoming = [_shape(r) for r in cur.fetchall()]
        cur.execute(
            """
            SELECT e.city, e.area, COUNT(*)::int AS count
            FROM events e
            WHERE e.host_id = %s::uuid AND e.is_published = TRUE AND e.is_cancelled = FALSE AND e.city IS NOT NULL
            GROUP BY e.city, e.area ORDER BY count DESC LIMIT 8
            """,
            (host["id"],),
        )
        places = [dict(r) for r in cur.fetchall()]
        cur.execute(
            """
            SELECT e.event_type FROM events e
            WHERE e.host_id = %s::uuid AND e.is_published = TRUE AND e.is_cancelled = FALSE
            GROUP BY e.event_type ORDER BY COUNT(*) DESC
            """,
            (host["id"],),
        )
        types = [r["event_type"] for r in cur.fetchall()]
    return {
        "places": places, "types": types,
        "name": host["name"], "username": host["username"], "avatar": host["avatar"], "city": host["city"],
        "badges": compute_host_badges(host["hosted_count"]), "hosted_count": host["hosted_count"],
        "avg_rating": host["avg_rating"], "review_count": host["review_count"] or 0, "upcoming": upcoming,
    }


@router.get("/reviews")
def public_reviews(request: Request, response: Response, limit: int = Query(default=6, ge=1, le=20)):
    """Platform-wide rating plus the most recent written reviews.

    Reviewers appear as first name + last initial only; reviews without text
    are counted in the average but not quoted.
    """
    _guard(request, response)
    with get_db() as (cur, _):
        cur.execute(
            """
            SELECT ROUND(AVG(er.rating)::numeric, 1)::float AS avg_rating, COUNT(*)::int AS review_count
            FROM event_reviews er JOIN events e ON e.id = er.event_id
            WHERE e.is_published = TRUE
            """
        )
        agg = cur.fetchone()
        cur.execute(
            """
            SELECT er.rating, er.body, u.name AS reviewer, e.city, e.event_type, e.title AS event_title
            FROM event_reviews er
            JOIN events e ON e.id = er.event_id
            JOIN users u ON u.id = er.reviewer_id
            WHERE e.is_published = TRUE AND er.body IS NOT NULL AND LENGTH(TRIM(er.body)) > 0
              AND COALESCE(u.is_deleted, FALSE) = FALSE
            ORDER BY er.created_at DESC
            LIMIT %s
            """,
            (limit,),
        )
        rows = cur.fetchall()

    def short(name):
        parts = (name or "").split()
        if not parts:
            return "A guest"
        return parts[0] + (f" {parts[-1][0]}." if len(parts) > 1 else "")

    return {
        "avg_rating": agg["avg_rating"],
        "review_count": agg["review_count"] or 0,
        "reviews": [
            {"rating": r["rating"], "body": r["body"].strip(), "name": short(r["reviewer"]), "city": r["city"],
             "event_type": r["event_type"], "event_title": r["event_title"]}
            for r in rows
        ],
    }


@router.get("/hosts", response_model=PublicHostsPage)
def public_hosts(
    request: Request,
    response: Response,
    city: str = Query(..., max_length=100),
    area: Optional[str] = Query(default=None, max_length=120),
    limit: int = Query(default=24, ge=1, le=60),
):
    """Hosts who have hosted (published, non-cancelled) events in a city, or in
    one neighbourhood of it. Most active first: upcoming nights, then history."""
    _guard(request, response)
    where = ["e.is_published = TRUE", "e.is_cancelled = FALSE", "LOWER(e.city) = LOWER(%s)"]
    params: list = [city]
    if area:
        where.append("e.area ILIKE %s")
        params.append(f"{area}%")
    w = " AND ".join(where)
    with get_db() as (cur, _):
        cur.execute(
            f"""
            WITH hosted AS (
                SELECT e.host_id,
                       COUNT(*) FILTER (WHERE e.date_time > NOW())::int AS upcoming_count,
                       ARRAY_AGG(DISTINCT e.area) FILTER (WHERE e.area IS NOT NULL) AS areas
                FROM events e WHERE {w} GROUP BY e.host_id
            )
            SELECT u.name, u.username, u.city, h.upcoming_count, h.areas,
                (SELECT p.url FROM user_photos p WHERE p.user_id = u.id ORDER BY p.position LIMIT 1) AS avatar,
                (SELECT COUNT(*) FROM events he WHERE he.host_id = u.id AND he.is_cancelled = FALSE)::int AS hosted_count,
                (SELECT ROUND(AVG(er.rating)::numeric, 1)::float FROM event_reviews er JOIN events he2 ON he2.id = er.event_id WHERE he2.host_id = u.id) AS avg_rating,
                (SELECT COUNT(*) FROM event_reviews er2 JOIN events he3 ON he3.id = er2.event_id WHERE he3.host_id = u.id)::int AS review_count,
                COUNT(*) OVER()::int AS total
            FROM hosted h JOIN users u ON u.id = h.host_id
            WHERE COALESCE(u.is_deleted, FALSE) = FALSE AND COALESCE(u.is_locked, FALSE) = FALSE AND u.username IS NOT NULL
            ORDER BY h.upcoming_count DESC, hosted_count DESC, u.name
            LIMIT %s
            """,
            (*params, limit),
        )
        rows = cur.fetchall()
    return {
        "total": rows[0]["total"] if rows else 0,
        "hosts": [
            {
                "name": r["name"], "username": r["username"], "avatar": r["avatar"], "city": r["city"],
                "badges": compute_host_badges(r["hosted_count"]), "avg_rating": r["avg_rating"],
                "review_count": r["review_count"] or 0, "hosted_count": r["hosted_count"],
                "upcoming_count": r["upcoming_count"], "areas": (r["areas"] or [])[:4],
            }
            for r in rows
        ],
    }
