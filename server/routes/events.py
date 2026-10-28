from fastapi import APIRouter, BackgroundTasks, Depends, Query, HTTPException
from typing import List, Optional
from datetime import datetime, timezone, timedelta, date
from pydantic import BaseModel
from middleware.auth import get_current_user
from db.config import get_db
from utils.push import send_push
from routes.payments import PLATFORM_FEE_INR, HOST_COMMISSION_RATE
from routes.users import compute_host_badges
from middleware.rate_limit import enforce_rate_limit
from routes.places import find_city, distance_km
from utils import seats

router = APIRouter(prefix="/events", tags=["events"])

# Single source of truth for both create and edit, so the two can't drift apart.
MIN_TICKET_PRICE_INR = 99
FREE_EVENTS_PER_MONTH = 2
# A guest can send (or re-send after withdrawing) a join request this many
# times per event. A host decline is final regardless.
_MAX_JOIN_REQUESTS = 2  # first request + one more chance after withdrawing


def _join_mode_for(price_inr: int) -> str:
    """Free events are host-approved so free spots can't be swept up in one
    go; paid events book instantly."""
    return "request" if price_inr == 0 else "instant"


def _free_events_this_month(cur, host_id: str, exclude_event_id: Optional[str] = None) -> int:
    cur.execute(
        """
        SELECT COUNT(*)::int AS count FROM events
        WHERE host_id = %s::uuid AND price_inr = 0
          AND DATE_TRUNC('month', created_at AT TIME ZONE 'UTC')
            = DATE_TRUNC('month', NOW() AT TIME ZONE 'UTC')
          AND is_cancelled = FALSE
          AND (%s::uuid IS NULL OR id != %s::uuid)
        """,
        (host_id, exclude_event_id, exclude_event_id),
    )
    return cur.fetchone()["count"]


def _fee_snapshot(price_inr: int) -> tuple[int, int, int]:
    """Platform fee, host commission, and total profit for a ticket at this
    price — computed once at creation/edit time so each event keeps the rates
    it was created under even if the global fee/commission changes later."""
    if price_inr == 0:
        return 0, 0, 0
    fee = PLATFORM_FEE_INR
    commission = round(price_inr * HOST_COMMISSION_RATE)
    return fee, commission, fee + commission

# ── Cancelling your own spot ────────────────────────────────────────────────
# Free: until 2h before the start (the spot goes to the next person).
# Paid: until 48h before the start, the ticket price comes back to the
#   wallet; the ₹50 platform fee is kept (the guest chose to leave).
# Paid, event moved by more than 7 days after you bought: 48h from the move
#   to cancel for everything back, ticket and fee.
# A host or admin cancel always refunds everything (_cancel_event_and_refund).
FREE_CANCEL_CUTOFF = timedelta(hours=2)
PAID_CANCEL_CUTOFF = timedelta(hours=48)
RESCHEDULE_REFUND_WINDOW = timedelta(hours=48)
RESCHEDULE_THRESHOLD = timedelta(days=7)


def _utc(dt):
    if dt is None:
        return None
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt


def _cancel_quote(ev: dict, att: dict, now: datetime | None = None) -> dict:
    """Whether a going guest can cancel, until when, and how much comes back.
    `ev` needs date_time, is_cancelled, rescheduled_at; `att` needs status,
    payment_id, price_paid_inr, fee_paid_inr, refunded_at, joined_at."""
    now = now or datetime.now(timezone.utc)
    start = _utc(ev["date_time"])
    paid = bool(att.get("payment_id")) and (att.get("price_paid_inr") or 0) > 0
    price = att.get("price_paid_inr") or 0
    fee = att.get("fee_paid_inr") or 0
    quote = {"allowed": False, "kind": "paid" if paid else "free", "refund_inr": 0,
             "fee_kept_inr": 0, "deadline": None, "reason": None}

    if att.get("status") != "going" or ev.get("is_cancelled"):
        return {**quote, "reason": "Nothing to cancel"}
    if att.get("refunded_at"):
        return {**quote, "reason": "This ticket was already refunded"}
    if now >= start:
        return {**quote, "reason": "The event has already started"}

    if not paid:
        deadline = start - FREE_CANCEL_CUTOFF
        if now < deadline:
            return {**quote, "allowed": True, "deadline": deadline.isoformat()}
        return {**quote, "deadline": deadline.isoformat(),
                "reason": "Free spots can be cancelled up to 2 hours before the start"}

    moved = _utc(ev.get("rescheduled_at"))
    bought = _utc(att.get("joined_at"))
    if moved and (bought is None or bought < moved):
        window_end = min(moved + RESCHEDULE_REFUND_WINDOW, start)
        if now < window_end:
            return {**quote, "allowed": True, "kind": "moved", "refund_inr": price + fee,
                    "deadline": window_end.isoformat()}

    deadline = start - PAID_CANCEL_CUTOFF
    if now < deadline:
        return {**quote, "allowed": True, "refund_inr": price, "fee_kept_inr": fee,
                "deadline": deadline.isoformat()}
    return {**quote, "deadline": deadline.isoformat(),
            "reason": "Paid tickets can be cancelled up to 48 hours before the start"}


def _calc_age(dob: date) -> int:
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


def _promote_next_waitlist(cur, event_id: str) -> dict | None:
    """Promote the oldest waitlister whose gender still has room under the
    event's crowd mix. Holds the spot by decrementing spots_left."""
    cur.execute("SELECT capacity, spots_left, women_pct FROM events WHERE id = %s", (event_id,))
    ev = cur.fetchone()
    if not ev or ev["spots_left"] <= 0:
        return None
    cur.execute(
        """
        SELECT ea.id, ea.user_id::text, u.name, u.gender
        FROM event_attendees ea
        JOIN users u ON u.id = ea.user_id
        WHERE ea.event_id = %s AND ea.status = 'waitlist' AND ea.offer_expires_at IS NULL
        ORDER BY ea.joined_at ASC
        LIMIT 200
        """,
        (event_id,),
    )
    candidates = cur.fetchall()
    if not candidates:
        return None
    counts = seats.seat_counts(cur, event_id)
    next_row = next(
        (c for c in candidates
         if seats.bucket_has_room(ev["capacity"], ev["women_pct"], counts, seats.gender_bucket(c["gender"]))),
        None,
    )
    if not next_row:
        return None
    cur.execute(
        "UPDATE event_attendees SET offer_expires_at = NOW() + INTERVAL '1 hour' WHERE id = %s",
        (next_row["id"],),
    )
    cur.execute(
        "UPDATE events SET spots_left = GREATEST(0, spots_left - 1) WHERE id = %s",
        (event_id,),
    )
    return {"id": next_row["id"], "user_id": next_row["user_id"], "name": next_row["name"]}


def _expire_stale_offers(cur, event_id: str) -> list:
    """Expire promoted users who didn't confirm in time. Returns list of expired user_ids."""
    cur.execute(
        """
        UPDATE event_attendees
        SET status = 'cancelled', blocked_from_rejoin = TRUE, offer_expires_at = NULL
        WHERE event_id = %s AND status = 'waitlist'
          AND offer_expires_at IS NOT NULL AND offer_expires_at < NOW()
        RETURNING user_id::text
        """,
        (event_id,),
    )
    expired = [r["user_id"] for r in cur.fetchall()]
    if not expired:
        return expired

    # Only re-promote if event starts more than 2h from now — under 2h the spot becomes an empty seat
    cur.execute("SELECT date_time FROM events WHERE id = %s", (event_id,))
    ev_row = cur.fetchone()
    ev_dt = ev_row["date_time"] if ev_row else None
    if ev_dt and ev_dt.tzinfo is None:
        ev_dt = ev_dt.replace(tzinfo=timezone.utc)
    waitlist_still_open = ev_dt and ev_dt > datetime.now(timezone.utc) + timedelta(hours=2)

    for _ in expired:
        cur.execute(
            "UPDATE events SET spots_left = LEAST(capacity, spots_left + 1) WHERE id = %s",
            (event_id,),
        )
        if waitlist_still_open:
            _promote_next_waitlist(cur, event_id)
    return expired


# ── Schemas ───────────────────────────────────────────────────────────────────

class EventPhotoItem(BaseModel):
    url: str
    position: int


class EventSummary(BaseModel):
    id: str
    title: str
    event_type: str
    date_time: str
    end_time: Optional[str] = None
    location_name: Optional[str] = None
    location_lat: Optional[float] = None
    city: Optional[str] = None
    area: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    pincode: Optional[str] = None
    # True when the viewer isn't the host or a confirmed guest — the address
    # lines are withheld and the pin is rounded to ~1km.
    is_location_masked: bool = False
    join_mode: str = "instant"                  # 'instant' | 'request'
    women_pct: Optional[int] = None             # NULL = open crowd
    my_rsvp_status: Optional[str] = None
    waitlist_count: int = 0
    is_waitlist_full: bool = False
    location_lng: Optional[float] = None
    price_inr: int
    is_free: bool
    platform_fee_inr: int = 0
    host_commission_inr: int = 0
    platform_profit_inr: int = 0
    spots_left: int
    capacity: int
    distance_km: Optional[int] = None
    cover_photos: List[EventPhotoItem] = []
    host_id: Optional[str] = None
    host_name: Optional[str] = None
    host_avatar: Optional[str] = None
    host_is_deleted: bool = False
    age_restriction: int
    attendee_count: int = 0
    attendee_avatars: List[str] = []
    is_cancelled: bool = False
    is_following_host: bool = False
    attended_host_before: bool = False
    paid_attended_host_before: bool = False
    is_hotlisted: bool = False
    my_checked_in_at: Optional[str] = None
    my_review_rating: Optional[int] = None


class MyEventsPage(BaseModel):
    events: List[EventSummary]
    upcoming_count: int
    past_count: int
    has_more: bool


class EventDetail(EventSummary):
    description: Optional[str] = None
    rules: Optional[str] = None
    host_id: str
    host_badges: List[str] = []
    is_cancelled: bool
    cancel_deadline: str
    edit_deadline: str
    my_ticket_token: Optional[str] = None
    my_checked_in_at: Optional[str] = None
    avg_rating: Optional[float] = None
    review_count: int = 0
    host_avg_rating: Optional[float] = None
    host_review_count: int = 0
    # 'going' | 'waitlist' | 'cancelled' | 'requested' | 'declined' | 'expired' | None
    my_rsvp_status: Optional[str] = None
    my_waitlist_position: Optional[int] = None  # position in queue (1-indexed), None if not on waitlist
    my_offer_expires_at: Optional[str] = None   # ISO string when promoted, else None
    my_review_rating: Optional[int] = None
    # Can I cancel my spot, until when, and what comes back (see _cancel_quote).
    my_cancel: Optional[dict] = None
    my_can_request_again: bool = True
    my_requests_left: int = _MAX_JOIN_REQUESTS    # join requests this user can still send for this event
    max_join_requests: int = _MAX_JOIN_REQUESTS
    ratio: Optional[dict] = None                # {women_pct, women_left, men_left, open_left}
    pending_request_count: int = 0              # host only


class CheckinBody(BaseModel):
    ticket_token: str
    method: str = 'qr_scan'  # 'qr_scan' | 'manual_host'


class ReviewBody(BaseModel):
    rating: int
    body: Optional[str] = None


class ReportEventBody(BaseModel):
    reason: str
    description: Optional[str] = None


class CreateEventBody(BaseModel):
    title: str
    event_type: str
    description: Optional[str] = None
    rules: Optional[str] = None
    date_time: str
    end_time: str
    capacity: int = 20
    age_restriction: int = 18
    location_name: Optional[str] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    city: Optional[str] = None
    area: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    pincode: Optional[str] = None
    women_pct: Optional[int] = None
    price_inr: int = 0
    cover_photos: List[str] = []


class RsvpBody(BaseModel):
    action: str  # "going" | "cancel"


# ── Helpers ────────────────────────────────────────────────────────────────────

def _haversine_sql(me_lat, me_lng):
    return f"""
        ROUND(6371.0 * acos(LEAST(1.0,
            cos(radians({me_lat})) * cos(radians(e.location_lat)) *
            cos(radians(e.location_lng) - radians({me_lng})) +
            sin(radians({me_lat})) * sin(radians(e.location_lat))
        )))::int
    """


# Same box the client validates against (validateCreateEventStep.ts INDIA_BOUNDS).
_INDIA_BOUNDS = {"min_lat": 6.0, "max_lat": 37.6, "min_lng": 68.0, "max_lng": 97.5}
# How far the pin may sit from the chosen city's centre — generous enough for
# metro sprawl (Navi Mumbai, Noida) but catches "picked Mumbai, pinned Delhi".
_MAX_PIN_DISTANCE_FROM_CITY_KM = 60


def _clean(v: Optional[str]) -> Optional[str]:
    v = (v or "").strip()
    return v or None


def _validate_location(body: "CreateEventBody") -> dict:
    """Validates the structured address and returns normalised fields plus
    the composed location_name every existing display site reads."""
    city = find_city(body.city)
    if not city:
        raise HTTPException(status_code=422, detail="Pick the city your event is in")
    line1 = _clean(body.address_line1)
    if not line1:
        raise HTTPException(status_code=422, detail="Add the flat, house or building for your event")
    lat, lng = body.location_lat, body.location_lng
    if lat is None or lng is None:
        raise HTTPException(status_code=422, detail="Drop a pin on the map at the entrance")
    b = _INDIA_BOUNDS
    if not (b["min_lat"] <= lat <= b["max_lat"] and b["min_lng"] <= lng <= b["max_lng"]):
        raise HTTPException(status_code=422, detail="Events must be located in India")
    if distance_km(lat, lng, city["lat"], city["lng"]) > _MAX_PIN_DISTANCE_FROM_CITY_KM:
        raise HTTPException(status_code=422, detail=f"The map pin is outside {city['name']} — move it or change the city")
    pincode = _clean(body.pincode)
    if pincode and not (len(pincode) == 6 and pincode.isdigit()):
        raise HTTPException(status_code=422, detail="Pincode must be 6 digits")
    area = _clean(body.area)
    line2 = _clean(body.address_line2)
    location_name = ", ".join(p for p in (line1, line2, area, city["name"]) if p)
    return {
        "city": city["name"], "area": area, "address_line1": line1, "address_line2": line2,
        "pincode": pincode, "location_name": location_name, "location_lat": lat, "location_lng": lng,
    }


def _validate_women_pct(v: Optional[int]) -> Optional[int]:
    if v is None:
        return None
    if not (0 <= v <= 100) or v % 10 != 0:
        raise HTTPException(status_code=422, detail="Crowd mix must be in steps of 10%")
    return v


def _mask_location(d: dict) -> None:
    d["is_location_masked"] = True
    d["location_name"] = ", ".join(p for p in (d.get("area"), d.get("city")) if p) or None
    d["address_line1"] = d["address_line2"] = d["pincode"] = None
    if d.get("location_lat") is not None:
        d["location_lat"] = round(d["location_lat"], 2)
    if d.get("location_lng") is not None:
        d["location_lng"] = round(d["location_lng"], 2)


def _apply_location_privacy(cur, rows: list, viewer_id: str) -> list:
    """Exact address is for the host and confirmed guests only — everyone
    else sees "Area, City" and a ~1km-rounded pin (same idea as Airbnb
    hiding the exact listing location until booking)."""
    ids = [d["id"] for d in rows if d.get("host_id") != viewer_id]
    if not ids:
        return rows
    cur.execute(
        "SELECT event_id::text FROM event_attendees WHERE user_id = %s::uuid AND status = 'going' AND event_id = ANY(%s::uuid[])",
        (viewer_id, ids),
    )
    going = {r["event_id"] for r in cur.fetchall()}
    for d in rows:
        if d.get("host_id") != viewer_id and d["id"] not in going:
            _mask_location(d)
    return rows


def _shape_event_rows(rows) -> list:
    result = []
    for row in rows:
        d = dict(row)
        photos_raw = d.get("cover_photos") or []
        d["cover_photos"] = [{"url": p, "position": i} for i, p in enumerate(photos_raw)] if isinstance(photos_raw, list) and photos_raw and isinstance(photos_raw[0], str) else photos_raw
        result.append(d)
    return result


# ── GET /events ────────────────────────────────────────────────────────────────

@router.get("", response_model=List[EventSummary])
def list_events(
    lat: Optional[float] = Query(default=None),
    lng: Optional[float] = Query(default=None),
    radius_km: Optional[int] = Query(default=50),
    city: Optional[str] = Query(default=None),
    category: Optional[str] = Query(default=None),
    is_free: Optional[bool] = Query(default=None),
    date_range: Optional[str] = Query(default=None),  # tonight | weekend | all
    q: Optional[str] = Query(default=None),
    min_lat: Optional[float] = Query(default=None),
    max_lat: Optional[float] = Query(default=None),
    min_lng: Optional[float] = Query(default=None),
    max_lng: Optional[float] = Query(default=None),
    # Calendar-style date-window queries (e.g. "everything in the next 90
    # days") need a much higher cap than the browse/map feeds — a plain
    # distance/relevance-ranked top-30 silently drops real events that are
    # merely farther away, which reads as "the calendar is missing events."
    start_date: Optional[str] = Query(default=None),
    end_date: Optional[str] = Query(default=None),
    limit: int = Query(default=30, le=200),
    # Discovery feeds (events tab, Trending): only events you could still
    # join. Leaves out your own events, ones you're already in, waiting on or
    # were declined from, and women-only / men-only events that aren't for you.
    discover: bool = Query(default=False),
    # Only this person's events (their profile page).
    host_id: Optional[str] = Query(default=None),
    current_user: dict = Depends(get_current_user),
):
    viewer_id = current_user["id"]

    city_row = find_city(city)
    if city and not city_row:
        return []
    # Within a city, "closest first" uses the device location when we have it,
    # otherwise the city centre — so the feed is always distance-ordered.
    if lat and lng:
        sort_lat, sort_lng = lat, lng
    elif city_row:
        sort_lat, sort_lng = city_row["lat"], city_row["lng"]
    else:
        sort_lat = sort_lng = None
    dist_sql = _haversine_sql(float(sort_lat), float(sort_lng)) if sort_lat and sort_lng else "NULL::int"

    filters = ["e.is_published = TRUE", "e.is_cancelled = FALSE", "e.date_time > NOW()"]
    filter_params: list = []

    if host_id:
        filters.append("e.host_id = %s::uuid")
        filter_params.append(host_id)

    if city_row:
        filters.append("e.city = %s")
        filter_params.append(city_row["name"])

    if discover:
        filters.append("e.host_id != %s::uuid")
        filters.append(
            "NOT EXISTS (SELECT 1 FROM event_attendees ea WHERE ea.event_id = e.id AND ea.user_id = %s::uuid"
            " AND ea.status IN ('going', 'waitlist', 'requested', 'declined'))"
        )
        filter_params.extend([viewer_id, viewer_id])
        with get_db() as (gcur, _):
            gcur.execute("SELECT gender FROM users WHERE id = %s", (viewer_id,))
            grow = gcur.fetchone()
        gender = (grow or {}).get("gender")
        # women_pct 100 = women only, 0 = men only, NULL or a split = everyone.
        if gender == "Female":
            filters.append("(e.women_pct IS NULL OR e.women_pct <> 0)")
        elif gender == "Male":
            filters.append("(e.women_pct IS NULL OR e.women_pct <> 100)")
        else:
            filters.append("(e.women_pct IS NULL OR e.women_pct NOT IN (0, 100))")

    if category:
        filters.append("e.event_type = %s")
        filter_params.append(category)

    if is_free is True:
        filters.append("e.price_inr = 0")
    elif is_free is False:
        filters.append("e.price_inr > 0")

    if date_range == "tonight":
        filters.append("e.date_time::date = CURRENT_DATE")
    elif date_range == "weekend":
        filters.append("EXTRACT(DOW FROM e.date_time) IN (5, 6, 0)")

    if start_date:
        filters.append("e.date_time::date >= %s")
        filter_params.append(start_date)
    if end_date:
        filters.append("e.date_time::date <= %s")
        filter_params.append(end_date)

    if q:
        # Area/city rather than location_name, so search can't be used to
        # probe for a private street address.
        filters.append("(e.title ILIKE %s OR e.area ILIKE %s OR e.city ILIKE %s)")
        like = f"%{q}%"
        filter_params.extend([like, like, like])

    # Viewport bounds take priority over radius — used by MapLibre's onRegionDidChange
    if min_lat is not None and max_lat is not None and min_lng is not None and max_lng is not None:
        filters.append("e.location_lat BETWEEN %s AND %s")
        filters.append("e.location_lng BETWEEN %s AND %s")
        filter_params.extend([min_lat, max_lat, min_lng, max_lng])
    elif lat and lng and radius_km and not city_row:
        filters.append(f"""
            6371.0 * acos(LEAST(1.0,
                cos(radians(%s)) * cos(radians(e.location_lat)) *
                cos(radians(e.location_lng) - radians(%s)) +
                sin(radians(%s)) * sin(radians(e.location_lat))
            )) <= %s
        """)
        filter_params.extend([lat, lng, lat, radius_km])

    where = "WHERE " + " AND ".join(filters)

    # Relationship signals — used to rank every listing (browsing or search),
    # see the ORDER BY below, and also returned so the client can show "why"
    # badges (e.g. "You've been to their events").
    relationship_select = """
        EXISTS(
            SELECT 1 FROM follows
            WHERE follower_id = %s::uuid AND following_id = e.host_id
        ) AS is_following_host,
        EXISTS(
            SELECT 1 FROM event_attendees ea
            WHERE ea.user_id = %s::uuid AND ea.status = 'going'
              AND ea.event_id IN (SELECT id FROM events WHERE host_id = e.host_id)
        ) AS attended_host_before,
        EXISTS(
            SELECT 1 FROM event_attendees ea
            WHERE ea.user_id = %s::uuid AND ea.status = 'going' AND ea.payment_id IS NOT NULL
              AND ea.event_id IN (SELECT id FROM events WHERE host_id = e.host_id)
        ) AS paid_attended_host_before,
        EXISTS(
            SELECT 1 FROM event_hotlist h
            WHERE h.user_id = %s::uuid AND h.event_id = e.id
        ) AS is_hotlisted
    """
    relationship_params = [viewer_id, viewer_id, viewer_id, viewer_id]

    default_order = dist_sql + " ASC NULLS LAST, e.date_time ASC" if sort_lat and sort_lng else "e.date_time ASC"
    # Relationship ranking (paid-attended > attended > following) applies to
    # every listing, not just an active text search — a followed host's event
    # should float up whether you're browsing nearby or typing a query. Text
    # relevance (exact/prefix title match) only makes sense when there's a q.
    text_rank_sql = "(LOWER(e.title) = LOWER(%s)) DESC, (LOWER(e.title) LIKE LOWER(%s)) DESC," if q else ""
    order_sql = f"""
        paid_attended_host_before DESC,
        attended_host_before DESC,
        is_following_host DESC,
        {text_rank_sql}
        {default_order}
    """
    order_params = [q, f"{q}%"] if q else []

    sql = f"""
        SELECT
            e.id::text,
            e.title, e.event_type,
            e.date_time::text, e.end_time::text,
            e.location_name, e.location_lat, e.location_lng,
                e.city, e.area, e.address_line1, e.address_line2, e.pincode, e.join_mode, e.women_pct,
            e.price_inr, (e.price_inr = 0) AS is_free,
            e.platform_fee_inr, e.host_commission_inr, e.platform_profit_inr,
            e.spots_left, e.capacity, e.age_restriction,
            e.cover_photos,
            e.host_id::text,
            {dist_sql} AS distance_km,
            (SELECT ea.status FROM event_attendees ea WHERE ea.event_id = e.id AND ea.user_id = %s::uuid) AS my_rsvp_status,
            u.name AS host_name,
            (SELECT p.url FROM user_photos p WHERE p.user_id = u.id ORDER BY p.position LIMIT 1) AS host_avatar,
            COALESCE(u.is_deleted, FALSE) AS host_is_deleted,
            (SELECT COUNT(*) FROM event_attendees ea WHERE ea.event_id = e.id AND ea.status = 'going')::int AS attendee_count,
            (SELECT COALESCE(json_agg(au.avatar_url), '[]'::json) FROM (
                SELECT (SELECT p.url FROM user_photos p WHERE p.user_id = eav.user_id ORDER BY p.position LIMIT 1) AS avatar_url
                FROM event_attendees eav
                WHERE eav.event_id = e.id AND eav.status = 'going'
                ORDER BY EXISTS(
                    SELECT 1 FROM follows fo WHERE fo.follower_id = %s::uuid AND fo.following_id = eav.user_id
                ) DESC, eav.joined_at ASC LIMIT 3
            ) au WHERE au.avatar_url IS NOT NULL) AS attendee_avatars,
            {relationship_select}
        FROM events e
        JOIN users u ON u.id = e.host_id
        {where}
        ORDER BY {order_sql}
        LIMIT %s
    """
    params = [viewer_id, viewer_id] + relationship_params + filter_params + order_params + [limit]

    with get_db() as (cur, _):
        cur.execute(sql, params)
        result = _apply_location_privacy(cur, _shape_event_rows(cur.fetchall()), viewer_id)
    # Distance from the city centre isn't "distance from you" — only show
    # distance when it was measured from the device.
    if not (lat and lng):
        for d in result:
            d["distance_km"] = None
    return result


# ── GET /events/hosted — events I am hosting (full, unpaginated list — used
# by the calendar, account-deletion check, home "My Events" section, and the
# search modal, all of which need the complete set, not one page of it) ──────

@router.get("/hosted", response_model=List[EventSummary])
def get_hosted_events(current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, _):
        cur.execute(
            """
            SELECT
                e.id::text,
                e.title, e.event_type,
                e.date_time::text, e.end_time::text,
                e.location_name, e.location_lat, e.location_lng,
                e.city, e.area, e.address_line1, e.address_line2, e.pincode, e.join_mode, e.women_pct,
                e.price_inr, (e.price_inr = 0) AS is_free,
            e.platform_fee_inr, e.host_commission_inr, e.platform_profit_inr,
                e.spots_left, e.capacity, e.age_restriction,
                e.cover_photos, e.is_cancelled,
                e.host_id::text,
                NULL::int AS distance_km,
                u.name AS host_name,
                (SELECT p.url FROM user_photos p WHERE p.user_id = u.id ORDER BY p.position LIMIT 1) AS host_avatar,
                COALESCE(u.is_deleted, FALSE) AS host_is_deleted,
                (SELECT COUNT(*) FROM event_attendees ea WHERE ea.event_id = e.id AND ea.status = 'going')::int AS attendee_count,
                (SELECT COALESCE(json_agg(au.avatar_url), '[]'::json) FROM (
                    SELECT (SELECT p.url FROM user_photos p WHERE p.user_id = eav.user_id ORDER BY p.position LIMIT 1) AS avatar_url
                    FROM event_attendees eav
                    WHERE eav.event_id = e.id AND eav.status = 'going'
                    ORDER BY EXISTS(
                        SELECT 1 FROM follows fo WHERE fo.follower_id = %s::uuid AND fo.following_id = eav.user_id
                    ) DESC, eav.joined_at ASC LIMIT 3
                ) au WHERE au.avatar_url IS NOT NULL) AS attendee_avatars,
                EXISTS(SELECT 1 FROM event_hotlist h WHERE h.user_id = %s::uuid AND h.event_id = e.id) AS is_hotlisted
            FROM events e
            JOIN users u ON u.id = e.host_id
            WHERE e.host_id = %s::uuid
            ORDER BY e.date_time DESC
            """,
            (uid, uid, uid),
        )
        rows = cur.fetchall()
    result = []
    for row in rows:
        d = dict(row)
        photos_raw = d.get("cover_photos") or []
        d["cover_photos"] = [{"url": p, "position": i} for i, p in enumerate(photos_raw)] if isinstance(photos_raw, list) and photos_raw and isinstance(photos_raw[0], str) else photos_raw
        result.append(d)
    return result


# ── GET /events/hosted/paged — paginated hosted events for the My Events
# screen: cheap upcoming/past counts on every call, but only fetches the
# content of whichever tab is active, a page at a time ──────────────────────

@router.get("/hosted/paged", response_model=MyEventsPage)
def get_hosted_events_paged(
    tab: str = Query("upcoming", pattern="^(upcoming|past)$"),
    limit: int = Query(6, ge=1, le=50),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    uid = current_user["id"]
    is_past = tab == "past"
    with get_db() as (cur, _):
        cur.execute(
            """
            SELECT
                COUNT(*) FILTER (WHERE e.date_time < NOW())  AS past_count,
                COUNT(*) FILTER (WHERE e.date_time >= NOW()) AS upcoming_count
            FROM events e
            WHERE e.host_id = %s::uuid
            """,
            (uid,),
        )
        counts = cur.fetchone()
        upcoming_count = int(counts["upcoming_count"])
        past_count = int(counts["past_count"])

        cur.execute(
            f"""
            SELECT
                e.id::text,
                e.title, e.event_type,
                e.date_time::text, e.end_time::text,
                e.location_name, e.location_lat, e.location_lng,
                e.city, e.area, e.address_line1, e.address_line2, e.pincode, e.join_mode, e.women_pct,
                e.price_inr, (e.price_inr = 0) AS is_free,
            e.platform_fee_inr, e.host_commission_inr, e.platform_profit_inr,
                e.spots_left, e.capacity, e.age_restriction,
                e.cover_photos, e.is_cancelled,
                e.host_id::text,
                NULL::int AS distance_km,
                u.name AS host_name,
                (SELECT p.url FROM user_photos p WHERE p.user_id = u.id ORDER BY p.position LIMIT 1) AS host_avatar,
                COALESCE(u.is_deleted, FALSE) AS host_is_deleted,
                (SELECT COUNT(*) FROM event_attendees ea WHERE ea.event_id = e.id AND ea.status = 'going')::int AS attendee_count,
                (SELECT COALESCE(json_agg(au.avatar_url), '[]'::json) FROM (
                    SELECT (SELECT p.url FROM user_photos p WHERE p.user_id = eav.user_id ORDER BY p.position LIMIT 1) AS avatar_url
                    FROM event_attendees eav
                    WHERE eav.event_id = e.id AND eav.status = 'going'
                    ORDER BY eav.joined_at ASC LIMIT 3
                ) au WHERE au.avatar_url IS NOT NULL) AS attendee_avatars,
                EXISTS(SELECT 1 FROM event_hotlist h WHERE h.user_id = %s::uuid AND h.event_id = e.id) AS is_hotlisted
            FROM events e
            JOIN users u ON u.id = e.host_id
            WHERE e.host_id = %s::uuid AND e.date_time {"<" if is_past else ">="} NOW()
            ORDER BY e.date_time {"DESC" if is_past else "ASC"}
            LIMIT %s OFFSET %s
            """,
            (uid, uid, limit, offset),
        )
        rows = cur.fetchall()
    result = []
    for row in rows:
        d = dict(row)
        photos_raw = d.get("cover_photos") or []
        d["cover_photos"] = [{"url": p, "position": i} for i, p in enumerate(photos_raw)] if isinstance(photos_raw, list) and photos_raw and isinstance(photos_raw[0], str) else photos_raw
        result.append(d)
    tab_total = past_count if is_past else upcoming_count
    return {
        "events": result,
        "upcoming_count": upcoming_count,
        "past_count": past_count,
        "has_more": offset + len(result) < tab_total,
    }


# ── GET /events/joined — events I have RSVPed to (full, unpaginated list —
# same reasoning as /hosted above: other consumers need the complete set) ────

@router.get("/joined", response_model=List[EventSummary])
def get_joined_events(current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, _):
        cur.execute(
            """
            SELECT
                e.id::text,
                e.title, e.event_type,
                e.date_time::text, e.end_time::text,
                e.location_name, e.location_lat, e.location_lng,
                e.city, e.area, e.address_line1, e.address_line2, e.pincode, e.join_mode, e.women_pct,
                e.price_inr, (e.price_inr = 0) AS is_free,
            e.platform_fee_inr, e.host_commission_inr, e.platform_profit_inr,
                e.spots_left, e.capacity, e.age_restriction,
                e.cover_photos, e.is_cancelled,
                e.host_id::text,
                NULL::int AS distance_km,
                u.name AS host_name,
                (SELECT p.url FROM user_photos p WHERE p.user_id = u.id ORDER BY p.position LIMIT 1) AS host_avatar,
                COALESCE(u.is_deleted, FALSE) AS host_is_deleted,
                (SELECT COUNT(*) FROM event_attendees ea2 WHERE ea2.event_id = e.id AND ea2.status = 'going')::int AS attendee_count,
                (SELECT COALESCE(json_agg(au.avatar_url), '[]'::json) FROM (
                    SELECT (SELECT p.url FROM user_photos p WHERE p.user_id = eav.user_id ORDER BY p.position LIMIT 1) AS avatar_url
                    FROM event_attendees eav
                    WHERE eav.event_id = e.id AND eav.status = 'going'
                    ORDER BY EXISTS(
                        SELECT 1 FROM follows fo WHERE fo.follower_id = %s::uuid AND fo.following_id = eav.user_id
                    ) DESC, eav.joined_at ASC LIMIT 3
                ) au WHERE au.avatar_url IS NOT NULL) AS attendee_avatars,
                EXISTS(SELECT 1 FROM event_hotlist h WHERE h.user_id = %s::uuid AND h.event_id = e.id) AS is_hotlisted,
                ea.checked_in_at::text AS my_checked_in_at,
                (SELECT rating FROM event_reviews WHERE event_id = e.id AND reviewer_id = %s::uuid LIMIT 1) AS my_review_rating
            FROM events e
            JOIN users u ON u.id = e.host_id
            JOIN event_attendees ea ON ea.event_id = e.id AND ea.user_id = %s::uuid AND ea.status = 'going'
            ORDER BY e.date_time DESC
            """,
            (uid, uid, uid, uid),
        )
        rows = cur.fetchall()
    result = []
    for row in rows:
        d = dict(row)
        photos_raw = d.get("cover_photos") or []
        d["cover_photos"] = [{"url": p, "position": i} for i, p in enumerate(photos_raw)] if isinstance(photos_raw, list) and photos_raw and isinstance(photos_raw[0], str) else photos_raw
        result.append(d)
    return result


# ── GET /events/joined/paged — paginated joined events for the Joined Events
# screen (same pattern as /hosted/paged) ─────────────────────────────────────

@router.get("/joined/paged", response_model=MyEventsPage)
def get_joined_events_paged(
    tab: str = Query("upcoming", pattern="^(upcoming|past)$"),
    limit: int = Query(6, ge=1, le=50),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    uid = current_user["id"]
    is_past = tab == "past"
    with get_db() as (cur, _):
        cur.execute(
            """
            SELECT
                COUNT(*) FILTER (WHERE e.date_time < NOW())  AS past_count,
                COUNT(*) FILTER (WHERE e.date_time >= NOW()) AS upcoming_count
            FROM events e
            JOIN event_attendees ea ON ea.event_id = e.id AND ea.user_id = %s::uuid AND ea.status = 'going'
            """,
            (uid,),
        )
        counts = cur.fetchone()
        upcoming_count = int(counts["upcoming_count"])
        past_count = int(counts["past_count"])

        cur.execute(
            f"""
            SELECT
                e.id::text,
                e.title, e.event_type,
                e.date_time::text, e.end_time::text,
                e.location_name, e.location_lat, e.location_lng,
                e.city, e.area, e.address_line1, e.address_line2, e.pincode, e.join_mode, e.women_pct,
                e.price_inr, (e.price_inr = 0) AS is_free,
            e.platform_fee_inr, e.host_commission_inr, e.platform_profit_inr,
                e.spots_left, e.capacity, e.age_restriction,
                e.cover_photos, e.is_cancelled,
                e.host_id::text,
                NULL::int AS distance_km,
                u.name AS host_name,
                (SELECT p.url FROM user_photos p WHERE p.user_id = u.id ORDER BY p.position LIMIT 1) AS host_avatar,
                COALESCE(u.is_deleted, FALSE) AS host_is_deleted,
                (SELECT COUNT(*) FROM event_attendees ea2 WHERE ea2.event_id = e.id AND ea2.status = 'going')::int AS attendee_count,
                (SELECT COALESCE(json_agg(au.avatar_url), '[]'::json) FROM (
                    SELECT (SELECT p.url FROM user_photos p WHERE p.user_id = eav.user_id ORDER BY p.position LIMIT 1) AS avatar_url
                    FROM event_attendees eav
                    WHERE eav.event_id = e.id AND eav.status = 'going'
                    ORDER BY eav.joined_at ASC LIMIT 3
                ) au WHERE au.avatar_url IS NOT NULL) AS attendee_avatars,
                EXISTS(SELECT 1 FROM event_hotlist h WHERE h.user_id = %s::uuid AND h.event_id = e.id) AS is_hotlisted
            FROM events e
            JOIN users u ON u.id = e.host_id
            JOIN event_attendees ea ON ea.event_id = e.id AND ea.user_id = %s::uuid AND ea.status = 'going'
            WHERE e.date_time {"<" if is_past else ">="} NOW()
            ORDER BY e.date_time {"DESC" if is_past else "ASC"}
            LIMIT %s OFFSET %s
            """,
            (uid, uid, limit, offset),
        )
        rows = cur.fetchall()
    result = []
    for row in rows:
        d = dict(row)
        photos_raw = d.get("cover_photos") or []
        d["cover_photos"] = [{"url": p, "position": i} for i, p in enumerate(photos_raw)] if isinstance(photos_raw, list) and photos_raw and isinstance(photos_raw[0], str) else photos_raw
        result.append(d)
    tab_total = past_count if is_past else upcoming_count
    return {
        "events": result,
        "upcoming_count": upcoming_count,
        "past_count": past_count,
        "has_more": offset + len(result) < tab_total,
    }


# ── GET /events/waitlisted — events I'm on the waitlist for ──────────────────

@router.get("/waitlisted", response_model=List[EventSummary])
def get_waitlisted_events(current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, _):
        cur.execute(
            """
            SELECT
                e.id::text,
                e.title, e.event_type,
                e.date_time::text, e.end_time::text,
                e.location_name, e.location_lat, e.location_lng,
                e.city, e.area, e.address_line1, e.address_line2, e.pincode, e.join_mode, e.women_pct,
                e.price_inr, (e.price_inr = 0) AS is_free,
            e.platform_fee_inr, e.host_commission_inr, e.platform_profit_inr,
                e.spots_left, e.capacity, e.age_restriction,
                e.cover_photos, e.is_cancelled,
                e.host_id::text,
                NULL::int AS distance_km,
                u.name AS host_name,
                (SELECT p.url FROM user_photos p WHERE p.user_id = u.id ORDER BY p.position LIMIT 1) AS host_avatar,
                COALESCE(u.is_deleted, FALSE) AS host_is_deleted,
                (SELECT COUNT(*) FROM event_attendees ea2 WHERE ea2.event_id = e.id AND ea2.status = 'going')::int AS attendee_count,
                (SELECT COALESCE(json_agg(au.avatar_url), '[]'::json) FROM (
                    SELECT (SELECT p.url FROM user_photos p WHERE p.user_id = eav.user_id ORDER BY p.position LIMIT 1) AS avatar_url
                    FROM event_attendees eav
                    WHERE eav.event_id = e.id AND eav.status = 'going'
                    ORDER BY eav.joined_at ASC LIMIT 3
                ) au WHERE au.avatar_url IS NOT NULL) AS attendee_avatars,
                EXISTS(SELECT 1 FROM event_hotlist h WHERE h.user_id = %s::uuid AND h.event_id = e.id) AS is_hotlisted
            FROM events e
            JOIN users u ON u.id = e.host_id
            JOIN event_attendees ea ON ea.event_id = e.id AND ea.user_id = %s::uuid AND ea.status = 'waitlist'
            ORDER BY e.date_time ASC
            """,
            (uid, uid),
        )
        return _apply_location_privacy(cur, _shape_event_rows(cur.fetchall()), uid)


@router.get("/requested", response_model=List[EventSummary])
def get_requested_events(current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, _):
        # Upcoming free events you asked to join that the host hasn't answered yet.
        cur.execute(
            """
            SELECT
                e.id::text,
                e.title, e.event_type,
                e.date_time::text, e.end_time::text,
                e.location_name, e.location_lat, e.location_lng,
                e.city, e.area, e.address_line1, e.address_line2, e.pincode, e.join_mode, e.women_pct,
                e.price_inr, (e.price_inr = 0) AS is_free,
            e.platform_fee_inr, e.host_commission_inr, e.platform_profit_inr,
                e.spots_left, e.capacity, e.age_restriction,
                e.cover_photos, e.is_cancelled,
                e.host_id::text,
                NULL::int AS distance_km,
                u.name AS host_name,
                (SELECT p.url FROM user_photos p WHERE p.user_id = u.id ORDER BY p.position LIMIT 1) AS host_avatar,
                COALESCE(u.is_deleted, FALSE) AS host_is_deleted,
                (SELECT COUNT(*) FROM event_attendees ea2 WHERE ea2.event_id = e.id AND ea2.status = 'going')::int AS attendee_count,
                (SELECT COALESCE(json_agg(au.avatar_url), '[]'::json) FROM (
                    SELECT (SELECT p.url FROM user_photos p WHERE p.user_id = eav.user_id ORDER BY p.position LIMIT 1) AS avatar_url
                    FROM event_attendees eav
                    WHERE eav.event_id = e.id AND eav.status = 'going'
                    ORDER BY eav.joined_at ASC LIMIT 3
                ) au WHERE au.avatar_url IS NOT NULL) AS attendee_avatars,
                EXISTS(SELECT 1 FROM event_hotlist h WHERE h.user_id = %s::uuid AND h.event_id = e.id) AS is_hotlisted
            FROM events e
            JOIN users u ON u.id = e.host_id
            JOIN event_attendees ea ON ea.event_id = e.id AND ea.user_id = %s::uuid AND ea.status = 'requested'
            AND e.is_cancelled = FALSE AND COALESCE(e.end_time, e.date_time + interval '6 hours') > NOW()
            ORDER BY e.date_time ASC
            """,
            (uid, uid),
        )
        return _apply_location_privacy(cur, _shape_event_rows(cur.fetchall()), uid)


# ── Hotlist — events a user has saved/bookmarked, not necessarily going to ───
# (see event_hotlist table). Zomato-style "save for later", separate from
# RSVP/waitlist which are about attendance.

@router.get("/hotlist", response_model=List[EventSummary])
def get_hotlist_events(current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, _):
        # Auto-remove events that have already ended — nobody wants a hotlist
        # full of stuff that's over. Mirrors the end_time-aware "is past"
        # rule the client uses (see client/src/lib/dates.ts:isEventPast).
        cur.execute(
            """
            DELETE FROM event_hotlist h
            USING events e
            WHERE h.event_id = e.id AND h.user_id = %s::uuid
              AND COALESCE(e.end_time, e.date_time) < NOW()
            """,
            (uid,),
        )
        cur.execute(
            """
            SELECT
                e.id::text,
                e.title, e.event_type,
                e.date_time::text, e.end_time::text,
                e.location_name, e.location_lat, e.location_lng,
                e.city, e.area, e.address_line1, e.address_line2, e.pincode, e.join_mode, e.women_pct,
                e.price_inr, (e.price_inr = 0) AS is_free,
            e.platform_fee_inr, e.host_commission_inr, e.platform_profit_inr,
                e.spots_left, e.capacity, e.age_restriction,
                e.cover_photos, e.is_cancelled,
                e.host_id::text,
                NULL::int AS distance_km,
                u.name AS host_name,
                (SELECT p.url FROM user_photos p WHERE p.user_id = u.id ORDER BY p.position LIMIT 1) AS host_avatar,
                COALESCE(u.is_deleted, FALSE) AS host_is_deleted,
                (SELECT COUNT(*) FROM event_attendees ea2 WHERE ea2.event_id = e.id AND ea2.status = 'going')::int AS attendee_count,
                (SELECT COALESCE(json_agg(au.avatar_url), '[]'::json) FROM (
                    SELECT (SELECT p.url FROM user_photos p WHERE p.user_id = eav.user_id ORDER BY p.position LIMIT 1) AS avatar_url
                    FROM event_attendees eav
                    WHERE eav.event_id = e.id AND eav.status = 'going'
                    ORDER BY eav.joined_at ASC LIMIT 3
                ) au WHERE au.avatar_url IS NOT NULL) AS attendee_avatars,
                TRUE AS is_hotlisted
            FROM events e
            JOIN users u ON u.id = e.host_id
            JOIN event_hotlist h ON h.event_id = e.id AND h.user_id = %s::uuid
            ORDER BY h.created_at DESC
            """,
            (uid,),
        )
        return _apply_location_privacy(cur, _shape_event_rows(cur.fetchall()), uid)


@router.post("/{event_id}/hotlist", status_code=201)
def add_to_hotlist(event_id: str, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, _):
        cur.execute(
            "SELECT (COALESCE(end_time, date_time) < NOW()) AS is_past FROM events WHERE id = %s::uuid",
            (event_id,),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Event not found")
        if row["is_past"]:
            raise HTTPException(status_code=400, detail="This event has already ended")
        cur.execute(
            """
            INSERT INTO event_hotlist (event_id, user_id)
            VALUES (%s::uuid, %s::uuid)
            ON CONFLICT (event_id, user_id) DO NOTHING
            """,
            (event_id, uid),
        )
    return {"ok": True}


@router.delete("/{event_id}/hotlist")
def remove_from_hotlist(event_id: str, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, _):
        cur.execute(
            "DELETE FROM event_hotlist WHERE event_id = %s::uuid AND user_id = %s::uuid",
            (event_id, uid),
        )
    return {"ok": True}


# ── Calendar screen ──────────────────────────────────────────────────────────
# The old approach had the calendar pull the full unpaginated /hosted,
# /joined and /waitlisted lists (a user's entire history, no date bound) just
# to know which days deserve a dot. That gets slower forever as an account
# ages. Instead: a cheap month-scoped summary (dates + booleans, no event
# payload) drives the grid, and full event details are fetched lazily, one
# day at a time, only for whichever day the user actually taps.

class CalendarDaySummary(BaseModel):
    date: str
    has_joined: bool = False
    has_hosted: bool = False
    has_waitlisted: bool = False
    has_other: bool = False


class CalendarDayEvents(BaseModel):
    joined: List[EventSummary] = []
    hosted: List[EventSummary] = []
    waitlisted: List[EventSummary] = []
    other: List[EventSummary] = []


_EVENT_COLUMNS = """
    e.id::text, e.title, e.event_type,
    e.date_time::text, e.end_time::text,
    e.location_name, e.location_lat, e.location_lng,
                e.city, e.area, e.address_line1, e.address_line2, e.pincode, e.join_mode, e.women_pct,
    e.price_inr, (e.price_inr = 0) AS is_free,
    e.platform_fee_inr, e.host_commission_inr, e.platform_profit_inr,
    e.spots_left, e.capacity, e.age_restriction,
    e.cover_photos, e.is_cancelled,
    e.host_id::text,
    NULL::int AS distance_km,
    u.name AS host_name,
    (SELECT p.url FROM user_photos p WHERE p.user_id = u.id ORDER BY p.position LIMIT 1) AS host_avatar,
    COALESCE(u.is_deleted, FALSE) AS host_is_deleted,
    (SELECT COUNT(*) FROM event_attendees ea2 WHERE ea2.event_id = e.id AND ea2.status = 'going')::int AS attendee_count,
    (SELECT COALESCE(json_agg(au.avatar_url), '[]'::json) FROM (
        SELECT (SELECT p.url FROM user_photos p WHERE p.user_id = eav.user_id ORDER BY p.position LIMIT 1) AS avatar_url
        FROM event_attendees eav
        WHERE eav.event_id = e.id AND eav.status = 'going'
        ORDER BY eav.joined_at ASC LIMIT 3
    ) au WHERE au.avatar_url IS NOT NULL) AS attendee_avatars,
    EXISTS(SELECT 1 FROM event_hotlist h WHERE h.user_id = %s::uuid AND h.event_id = e.id) AS is_hotlisted
"""


def _other_filter_sql(date_filter: str, params: list, uid: str, lat, lng, radius_km, city=None) -> tuple[str, list]:
    """'Other' = published, not cancelled, upcoming events that aren't mine
    (not hosted, not going, not waitlisted) — same definition the client used
    to compute locally, now scoped server-side per day/month instead."""
    filters = [
        "e.is_published = TRUE", "e.is_cancelled = FALSE", "e.date_time > NOW()",
        date_filter,
        "e.host_id != %s::uuid",
        "NOT EXISTS (SELECT 1 FROM event_attendees ea WHERE ea.event_id = e.id AND ea.user_id = %s::uuid AND ea.status IN ('going', 'waitlist'))",
    ]
    all_params = params + [uid, uid]
    city_row = find_city(city)
    if city_row:
        filters.append("e.city = %s")
        all_params.append(city_row["name"])
    elif lat is not None and lng is not None and radius_km:
        filters.append("""
            6371.0 * acos(LEAST(1.0,
                cos(radians(%s)) * cos(radians(e.location_lat)) *
                cos(radians(e.location_lng) - radians(%s)) +
                sin(radians(%s)) * sin(radians(e.location_lat))
            )) <= %s
        """)
        all_params.extend([lat, lng, lat, radius_km])
    return " AND ".join(filters), all_params


@router.get("/calendar/summary", response_model=List[CalendarDaySummary])
def get_calendar_summary(
    start_date: str = Query(...),
    end_date: str = Query(...),
    lat: Optional[float] = Query(default=None),
    lng: Optional[float] = Query(default=None),
    radius_km: Optional[int] = Query(default=50),
    city: Optional[str] = Query(default=None),
    current_user: dict = Depends(get_current_user),
):
    uid = current_user["id"]
    days: dict = {}

    def mark(d, key):
        k = d.isoformat()
        entry = days.setdefault(k, {"date": k, "has_joined": False, "has_hosted": False, "has_waitlisted": False, "has_other": False})
        entry[key] = True

    with get_db() as (cur, _):
        cur.execute(
            """
            SELECT DISTINCT e.date_time::date AS d
            FROM events e
            JOIN event_attendees ea ON ea.event_id = e.id AND ea.user_id = %s::uuid AND ea.status = 'going'
            WHERE e.date_time::date BETWEEN %s AND %s
            """,
            (uid, start_date, end_date),
        )
        for row in cur.fetchall():
            mark(row["d"], "has_joined")

        cur.execute(
            """
            SELECT DISTINCT e.date_time::date AS d
            FROM events e
            WHERE e.host_id = %s::uuid AND e.date_time::date BETWEEN %s AND %s
            """,
            (uid, start_date, end_date),
        )
        for row in cur.fetchall():
            mark(row["d"], "has_hosted")

        cur.execute(
            """
            SELECT DISTINCT e.date_time::date AS d
            FROM events e
            JOIN event_attendees ea ON ea.event_id = e.id AND ea.user_id = %s::uuid AND ea.status = 'waitlist'
            WHERE e.date_time::date BETWEEN %s AND %s
            """,
            (uid, start_date, end_date),
        )
        for row in cur.fetchall():
            mark(row["d"], "has_waitlisted")

        other_where, other_params = _other_filter_sql(
            "e.date_time::date BETWEEN %s AND %s", [start_date, end_date], uid, lat, lng, radius_km, city,
        )
        cur.execute(f"SELECT DISTINCT e.date_time::date AS d FROM events e WHERE {other_where}", other_params)
        for row in cur.fetchall():
            mark(row["d"], "has_other")

    return list(days.values())


@router.get("/calendar/day", response_model=CalendarDayEvents)
def get_calendar_day(
    date_: str = Query(..., alias="date"),
    lat: Optional[float] = Query(default=None),
    lng: Optional[float] = Query(default=None),
    radius_km: Optional[int] = Query(default=50),
    city: Optional[str] = Query(default=None),
    current_user: dict = Depends(get_current_user),
):
    uid = current_user["id"]
    with get_db() as (cur, _):
        cur.execute(
            f"""
            SELECT {_EVENT_COLUMNS}
            FROM events e
            JOIN users u ON u.id = e.host_id
            JOIN event_attendees ea ON ea.event_id = e.id AND ea.user_id = %s::uuid AND ea.status = 'going'
            WHERE e.date_time::date = %s
            """,
            (uid, uid, date_),
        )
        joined = _shape_event_rows(cur.fetchall())

        cur.execute(
            f"""
            SELECT {_EVENT_COLUMNS}
            FROM events e
            JOIN users u ON u.id = e.host_id
            WHERE e.host_id = %s::uuid AND e.date_time::date = %s
            """,
            (uid, uid, date_),
        )
        hosted = _shape_event_rows(cur.fetchall())

        cur.execute(
            f"""
            SELECT {_EVENT_COLUMNS}
            FROM events e
            JOIN users u ON u.id = e.host_id
            JOIN event_attendees ea ON ea.event_id = e.id AND ea.user_id = %s::uuid AND ea.status = 'waitlist'
            WHERE e.date_time::date = %s
            """,
            (uid, uid, date_),
        )
        waitlisted = _apply_location_privacy(cur, _shape_event_rows(cur.fetchall()), uid)

        other_where, other_params = _other_filter_sql("e.date_time::date = %s", [date_], uid, lat, lng, radius_km, city)
        cur.execute(
            f"""
            SELECT {_EVENT_COLUMNS}
            FROM events e
            JOIN users u ON u.id = e.host_id
            WHERE {other_where}
            ORDER BY e.date_time ASC
            """,
            [uid] + other_params,
        )
        other = _apply_location_privacy(cur, _shape_event_rows(cur.fetchall()), uid)

    return {"joined": joined, "hosted": hosted, "waitlisted": waitlisted, "other": other}


# ── GET /events/free-slots ────────────────────────────────────────────────────
# Must be registered BEFORE /{event_id} so FastAPI doesn't swallow "free-slots" as a UUID.

@router.get("/free-slots")
def get_free_slots(current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, _):
        cur.execute(
            """
            SELECT COUNT(*)::int AS count FROM events
            WHERE host_id = %s::uuid AND price_inr = 0
              AND DATE_TRUNC('month', created_at AT TIME ZONE 'UTC')
                = DATE_TRUNC('month', NOW() AT TIME ZONE 'UTC')
              AND is_cancelled = FALSE
            """,
            (uid,),
        )
        used = cur.fetchone()["count"]
    today = date.today()
    if today.month == 12:
        resets_on = date(today.year + 1, 1, 1).isoformat()
    else:
        resets_on = date(today.year, today.month + 1, 1).isoformat()
    return {"used": used, "limit": FREE_EVENTS_PER_MONTH, "resets_on": resets_on}


# ── GET /events/{id} ──────────────────────────────────────────────────────────

@router.get("/{event_id}", response_model=EventDetail)
def get_event(event_id: str, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, _):
        cur.execute(
            """
            SELECT
                e.id::text, e.title, e.event_type,
                e.date_time::text, e.end_time::text,
                e.description, e.rules,
                e.location_name, e.location_lat, e.location_lng,
                e.city, e.area, e.address_line1, e.address_line2, e.pincode, e.join_mode, e.women_pct,
                e.price_inr, (e.price_inr = 0) AS is_free,
            e.platform_fee_inr, e.host_commission_inr, e.platform_profit_inr,
                e.spots_left, e.capacity, e.age_restriction,
                e.cover_photos, e.is_cancelled,
                e.host_id::text,
                (e.date_time - INTERVAL '48 hours')::text AS cancel_deadline,
                (e.date_time - INTERVAL '7 hours')::text AS edit_deadline,
                u.name AS host_name,
                (SELECT p.url FROM user_photos p WHERE p.user_id = u.id ORDER BY p.position LIMIT 1) AS host_avatar,
                COALESCE(u.is_deleted, FALSE) AS host_is_deleted,
                (SELECT COUNT(*) FROM events he
                 WHERE he.host_id = u.id AND COALESCE(he.is_cancelled, FALSE) = FALSE
                )::int AS host_hosted_events_count,
                (SELECT ROUND(AVG(er.rating)::numeric, 1) FROM event_reviews er
                 JOIN events he2 ON he2.id = er.event_id
                 WHERE he2.host_id = u.id
                ) AS host_avg_rating,
                (SELECT COUNT(*) FROM event_reviews er2
                 JOIN events he3 ON he3.id = er2.event_id
                 WHERE he3.host_id = u.id
                )::int AS host_review_count,
                (SELECT COUNT(*) FROM event_attendees ea WHERE ea.event_id = e.id AND ea.status = 'going')::int AS attendee_count,
                (SELECT COALESCE(json_agg(au.avatar_url), '[]'::json) FROM (
                    SELECT (SELECT p.url FROM user_photos p WHERE p.user_id = eav.user_id ORDER BY p.position LIMIT 1) AS avatar_url
                    FROM event_attendees eav
                    WHERE eav.event_id = e.id AND eav.status = 'going'
                    ORDER BY EXISTS(
                        SELECT 1 FROM follows fo WHERE fo.follower_id = %s::uuid AND fo.following_id = eav.user_id
                    ) DESC, eav.joined_at ASC LIMIT 3
                ) au WHERE au.avatar_url IS NOT NULL) AS attendee_avatars,
                NULL::int AS distance_km,
                going_ea.ticket_token AS my_ticket_token,
                going_ea.checked_in_at::text AS my_checked_in_at,
                (SELECT ROUND(AVG(rating)::numeric, 1) FROM event_reviews WHERE event_id = e.id) AS avg_rating,
                (SELECT COUNT(*) FROM event_reviews WHERE event_id = e.id)::int AS review_count,
                (SELECT rating FROM event_reviews WHERE event_id = e.id AND reviewer_id = %s::uuid LIMIT 1) AS my_review_rating,
                -- Waitlist fields
                (SELECT COUNT(*) FROM event_attendees wl
                 WHERE wl.event_id = e.id AND wl.status = 'waitlist' AND wl.offer_expires_at IS NULL)::int AS waitlist_count,
                (SELECT COUNT(*) FROM event_attendees wl
                 WHERE wl.event_id = e.id AND wl.status = 'waitlist' AND wl.offer_expires_at IS NULL
                )::int >= FLOOR(e.capacity * 0.5) AS is_waitlist_full,
                -- Viewer's RSVP status
                (SELECT ea2.status FROM event_attendees ea2
                 WHERE ea2.event_id = e.id AND ea2.user_id = %s::uuid
                 LIMIT 1) AS my_rsvp_status,
                -- Viewer's waitlist position (NULL if not in regular queue)
                (SELECT COUNT(*) FROM event_attendees pos
                 WHERE pos.event_id = e.id AND pos.status = 'waitlist' AND pos.offer_expires_at IS NULL
                   AND pos.joined_at <= (
                     SELECT joined_at FROM event_attendees
                     WHERE event_id = e.id AND user_id = %s::uuid AND status = 'waitlist' AND offer_expires_at IS NULL
                   )
                )::int AS my_waitlist_position,
                -- Viewer's promotion offer expiry
                (SELECT ea3.offer_expires_at::text FROM event_attendees ea3
                 WHERE ea3.event_id = e.id AND ea3.user_id = %s::uuid
                   AND ea3.status = 'waitlist' AND ea3.offer_expires_at IS NOT NULL
                 LIMIT 1) AS my_offer_expires_at,
                EXISTS(
                    SELECT 1 FROM event_hotlist h
                    WHERE h.user_id = %s::uuid AND h.event_id = e.id
                ) AS is_hotlisted
            FROM events e
            JOIN users u ON u.id = e.host_id
            LEFT JOIN event_attendees going_ea ON going_ea.event_id = e.id AND going_ea.user_id = %s::uuid AND going_ea.status = 'going'
            WHERE e.id = %s
            """,
            (uid, uid, uid, uid, uid, uid, uid, event_id),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Event not found")

        d = _shape_event_rows([row])[0]
        d["ratio"] = seats.ratio_left(d["capacity"], d["women_pct"], seats.seat_counts(cur, event_id))
        if d["host_id"] == uid:
            cur.execute(
                "SELECT COUNT(*)::int AS n FROM event_attendees WHERE event_id = %s AND status = 'requested'",
                (event_id,),
            )
            d["pending_request_count"] = cur.fetchone()["n"]
        else:
            cur.execute(
                """
                SELECT ea.request_count, ea.status, ea.payment_id, ea.price_paid_inr, ea.fee_paid_inr,
                       ea.refunded_at, ea.joined_at, e.date_time, e.is_cancelled, e.rescheduled_at
                FROM event_attendees ea JOIN events e ON e.id = ea.event_id
                WHERE ea.event_id = %s AND ea.user_id = %s::uuid
                """,
                (event_id, uid),
            )
            mine = cur.fetchone()
            used = mine["request_count"] if mine else 0
            if mine and mine["status"] == "going":
                d["my_cancel"] = _cancel_quote(mine, mine)
            d["my_requests_left"] = max(0, _MAX_JOIN_REQUESTS - used)
            d["my_can_request_again"] = (
                d.get("my_rsvp_status") not in ("declined",)
                and used < _MAX_JOIN_REQUESTS
            )
        _apply_location_privacy(cur, [d], uid)

    # 0 position means not in regular queue (promoted or not on waitlist)
    if not d.get("my_waitlist_position"):
        d["my_waitlist_position"] = None
    d["host_badges"] = compute_host_badges(d.pop("host_hosted_events_count", 0))
    return d


# ── POST /events ──────────────────────────────────────────────────────────────

@router.post("", response_model=EventDetail, status_code=201)
def create_event(body: CreateEventBody, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    # Parse and validate date_time
    try:
        dt = datetime.fromisoformat(body.date_time.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid date_time format")

    now = datetime.now(timezone.utc)
    if dt < now + timedelta(hours=24):
        raise HTTPException(status_code=422, detail="Events must be posted at least 24 hours in advance")

    try:
        end_dt = datetime.fromisoformat(body.end_time.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid end_time format")

    duration = end_dt - dt
    if duration.total_seconds() < 3600:
        raise HTTPException(status_code=422, detail="Event must be at least 1 hour long")
    if duration.total_seconds() > 72 * 3600:
        raise HTTPException(status_code=422, detail="Events can't run longer than 3 days")

    if not (5 <= body.capacity <= 200):
        raise HTTPException(status_code=422, detail="Capacity must be between 5 and 200")

    loc = _validate_location(body)
    women_pct = _validate_women_pct(body.women_pct)

    # Check monthly free event limit
    uid = current_user["id"]
    enforce_rate_limit(f"events:create:user:{uid}", max_events=10, window_seconds=86400,
                        message="You're creating events too quickly, try again later.")
    with get_db() as (cur, _):
        free_this_month = _free_events_this_month(cur, uid)

    slots_exhausted = free_this_month >= FREE_EVENTS_PER_MONTH

    if body.price_inr == 0 and slots_exhausted:
        raise HTTPException(status_code=422, detail=f"You've used your {FREE_EVENTS_PER_MONTH} free events this month. Set a ticket price (minimum ₹{MIN_TICKET_PRICE_INR}).")
    if body.price_inr != 0 and body.price_inr < MIN_TICKET_PRICE_INR:
        raise HTTPException(status_code=422, detail=f"Minimum ticket price is ₹{MIN_TICKET_PRICE_INR}")

    if body.age_restriction not in (18, 21, 25):
        raise HTTPException(status_code=422, detail="Age restriction must be 18, 21, or 25")

    cover_photos = body.cover_photos or []
    fee_inr, commission_inr, profit_inr = _fee_snapshot(body.price_inr)

    with get_db() as (cur, conn):
        cur.execute(
            """
            SELECT COUNT(*)::int AS count FROM events
            WHERE host_id = %s::uuid AND is_cancelled = FALSE
            """,
            (current_user["id"],),
        )
        hosted_count_before = cur.fetchone()["count"]
        badge_before = compute_host_badges(hosted_count_before)

        cur.execute(
            """
            INSERT INTO events (
                host_id, title, description, rules, event_type,
                date_time, end_time, capacity, spots_left, age_restriction,
                location_name, location_lat, location_lng,
                city, area, address_line1, address_line2, pincode,
                join_mode, women_pct,
                price_inr, cover_photos, is_published,
                platform_fee_inr, host_commission_inr, platform_profit_inr
            ) VALUES (
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s, %s, %s,
                %s, %s,
                %s, %s::jsonb, TRUE,
                %s, %s, %s
            )
            RETURNING id::text
            """,
            (
                current_user["id"], body.title, body.description, body.rules, body.event_type,
                body.date_time, body.end_time, body.capacity, body.capacity, body.age_restriction,
                loc["location_name"], loc["location_lat"], loc["location_lng"],
                loc["city"], loc["area"], loc["address_line1"], loc["address_line2"], loc["pincode"],
                _join_mode_for(body.price_inr), women_pct,
                body.price_inr, __import__('json').dumps(cover_photos),
                fee_inr, commission_inr, profit_inr,
            ),
        )
        new_id = cur.fetchone()["id"]

        # Did this event push the host into a new badge tier? (e.g. their
        # 2nd non-cancelled event → "Rising", 10th → "Established", ...)
        badge_after = compute_host_badges(hosted_count_before + 1)
        new_badge = badge_after[0] if badge_after and badge_after != badge_before else None

        # Notify followers about the new event
        from routes.notifications import notify_followers_event_created, notify_event_created, notify_host_badge_earned, HOST_BADGE_COPY
        cur.execute("SELECT name FROM users WHERE id = %s::uuid", (current_user["id"],))
        host_row = cur.fetchone()
        host_name = host_row["name"] if host_row else "Someone"
        notify_followers_event_created(cur, current_user["id"], new_id, body.title, host_name)

        # Confirm to the host that their event was created successfully
        notify_event_created(cur, current_user["id"], new_id, body.title)

        if new_badge:
            notify_host_badge_earned(cur, current_user["id"], new_badge)

        if hosted_count_before == 0:
            from routes.notifications import notify_first_event_hosted
            notify_first_event_hosted(cur, current_user["id"], new_id, body.title)

        # Collect follower IDs for push delivery after commit
        cur.execute(
            "SELECT follower_id::text FROM follows WHERE following_id = %s::uuid",
            (current_user["id"],),
        )
        follower_ids = [r["follower_id"] for r in cur.fetchall()]
        conn.commit()

    from utils.push import get_event_image_url, get_user_avatar_url
    cover_url = get_event_image_url(new_id)

    for fid in follower_ids:
        background_tasks.add_task(
            send_push, fid, f"{host_name} posted an event",
            body.title,
            {"type": "event", "event_id": new_id}, cover_url, category="social",
        )

    background_tasks.add_task(
        send_push, current_user["id"], "Your event is live!",
        f"{body.title} was posted successfully.",
        {"type": "event", "event_id": new_id}, cover_url, category="hosting",
    )

    if new_badge:
        badge_title, badge_body = HOST_BADGE_COPY.get(new_badge, (f"You're a {new_badge} Host now!", None))
        avatar_url = get_user_avatar_url(current_user["id"])
        background_tasks.add_task(
            send_push, current_user["id"], badge_title,
            badge_body or "",
            {"type": "profile", "user_id": current_user["id"]}, avatar_url, category="hosting",
        )

    if hosted_count_before == 0:
        background_tasks.add_task(
            send_push, current_user["id"], "You're officially a host! \U0001f973",
            f"{body.title} is your first event — nice work.",
            {"type": "event", "event_id": new_id}, cover_url, category="hosting",
        )

    return get_event(new_id, current_user)


# ── PATCH /events/{id} ────────────────────────────────────────────────────────

@router.patch("/{event_id}", response_model=EventDetail)
def update_event(event_id: str, body: CreateEventBody, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, conn):
        cur.execute(
            """
            SELECT host_id::text, date_time, capacity, title, description, rules,
                event_type, end_time, age_restriction, location_name, location_lat,
                location_lng, price_inr, women_pct,
                city, area, address_line1, address_line2, pincode,
                (SELECT COUNT(*) FROM event_attendees WHERE event_id = %s AND status = 'going')::int AS attendee_count,
                (SELECT COUNT(*) FROM event_attendees WHERE event_id = %s AND status IN ('going', 'requested', 'waitlist'))::int AS engaged_count
            FROM events WHERE id = %s
            """,
            (event_id, event_id, event_id),
        )
        ev = cur.fetchone()
        if not ev:
            raise HTTPException(status_code=404, detail="Event not found")
        if ev["host_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not your event")
        free_this_month = _free_events_this_month(cur, current_user["id"], exclude_event_id=event_id)

    loc = _validate_location(body)
    women_pct = _validate_women_pct(body.women_pct)
    if not (5 <= body.capacity <= 200):
        raise HTTPException(status_code=422, detail="Capacity must be between 5 and 200")
    if body.age_restriction not in (18, 21, 25):
        raise HTTPException(status_code=422, detail="Age restriction must be 18, 21, or 25")

    has_guests = ev["attendee_count"] > 0
    if has_guests and body.age_restriction != ev["age_restriction"]:
        raise HTTPException(status_code=400, detail="Age limit can't change once guests have joined")
    if has_guests and women_pct != ev["women_pct"]:
        raise HTTPException(status_code=400, detail="Crowd mix can't change once guests have joined")
    # Free ↔ paid flips change how people join (request vs instant booking)
    # and whether anyone owes money — lock it once anyone is involved.
    if (ev["price_inr"] == 0) != (body.price_inr == 0):
        if ev["engaged_count"] > 0:
            raise HTTPException(status_code=400, detail="Can't switch between free and paid once people have joined or requested")
        if body.price_inr == 0 and free_this_month >= FREE_EVENTS_PER_MONTH:
            raise HTTPException(status_code=422, detail=f"You've used your {FREE_EVENTS_PER_MONTH} free events this month")

    now = datetime.now(timezone.utc)
    dt = ev["date_time"]
    dt = dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt
    edit_deadline = dt - timedelta(hours=7)
    capacity_deadline = dt - timedelta(hours=2)
    ed = edit_deadline.replace(tzinfo=timezone.utc) if edit_deadline.tzinfo is None else edit_deadline

    capacity_increasing = body.capacity > ev["capacity"]
    capacity_decreasing = body.capacity < ev["capacity"]

    # Determine if any non-capacity fields have changed
    def _parse_dt(s):
        try: return datetime.fromisoformat(s.replace("Z", "+00:00")) if s else None
        except: return None
    body_dt = _parse_dt(body.date_time)
    ev_dt   = ev["date_time"].replace(tzinfo=timezone.utc) if ev["date_time"].tzinfo is None else ev["date_time"]
    body_end = _parse_dt(body.end_time) if body.end_time else None
    ev_end   = (ev["end_time"].replace(tzinfo=timezone.utc) if ev["end_time"] and ev["end_time"].tzinfo is None else ev["end_time"]) if ev["end_time"] else None

    non_capacity_changed = (
        body.title != ev["title"] or
        (body.description or "") != (ev["description"] or "") or
        (body.rules or "") != (ev["rules"] or "") or
        body.event_type != ev["event_type"] or
        (body_dt and body_dt != ev_dt) or
        (body_end != ev_end) or
        body.age_restriction != ev["age_restriction"] or
        women_pct != ev["women_pct"] or
        any(loc[k] != ev[k] for k in ("location_name", "location_lat", "location_lng", "city", "area",
                                       "address_line1", "address_line2", "pincode")) or
        body.price_inr != ev["price_inr"]
    )

    if non_capacity_changed and now > ed:
        raise HTTPException(status_code=403, detail="Events can only be edited up to 7 hours before start")

    # Validate end_time duration whenever start or end changes
    new_dt  = body_dt or ev_dt
    new_end = body_end or ev_end
    if new_end:
        duration = new_end - new_dt
        if duration.total_seconds() < 3600:
            raise HTTPException(status_code=422, detail="Event must be at least 1 hour long")
        if duration.total_seconds() > 72 * 3600:
            raise HTTPException(status_code=422, detail="Events can't run longer than 3 days")

    if capacity_decreasing and ev["attendee_count"] > 0:
        raise HTTPException(status_code=400, detail="Cannot reduce capacity — attendees have already booked")

    if capacity_increasing and now > capacity_deadline:
        raise HTTPException(status_code=403, detail="Capacity cannot be changed within 2 hours of start")

    if body.price_inr != 0 and body.price_inr < MIN_TICKET_PRICE_INR:
        raise HTTPException(status_code=422, detail=f"Minimum ticket price is ₹{MIN_TICKET_PRICE_INR}")

    old_capacity = ev["capacity"]
    promoted_users = []
    affected_user_ids = []
    # Moved by more than a week: paid guests get 48h from now to cancel for
    # everything back (see _cancel_quote).
    moved_far = bool(body_dt) and abs(body_dt - ev_dt) > RESCHEDULE_THRESHOLD
    fee_inr, commission_inr, profit_inr = _fee_snapshot(body.price_inr)

    with get_db() as (cur, conn):
        cur.execute(
            """
            UPDATE events SET
                title=%s, description=%s, rules=%s, event_type=%s,
                date_time=%s, end_time=%s,
                capacity=%s,
                spots_left = GREATEST(0, spots_left + (%s - capacity)),
                age_restriction=%s,
                location_name=%s, location_lat=%s, location_lng=%s,
                city=%s, area=%s, address_line1=%s, address_line2=%s, pincode=%s,
                women_pct=%s, join_mode=%s,
                price_inr=%s,
                platform_fee_inr=%s, host_commission_inr=%s, platform_profit_inr=%s,
                -- An empty list means "unchanged" (older clients don't send
                -- photos on edit) — a cover is mandatory, so never wipe it.
                cover_photos = COALESCE(NULLIF(%s::jsonb, '[]'::jsonb), cover_photos),
                rescheduled_at = CASE WHEN %s THEN NOW() ELSE rescheduled_at END,
                updated_at=NOW()
            WHERE id=%s
            """,
            (
                body.title, body.description, body.rules, body.event_type,
                body.date_time, body.end_time,
                body.capacity, body.capacity,
                body.age_restriction,
                loc["location_name"], loc["location_lat"], loc["location_lng"],
                loc["city"], loc["area"], loc["address_line1"], loc["address_line2"], loc["pincode"],
                women_pct, _join_mode_for(body.price_inr),
                body.price_inr,
                fee_inr, commission_inr, profit_inr,
                __import__('json').dumps([p for p in (body.cover_photos or []) if p]),
                moved_far,
                event_id,
            ),
        )
        spots_gained = body.capacity - old_capacity
        for _ in range(max(0, spots_gained)):
            promoted = _promote_next_waitlist(cur, event_id)
            if not promoted:
                break
            promoted_users.append(promoted)

        if non_capacity_changed:
            from routes.notifications import notify_event_updated
            cur.execute(
                "SELECT user_id::text FROM event_attendees WHERE event_id = %s AND status IN ('going', 'waitlist', 'requested')",
                (event_id,),
            )
            affected_user_ids = [r["user_id"] for r in cur.fetchall()]
            for a_uid in affected_user_ids:
                notify_event_updated(cur, a_uid, event_id, body.title)
            paid_guest_ids = set()
            if moved_far:
                cur.execute(
                    """
                    SELECT user_id::text FROM event_attendees
                    WHERE event_id = %s AND status = 'going' AND payment_id IS NOT NULL AND refunded_at IS NULL
                    """,
                    (event_id,),
                )
                paid_guest_ids = {r["user_id"] for r in cur.fetchall()}

        conn.commit()

    if affected_user_ids or promoted_users:
        from utils.push import get_event_image_url
        cover_url = get_event_image_url(event_id)

    if affected_user_ids:
        for a_uid in affected_user_ids:
            if a_uid in paid_guest_ids:
                background_tasks.add_task(
                    send_push, a_uid, "Your event moved to a new date",
                    f"The host moved {body.title}. Can't make the new date? You have 48 hours to cancel for a full refund.",
                    {"type": "event", "event_id": event_id}, cover_url, category="attending",
                )
                continue
            background_tasks.add_task(
                send_push, a_uid, "Event details changed",
                f"The host updated {body.title}. Check what's new.",
                {"type": "event", "event_id": event_id}, cover_url, category="attending",
            )

    if promoted_users:
        from routes.notifications import notify_waitlist_promoted
        with get_db() as (cur, conn):
            cur.execute("SELECT title FROM events WHERE id = %s", (event_id,))
            ev_title = (cur.fetchone() or {}).get("title", "")
            for p in promoted_users:
                notify_waitlist_promoted(cur, p["user_id"], event_id, ev_title)
            conn.commit()
        for p in promoted_users:
            background_tasks.add_task(
                send_push, p["user_id"], "A spot opened up!",
                "You have 1 hour to confirm your spot.",
                {"type": "event", "event_id": event_id}, cover_url, category="attending",
            )

    return get_event(event_id, current_user)


# ── POST /events/{id}/rsvp ────────────────────────────────────────────────────

@router.post("/{event_id}/rsvp")
def rsvp_event(event_id: str, body: RsvpBody, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    if body.action not in ("going", "cancel"):
        raise HTTPException(status_code=400, detail="action must be 'going' or 'cancel'")

    with get_db() as (cur, conn):
        # Serialise every booking on this event behind a row lock — without it
        # two people can both see the last spot free and both take it.
        ev = seats.lock_event(cur, event_id)
        if not ev or ev["is_cancelled"]:
            raise HTTPException(status_code=404, detail="Event not found")

        # Lazy expiry: expire stale promotion offers before any logic
        expired_user_ids = _expire_stale_offers(cur, event_id)
        if expired_user_ids:
            ev = seats.lock_event(cur, event_id)

        if body.action == "going" and ev["join_mode"] == "request":
            conn.commit()
            raise HTTPException(status_code=409, detail="This event needs host approval — send a request to join")

        if body.action == "going":
            # Prevent RSVP after event has ended
            ev_end = ev["end_time"] if ev.get("end_time") else ev["date_time"] + timedelta(hours=6)
            if datetime.now(timezone.utc) > ev_end:
                conn.commit()
                raise HTTPException(status_code=400, detail="This event has ended")
            # Age check
            cur.execute("SELECT dob FROM users WHERE id = %s", (current_user["id"],))
            user = cur.fetchone()
            if user and user.get("dob"):
                age = _calc_age(user["dob"])
                if age < ev["age_restriction"]:
                    conn.commit()
                    raise HTTPException(
                        status_code=403,
                        detail=f"You must be {ev['age_restriction']}+ to attend this event",
                    )

            # Check if this user has an active promotion offer (promoted waitlist user confirming)
            cur.execute(
                """
                SELECT id, offer_expires_at FROM event_attendees
                WHERE event_id = %s AND user_id = %s AND status = 'waitlist'
                  AND offer_expires_at IS NOT NULL AND offer_expires_at > NOW()
                """,
                (event_id, current_user["id"]),
            )
            promoted_row = cur.fetchone()

            bucket = seats.user_bucket(cur, current_user["id"])
            if not seats.bucket_eligible(ev["women_pct"], bucket):
                conn.commit()
                raise HTTPException(status_code=403, detail=seats.ineligible_message(ev["women_pct"]))
            counts = seats.seat_counts(cur, event_id)
            bucket_has_room = seats.bucket_has_room(ev["capacity"], ev["women_pct"], counts, bucket)

            # Waitlisters who could take this same seat have priority over a
            # new booking (someone waiting for a men's spot doesn't block a
            # woman from booking a women's spot).
            cur.execute(
                """
                SELECT u.gender FROM event_attendees ea JOIN users u ON u.id = ea.user_id
                WHERE ea.event_id = %s AND ea.status = 'waitlist' AND ea.offer_expires_at IS NULL
                """,
                (event_id,),
            )
            active_waitlist_count = sum(
                1 for w in cur.fetchall()
                if seats.bucket_has_room(ev["capacity"], ev["women_pct"], counts, seats.gender_bucket(w["gender"]))
            )

            seat_free = ev["spots_left"] > 0 and bucket_has_room and active_waitlist_count == 0
            # Paid seats are only handed out by the payment finalisers — this
            # route may only put a paid-event guest on the waitlist.
            if ev["price_inr"] > 0 and (promoted_row or seat_free):
                conn.commit()
                raise HTTPException(status_code=402, detail="Payment required for this ticket")

            just_sold_out = False
            if promoted_row:
                # Promoted user confirming — spot was already held, just flip status
                cur.execute(
                    "UPDATE event_attendees SET status = 'going', offer_expires_at = NULL WHERE id = %s",
                    (promoted_row["id"],),
                )
                status = "going"
            elif seat_free:
                # Normal RSVP — a spot for this guest's crowd-mix share AND no
                # one in the queue waiting for it
                cur.execute(
                    """
                    INSERT INTO event_attendees (event_id, user_id, status)
                    VALUES (%s, %s, 'going')
                    ON CONFLICT (event_id, user_id) DO UPDATE SET status = 'going', offer_expires_at = NULL
                    """,
                    (event_id, current_user["id"]),
                )
                cur.execute(
                    "UPDATE events SET spots_left = GREATEST(0, spots_left - 1) WHERE id = %s",
                    (event_id,),
                )
                just_sold_out = ev["spots_left"] == 1
                status = "going"
            else:
                # Event is full — join waitlist with validation
                cur.execute(
                    "SELECT blocked_from_rejoin FROM event_attendees WHERE event_id = %s AND user_id = %s",
                    (event_id, current_user["id"]),
                )
                existing = cur.fetchone()
                if existing and existing["blocked_from_rejoin"]:
                    conn.commit()
                    raise HTTPException(status_code=403, detail="You previously ignored a spot offer and can't rejoin this waitlist")

                # Timing check: no new waitlist joins within 2h of start
                ev_dt = ev["date_time"].replace(tzinfo=timezone.utc) if ev["date_time"].tzinfo is None else ev["date_time"]
                if datetime.now(timezone.utc) > ev_dt - timedelta(hours=2):
                    conn.commit()
                    raise HTTPException(status_code=403, detail="Waitlist closed — event starts soon")

                # Waitlist cap: max 50% of capacity
                cur.execute(
                    "SELECT COUNT(*) AS cnt FROM event_attendees WHERE event_id = %s AND status = 'waitlist' AND offer_expires_at IS NULL",
                    (event_id,),
                )
                wl_count = cur.fetchone()["cnt"]
                if wl_count >= ev["capacity"] * 0.5:
                    conn.commit()
                    raise HTTPException(status_code=403, detail="Waitlist is full")

                cur.execute(
                    """
                    INSERT INTO event_attendees (event_id, user_id, status)
                    VALUES (%s, %s, 'waitlist')
                    ON CONFLICT (event_id, user_id) DO UPDATE SET status = 'waitlist', blocked_from_rejoin = FALSE
                    """,
                    (event_id, current_user["id"]),
                )
                # Get position
                cur.execute(
                    """
                    SELECT COUNT(*) AS pos FROM event_attendees
                    WHERE event_id = %s AND status = 'waitlist' AND offer_expires_at IS NULL
                    """,
                    (event_id,),
                )
                position = cur.fetchone()["pos"]
                status = "waitlist"

            # Notify host if going
            if status == "going":
                cur.execute("SELECT host_id::text, title FROM events WHERE id = %s", (event_id,))
                ev_row = cur.fetchone()
                if ev_row:
                    cur.execute("SELECT name FROM users WHERE id = %s::uuid", (current_user["id"],))
                    attendee_row = cur.fetchone()
                    attendee_name = attendee_row["name"] if attendee_row else "Someone"
                    host_id = ev_row["host_id"]
                    uid = current_user["id"]
                    cur.execute(
                        "SELECT 1 FROM user_blocks WHERE (blocker_id=%s::uuid AND blocked_id=%s::uuid) OR (blocker_id=%s::uuid AND blocked_id=%s::uuid)",
                        (host_id, uid, uid, host_id),
                    )
                    from utils.push import get_event_image_url
                    cover_url = get_event_image_url(event_id)

                    if not cur.fetchone():
                        from routes.notifications import notify_event_rsvp
                        notify_event_rsvp(cur, host_id, uid, attendee_name, event_id, ev_row["title"])
                        background_tasks.add_task(
                            send_push, host_id, "New RSVP",
                            f"{attendee_name} is going to {ev_row['title']}",
                            {"type": "event", "event_id": event_id}, cover_url, category="hosting",
                        )

                    # Self-confirmation to the attendee — paid tickets already
                    # get this via notify_payment_confirmed, free RSVPs didn't.
                    from routes.notifications import notify_rsvp_confirmed
                    notify_rsvp_confirmed(cur, uid, event_id, ev_row["title"])
                    background_tasks.add_task(
                        send_push, uid, "You're going! \U0001f389",
                        f"Your ticket for {ev_row['title']} is ready — tap to view it.",
                        {"type": "ticket_ready", "event_id": event_id}, cover_url, category="attending",
                    )

                    if just_sold_out:
                        from routes.notifications import notify_event_sold_out
                        notify_event_sold_out(cur, host_id, event_id, ev_row["title"])
                        background_tasks.add_task(
                            send_push, host_id, "Your event sold out!",
                            f"{ev_row['title']} has no spots left.",
                            {"type": "event", "event_id": event_id}, cover_url, category="hosting",
                        )
                    elif ev["capacity"] > 0 and (ev["spots_left"] - 1) <= ev["capacity"] * 0.1:
                        # Almost sold out (<=10% of capacity left, but not the
                        # very last spot — that's just_sold_out's moment).
                        # Fire once per event — otherwise every subsequent
                        # RSVP while under the threshold re-triggers it.
                        cur.execute(
                            "UPDATE events SET low_capacity_notice_sent_at = NOW() "
                            "WHERE id = %s AND low_capacity_notice_sent_at IS NULL",
                            (event_id,),
                        )
                        if cur.rowcount:
                            from routes.notifications import notify_host_low_capacity
                            notify_host_low_capacity(cur, host_id, event_id, ev_row["title"], "almost_sold_out")
                            background_tasks.add_task(
                                send_push, host_id, "Your event is almost sold out!",
                                f"{ev_row['title']} is almost full — raise capacity to let more people in.",
                                {"type": "event", "event_id": event_id}, cover_url, category="hosting",
                            )

                    # Notify followers who are ALSO already going to this same
                    # event — "someone you follow is going to this event you
                    # joined too" is a co-attendance signal, not a generic
                    # "they RSVPed somewhere" nudge, so it's scoped to people
                    # who already have skin in this specific event.
                    from routes.notifications import notify_follow_rsvp
                    cur.execute(
                        """
                        SELECT f.follower_id::text FROM follows f
                        WHERE f.following_id = %s::uuid
                          AND EXISTS(
                              SELECT 1 FROM event_attendees ea
                              WHERE ea.event_id = %s AND ea.user_id = f.follower_id AND ea.status = 'going'
                          )
                        """,
                        (uid, event_id),
                    )
                    for f in cur.fetchall():
                        notify_follow_rsvp(cur, f["follower_id"], uid, attendee_name, event_id, ev_row["title"])
                        background_tasks.add_task(
                            send_push, f["follower_id"], f"{attendee_name} is going to {ev_row['title']} too",
                            "Someone you follow just joined an event you're already going to.",
                            {"type": "event", "event_id": event_id}, cover_url, category="social",
                        )

            elif status == "waitlist":
                cur.execute("SELECT host_id::text, title, capacity FROM events WHERE id = %s", (event_id,))
                ev_row = cur.fetchone()
                # Waitlist just crossed 50% of its own cap (which is itself
                # 50% of event capacity) — a real signal demand outstrips supply.
                if ev_row and wl_count + 1 >= (ev_row["capacity"] * 0.5) * 0.5:
                    cur.execute(
                        "UPDATE events SET low_capacity_notice_sent_at = NOW() "
                        "WHERE id = %s AND low_capacity_notice_sent_at IS NULL",
                        (event_id,),
                    )
                    if cur.rowcount:
                        from routes.notifications import notify_host_low_capacity
                        notify_host_low_capacity(cur, ev_row["host_id"], event_id, ev_row["title"], "waitlist_forming")
                        from utils.push import get_event_image_url
                        background_tasks.add_task(
                            send_push, ev_row["host_id"], "People are waitlisting for your event",
                            f"{ev_row['title']} has a growing waitlist — consider raising capacity.",
                            {"type": "event", "event_id": event_id}, get_event_image_url(event_id), category="hosting",
                        )

            conn.commit()

        else:  # cancel
            cur.execute(
                """
                SELECT status, offer_expires_at, payment_id, price_paid_inr, fee_paid_inr,
                       refunded_at, joined_at
                FROM event_attendees WHERE event_id = %s AND user_id = %s
                FOR UPDATE
                """,
                (event_id, current_user["id"]),
            )
            existing = cur.fetchone()
            if not existing:
                conn.commit()
                raise HTTPException(status_code=404, detail="Not attending this event")

            prev_status = existing["status"]
            had_offer = existing["offer_expires_at"] is not None

            if prev_status in ("declined", "expired", "cancelled"):
                conn.commit()
                raise HTTPException(status_code=404, detail="Not attending this event")

            refund_inr = 0
            if prev_status == "going":
                cur.execute("SELECT rescheduled_at FROM events WHERE id = %s", (event_id,))
                quote = _cancel_quote({**ev, **cur.fetchone()}, existing)
                if not quote["allowed"]:
                    conn.commit()
                    raise HTTPException(status_code=400, detail=quote["reason"])
                refund_inr = quote["refund_inr"]

            cur.execute(
                """
                UPDATE event_attendees
                SET status = 'cancelled', offer_expires_at = NULL,
                    refund_amount_inr = CASE WHEN %s > 0 THEN %s ELSE refund_amount_inr END,
                    refunded_at = CASE WHEN %s > 0 THEN NOW() ELSE refunded_at END
                WHERE event_id = %s AND user_id = %s
                """,
                (refund_inr, refund_inr, refund_inr, event_id, current_user["id"]),
            )
            if refund_inr > 0:
                from routes.payments import _refund_to_wallet
                _refund_to_wallet(cur, current_user["id"], event_id, refund_inr, ev["title"],
                                  description=f"Refund — you cancelled {ev['title']}")

            # Only promote if event starts > 2h from now — under 2h the freed spot becomes an empty seat
            ev_dt_cancel = ev["date_time"]
            if ev_dt_cancel and ev_dt_cancel.tzinfo is None:
                ev_dt_cancel = ev_dt_cancel.replace(tzinfo=timezone.utc)
            can_promote = ev_dt_cancel and ev_dt_cancel > datetime.now(timezone.utc) + timedelta(hours=2)

            promoted = None
            if prev_status == "going":
                cur.execute(
                    "UPDATE events SET spots_left = LEAST(capacity, spots_left + 1) WHERE id = %s",
                    (event_id,),
                )
                if can_promote:
                    promoted = _promote_next_waitlist(cur, event_id)
            elif prev_status == "waitlist" and had_offer:
                # Was promoted, spot was held — restore it then offer to next
                cur.execute(
                    "UPDATE events SET spots_left = LEAST(capacity, spots_left + 1) WHERE id = %s",
                    (event_id,),
                )
                if can_promote:
                    promoted = _promote_next_waitlist(cur, event_id)

            # Fetch for notifications
            cur.execute("SELECT host_id::text, title FROM events WHERE id = %s", (event_id,))
            ev_cancel = cur.fetchone()
            event_title_cancel = ev_cancel["title"] if ev_cancel else ""

            conn.commit()

            if promoted:
                from routes.notifications import notify_waitlist_promoted
                from utils.push import get_event_image_url
                with get_db() as (cur2, conn2):
                    notify_waitlist_promoted(cur2, promoted["user_id"], event_id, event_title_cancel)
                    conn2.commit()
                background_tasks.add_task(
                    send_push, promoted["user_id"], "A spot opened up!",
                    f"You have 1 hour to confirm your spot at {event_title_cancel}.",
                    {"type": "event", "event_id": event_id}, get_event_image_url(event_id), category="attending",
                )

            status = "cancelled"
            if refund_inr > 0:
                background_tasks.add_task(
                    send_push, current_user["id"], "Refund in your Gorave Wallet 💰",
                    f"₹{refund_inr} from {event_title_cancel} is in your wallet.",
                    {"type": "wallet", "event_id": event_id}, category="payments",
                )
            if prev_status == "going" and ev["join_mode"] != "request" and ev_cancel:
                from utils.push import get_event_image_url
                background_tasks.add_task(
                    send_push, ev_cancel["host_id"], f"A guest cancelled {event_title_cancel}",
                    "Their spot is open again" + (" and went to the next person on the waitlist." if promoted else "."),
                    {"type": "event", "event_id": event_id}, get_event_image_url(event_id), category="hosting",
                )

        # Queue expiry push notifications (outside transaction)
        if expired_user_ids:
            from routes.notifications import notify_waitlist_expired
            from utils.push import get_event_image_url
            with get_db() as (cur2, conn2):
                cur2.execute("SELECT title FROM events WHERE id = %s", (event_id,))
                ev_title_row = cur2.fetchone()
                ev_title = ev_title_row["title"] if ev_title_row else ""
                for uid in expired_user_ids:
                    notify_waitlist_expired(cur2, uid, event_id, ev_title)
                conn2.commit()
            cover_url = get_event_image_url(event_id)
            for uid in expired_user_ids:
                background_tasks.add_task(
                    send_push, uid, "Spot offer expired",
                    f"Your reserved spot was given to the next person.",
                    {"type": "event", "event_id": event_id}, cover_url, category="attending",
                )

    if status == "cancelled" and prev_status == "going" and ev["join_mode"] == "request":
        _notify_spot_opened(event_id, ev["host_id"], ev["title"], background_tasks)

    result = {"ok": True, "status": status}
    if status == "waitlist":
        result["position"] = position
    if status == "cancelled":
        result["refund_inr"] = refund_inr
    return result


# ── Join requests (free events) ───────────────────────────────────────────────
# Free events are host-approved: guests send a request, the host accepts
# (seat + ticket issued, crowd-mix permitting) or declines (final).

def _notify_spot_opened(event_id: str, host_id: str, title: str, background_tasks: BackgroundTasks):
    from routes.notifications import notify_spot_opened_for_requests
    from utils.push import get_event_image_url
    with get_db() as (cur, _):
        cur.execute(
            "SELECT COUNT(*)::int AS n FROM event_attendees WHERE event_id = %s AND status = 'requested'",
            (event_id,),
        )
        pending = cur.fetchone()["n"]
        if not pending:
            return
        notify_spot_opened_for_requests(cur, host_id, event_id, title, pending)
    background_tasks.add_task(
        send_push, host_id, f"A spot opened at {title}",
        f"{pending} pending request{'s' if pending != 1 else ''} — tap to review.",
        {"type": "event_requests", "event_id": event_id}, get_event_image_url(event_id), category="hosting",
    )


def _event_ended(ev: dict) -> bool:
    end = ev["end_time"] or ev["date_time"] + timedelta(hours=6)
    return datetime.now(timezone.utc) > end


def _event_started(ev: dict) -> bool:
    return datetime.now(timezone.utc) >= ev["date_time"]


@router.post("/{event_id}/request")
def request_to_join(event_id: str, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    enforce_rate_limit(f"events:request:user:{uid}", max_events=30, window_seconds=3600,
                        message="You're sending requests too quickly, try again later.")
    with get_db() as (cur, conn):
        ev = seats.lock_event(cur, event_id)
        if not ev or ev["is_cancelled"]:
            raise HTTPException(status_code=404, detail="Event not found")
        if ev["join_mode"] != "request":
            raise HTTPException(status_code=409, detail="This event doesn't need a request — book directly")
        if ev["host_id"] == uid:
            raise HTTPException(status_code=400, detail="You're hosting this event")
        if _event_started(ev):
            raise HTTPException(status_code=400, detail="This event has already started")

        cur.execute("SELECT name, dob, gender FROM users WHERE id = %s::uuid", (uid,))
        me = cur.fetchone()
        if me and me.get("dob") and _calc_age(me["dob"]) < ev["age_restriction"]:
            raise HTTPException(status_code=403, detail=f"You must be {ev['age_restriction']}+ to attend this event")
        if not seats.bucket_eligible(ev["women_pct"], seats.gender_bucket(me["gender"] if me else None)):
            raise HTTPException(status_code=403, detail=seats.ineligible_message(ev["women_pct"]))

        cur.execute(
            "SELECT 1 FROM user_blocks WHERE (blocker_id=%s::uuid AND blocked_id=%s::uuid) OR (blocker_id=%s::uuid AND blocked_id=%s::uuid)",
            (ev["host_id"], uid, uid, ev["host_id"]),
        )
        if cur.fetchone():
            raise HTTPException(status_code=403, detail="You can't join this event")

        cur.execute(
            "SELECT status, request_count FROM event_attendees WHERE event_id = %s AND user_id = %s::uuid",
            (event_id, uid),
        )
        existing = cur.fetchone()
        if existing:
            if existing["status"] == "requested":
                return {"ok": True, "status": "requested"}
            if existing["status"] == "going":
                raise HTTPException(status_code=409, detail="You're already going")
            if existing["status"] == "declined":
                raise HTTPException(status_code=403, detail="The host declined your request for this event")
            if existing["request_count"] >= _MAX_JOIN_REQUESTS:
                raise HTTPException(status_code=403, detail="You've reached the request limit for this event")

        cur.execute(
            """
            INSERT INTO event_attendees (event_id, user_id, status, requested_at, request_count)
            VALUES (%s, %s::uuid, 'requested', NOW(), 1)
            ON CONFLICT (event_id, user_id) DO UPDATE
                SET status = 'requested', requested_at = NOW(), decided_at = NULL,
                    offer_expires_at = NULL, request_count = event_attendees.request_count + 1
            """,
            (event_id, uid),
        )
        from routes.notifications import notify_join_request
        requester_name = me["name"] if me else "Someone"
        notify_join_request(cur, ev["host_id"], uid, requester_name, event_id, ev["title"])
        conn.commit()

    from utils.push import get_event_image_url
    background_tasks.add_task(
        send_push, ev["host_id"], "New request to join",
        f"{requester_name} wants to join {ev['title']}",
        {"type": "event_requests", "event_id": event_id}, get_event_image_url(event_id), category="hosting",
    )
    return {"ok": True, "status": "requested"}


@router.delete("/{event_id}/request")
def withdraw_request(event_id: str, current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, _):
        cur.execute(
            """
            UPDATE event_attendees SET status = 'cancelled', decided_at = NOW()
            WHERE event_id = %s AND user_id = %s::uuid AND status = 'requested'
            """,
            (event_id, current_user["id"]),
        )
        if not cur.rowcount:
            raise HTTPException(status_code=404, detail="No pending request for this event")
    return {"ok": True, "status": "cancelled"}


@router.get("/{event_id}/requests")
def list_join_requests(event_id: str, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, _):
        cur.execute("SELECT host_id::text, capacity, spots_left, women_pct FROM events WHERE id = %s", (event_id,))
        ev = cur.fetchone()
        if not ev:
            raise HTTPException(status_code=404, detail="Event not found")
        if ev["host_id"] != uid:
            raise HTTPException(status_code=403, detail="Only the host can see requests")

        counts = seats.seat_counts(cur, event_id)
        cur.execute(
            """
            SELECT
                u.id::text, u.name, u.username, u.gender, u.dob, u.city,
                ea.requested_at::text,
                (SELECT url FROM user_photos WHERE user_id = u.id ORDER BY position LIMIT 1) AS avatar,
                EXISTS(SELECT 1 FROM follows f WHERE f.follower_id = %s::uuid AND f.following_id = u.id) AS is_following,
                (SELECT COUNT(*) FROM follows f1
                   JOIN follows f2 ON f2.following_id = f1.following_id AND f2.follower_id = u.id
                  WHERE f1.follower_id = %s::uuid)::int AS mutual_count,
                (SELECT COUNT(*) FROM event_attendees past
                   JOIN events pe ON pe.id = past.event_id
                  WHERE past.user_id = u.id AND past.status = 'going' AND past.checked_in_at IS NOT NULL)::int AS events_attended,
                EXISTS(SELECT 1 FROM event_attendees prev
                   JOIN events pe ON pe.id = prev.event_id
                  WHERE prev.user_id = u.id AND prev.status = 'going' AND pe.host_id = %s::uuid
                    AND pe.id != %s::uuid) AS attended_your_events
            FROM event_attendees ea
            JOIN users u ON u.id = ea.user_id
            WHERE ea.event_id = %s AND ea.status = 'requested'
            ORDER BY ea.requested_at ASC
            """,
            (uid, uid, uid, event_id, event_id),
        )
        rows = []
        for r in cur.fetchall():
            d = dict(r)
            dob = d.pop("dob", None)
            d["age"] = _calc_age(dob) if dob else None
            bucket = seats.gender_bucket(d["gender"])
            d["can_accept"] = ev["spots_left"] > 0 and seats.bucket_has_room(ev["capacity"], ev["women_pct"], counts, bucket)
            rows.append(d)
    return {
        "requests": rows,
        "total": len(rows),
        "spots_left": ev["spots_left"],
        "capacity": ev["capacity"],
        "counts": counts,
        "ratio": seats.ratio_left(ev["capacity"], ev["women_pct"], counts),
    }


def _accept_one(cur, ev: dict, event_id: str, user_id: str) -> Optional[str]:
    """Accepts a single pending request on a locked event. Returns None on
    success or the reason it couldn't be accepted."""
    cur.execute(
        "SELECT status FROM event_attendees WHERE event_id = %s AND user_id = %s::uuid FOR UPDATE",
        (event_id, user_id),
    )
    row = cur.fetchone()
    if not row or row["status"] != "requested":
        return "This request is no longer pending"
    bucket = seats.user_bucket(cur, user_id)
    if ev["spots_left"] <= 0:
        return "Event is full — raise capacity to accept more"
    if not seats.bucket_has_room(ev["capacity"], ev["women_pct"], seats.seat_counts(cur, event_id), bucket):
        return seats.full_message(bucket)
    cur.execute(
        """
        UPDATE event_attendees
        SET status = 'going', decided_at = NOW(), joined_at = NOW()
        WHERE event_id = %s AND user_id = %s::uuid
        """,
        (event_id, user_id),
    )
    cur.execute("UPDATE events SET spots_left = spots_left - 1 WHERE id = %s", (event_id,))
    ev["spots_left"] -= 1
    from routes.notifications import notify_request_accepted
    notify_request_accepted(cur, user_id, ev["host_id"], event_id, ev["title"])
    return None


def _push_accepted(background_tasks: BackgroundTasks, event_id: str, title: str, user_ids: list, sold_out: bool, host_id: str):
    from utils.push import get_event_image_url
    cover_url = get_event_image_url(event_id)
    for u in user_ids:
        background_tasks.add_task(
            send_push, u, "You're in! \U0001f389",
            f"Your request for {title} was accepted — tap to view your ticket.",
            {"type": "ticket_ready", "event_id": event_id}, cover_url, category="attending",
        )
    if sold_out:
        background_tasks.add_task(
            send_push, host_id, "Your event is full!",
            f"{title} has no spots left.",
            {"type": "event", "event_id": event_id}, cover_url, category="hosting",
        )


def _lock_hosted_open_event(cur, event_id: str, host_id: str) -> dict:
    ev = seats.lock_event(cur, event_id)
    if not ev or ev["is_cancelled"]:
        raise HTTPException(status_code=404, detail="Event not found")
    if ev["host_id"] != host_id:
        raise HTTPException(status_code=403, detail="Only the host can manage requests")
    if _event_ended(ev):
        raise HTTPException(status_code=400, detail="This event has ended")
    return ev


@router.post("/{event_id}/requests/{user_id}/accept")
def accept_join_request(event_id: str, user_id: str, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, conn):
        ev = _lock_hosted_open_event(cur, event_id, current_user["id"])
        error = _accept_one(cur, ev, event_id, user_id)
        if error:
            conn.rollback()
            raise HTTPException(status_code=409, detail=error)
        sold_out = ev["spots_left"] == 0
        if sold_out:
            from routes.notifications import notify_event_sold_out
            notify_event_sold_out(cur, ev["host_id"], event_id, ev["title"])
        conn.commit()
    _push_accepted(background_tasks, event_id, ev["title"], [user_id], sold_out, ev["host_id"])
    return {"ok": True, "status": "going", "spots_left": ev["spots_left"]}


class BulkAcceptBody(BaseModel):
    user_ids: List[str]


@router.post("/{event_id}/requests/accept-bulk")
def accept_join_requests_bulk(event_id: str, body: BulkAcceptBody, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    """Accepts in the given order until spots or the crowd mix run out —
    the rest stay pending and are reported back."""
    accepted, skipped = [], []
    with get_db() as (cur, conn):
        ev = _lock_hosted_open_event(cur, event_id, current_user["id"])
        for u in body.user_ids[:200]:
            cur.execute("SAVEPOINT accept_one")
            error = _accept_one(cur, ev, event_id, u)
            if error:
                cur.execute("ROLLBACK TO SAVEPOINT accept_one")
                skipped.append({"user_id": u, "reason": error})
            else:
                cur.execute("RELEASE SAVEPOINT accept_one")
                accepted.append(u)
        sold_out = bool(accepted) and ev["spots_left"] == 0
        if sold_out:
            from routes.notifications import notify_event_sold_out
            notify_event_sold_out(cur, ev["host_id"], event_id, ev["title"])
        conn.commit()
    _push_accepted(background_tasks, event_id, ev["title"], accepted, sold_out, ev["host_id"])
    return {"ok": True, "accepted": accepted, "skipped": skipped, "spots_left": ev["spots_left"]}


@router.post("/{event_id}/requests/{user_id}/decline")
def decline_join_request(event_id: str, user_id: str, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, conn):
        ev = _lock_hosted_open_event(cur, event_id, current_user["id"])
        cur.execute(
            """
            UPDATE event_attendees SET status = 'declined', decided_at = NOW()
            WHERE event_id = %s AND user_id = %s::uuid AND status = 'requested'
            """,
            (event_id, user_id),
        )
        if not cur.rowcount:
            raise HTTPException(status_code=409, detail="This request is no longer pending")
        from routes.notifications import notify_request_declined
        notify_request_declined(cur, user_id, event_id, ev["title"])
        conn.commit()

    from utils.push import get_event_image_url
    background_tasks.add_task(
        send_push, user_id, "Not this time",
        f"The host couldn't fit you in at {ev['title']}. Plenty more events this week.",
        {"type": "event", "event_id": event_id}, get_event_image_url(event_id), category="attending",
    )
    return {"ok": True, "status": "declined"}


def expire_pending_requests() -> int:
    """Pending requests die when the event starts. Called from the wrap-up
    scheduler; returns how many were expired."""
    from routes.notifications import notify_request_expired
    from utils.push import get_event_image_url
    with get_db() as (cur, _):
        cur.execute(
            """
            UPDATE event_attendees ea SET status = 'expired', decided_at = NOW()
            FROM events e
            WHERE ea.event_id = e.id AND ea.status = 'requested' AND e.date_time <= NOW()
            RETURNING ea.user_id::text, e.id::text AS event_id, e.title
            """
        )
        expired = cur.fetchall()
        for r in expired:
            notify_request_expired(cur, r["user_id"], r["event_id"], r["title"])
    for r in expired:
        try:
            send_push(r["user_id"], "Request expired",
                      f"{r['title']} has started and your request wasn't answered.",
                      {"type": "event", "event_id": r["event_id"]}, get_event_image_url(r["event_id"]),
                      category="attending")
        except Exception:
            pass
    return len(expired)


# ── DELETE /events/{id} ───────────────────────────────────────────────────────

def _cancel_event_and_refund(event_id: str, background_tasks: BackgroundTasks, cancelled_by_admin: bool = False):
    """Marks an event cancelled, notifies waitlist/attendees, and refunds paid
    attendees to their Gorave Wallet. Shared by the host's own cancel route
    and the admin force-cancel route — callers are responsible for their own
    authorization/deadline checks before calling this.
    """
    with get_db() as (cur, conn):
        # Lock the event: a second cancel (double tap, retry, host + admin at
        # once) waits here, then sees it's already cancelled and does nothing,
        # so nobody is refunded twice.
        cur.execute(
            "SELECT title, price_inr, platform_fee_inr, host_id::text, is_cancelled FROM events WHERE id = %s FOR UPDATE",
            (event_id,),
        )
        ev_title_row = cur.fetchone()
        if not ev_title_row or ev_title_row["is_cancelled"]:
            conn.commit()
            return False
        ev_title = ev_title_row["title"]
        host_id = ev_title_row["host_id"]

        cur.execute("UPDATE events SET is_cancelled = TRUE, updated_at = NOW() WHERE id = %s", (event_id,))

        # Fetch waitlist users to notify
        cur.execute(
            "SELECT user_id::text FROM event_attendees WHERE event_id = %s AND status = 'waitlist'",
            (event_id,),
        )
        waitlist_user_ids = [r["user_id"] for r in cur.fetchall()]

        from routes.notifications import notify_waitlist_event_cancelled, notify_event_cancelled_attendee, notify_event_cancelled_host
        for wl_uid in waitlist_user_ids:
            notify_waitlist_event_cancelled(cur, wl_uid, event_id, ev_title)

        if host_id:
            notify_event_cancelled_host(cur, host_id, event_id, ev_title, by_admin=cancelled_by_admin)

        # Confirmed attendees (free or paid) — notify everyone the event was cancelled
        cur.execute(
            "SELECT user_id::text FROM event_attendees WHERE event_id = %s AND status = 'going'",
            (event_id,),
        )
        going_user_ids = [r["user_id"] for r in cur.fetchall()]
        for going_uid in going_user_ids:
            notify_event_cancelled_attendee(cur, going_uid, event_id, ev_title)

        # Pending join requests die with the event — tell them too.
        cur.execute(
            """
            UPDATE event_attendees SET status = 'expired', decided_at = NOW()
            WHERE event_id = %s AND status = 'requested'
            RETURNING user_id::text
            """,
            (event_id,),
        )
        requested_user_ids = [r["user_id"] for r in cur.fetchall()]
        for req_uid in requested_user_ids:
            notify_event_cancelled_attendee(cur, req_uid, event_id, ev_title)

        # Everyone who paid gets back everything they paid, ticket AND the
        # platform fee: the night didn't happen and that isn't their doing.
        # Each ticket is refunded once (refunded_at), from what it really cost.
        from routes.payments import _refund_to_wallet
        cur.execute(
            """
            SELECT user_id::text,
                   COALESCE(price_paid_inr, %s) AS price_paid,
                   COALESCE(fee_paid_inr, %s) AS fee_paid
            FROM event_attendees
            WHERE event_id = %s AND status = 'going' AND payment_id IS NOT NULL AND refunded_at IS NULL
            FOR UPDATE
            """,
            (ev_title_row["price_inr"], ev_title_row["platform_fee_inr"], event_id),
        )
        refunds = [(r["user_id"], r["price_paid"] + r["fee_paid"]) for r in cur.fetchall()]
        refunds = [(u, amt) for u, amt in refunds if amt > 0]
        for att_uid, amount in refunds:
            _refund_to_wallet(cur, att_uid, event_id, amount, ev_title, description=f"Refund — {ev_title}")
            cur.execute(
                "UPDATE event_attendees SET refund_amount_inr = %s, refunded_at = NOW() WHERE event_id = %s AND user_id = %s::uuid",
                (amount, event_id, att_uid),
            )

        conn.commit()

    from utils.push import get_event_image_url
    cover_url = get_event_image_url(event_id)

    if host_id:
        host_push_body = (
            f"{ev_title} was cancelled by the Gorave team. Attendees have been refunded."
            if cancelled_by_admin else
            f"You cancelled {ev_title}. Attendees have been notified and refunded."
        )
        background_tasks.add_task(
            send_push, host_id, "Event cancelled",
            host_push_body,
            {"type": "event", "event_id": event_id}, cover_url, category="hosting",
        )

    for wl_uid in waitlist_user_ids:
        background_tasks.add_task(
            send_push, wl_uid, "Event cancelled",
            f"{ev_title} was cancelled. You've been removed from the waitlist.",
            {"type": "event", "event_id": event_id}, cover_url, category="attending",
        )

    for going_uid in going_user_ids + requested_user_ids:
        background_tasks.add_task(
            send_push, going_uid, "Event cancelled",
            f"{ev_title} was cancelled by the host.",
            {"type": "event", "event_id": event_id}, cover_url, category="attending",
        )

    for att_uid, amount in refunds:
        background_tasks.add_task(
            send_push, att_uid,
            "Refund in your Gorave Wallet 💰",
            f"₹{amount} from '{ev_title}' is now in your Gorave Wallet.",
            {"type": "wallet", "event_id": event_id}, category="payments",
        )
    return True


@router.delete("/{event_id}")
def cancel_event(event_id: str, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, conn):
        cur.execute(
            "SELECT host_id::text, date_time, is_cancelled FROM events WHERE id = %s",
            (event_id,),
        )
        ev = cur.fetchone()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    if ev["host_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not your event")
    if ev["is_cancelled"]:
        raise HTTPException(status_code=409, detail="This event is already cancelled")

    cancel_deadline = ev["date_time"] - timedelta(hours=48)
    now = datetime.now(timezone.utc)
    cd = cancel_deadline.replace(tzinfo=timezone.utc) if cancel_deadline.tzinfo is None else cancel_deadline
    if now > cd:
        raise HTTPException(status_code=403, detail="Events can only be cancelled up to 48 hours before start")

    if not _cancel_event_and_refund(event_id, background_tasks):
        raise HTTPException(status_code=409, detail="This event is already cancelled")
    return {"ok": True}


# ── POST /events/{id}/waitlist/admit ─────────────────────────────────────────

@router.post("/{event_id}/waitlist/admit")
def admit_from_waitlist(event_id: str, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, conn):
        cur.execute("SELECT host_id::text, title FROM events WHERE id = %s AND is_cancelled = FALSE", (event_id,))
        ev = cur.fetchone()
        if not ev:
            raise HTTPException(status_code=404, detail="Event not found")
        if ev["host_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not your event")

        cur.execute(
            "SELECT COUNT(*) AS cnt FROM event_attendees WHERE event_id = %s AND status = 'waitlist' AND offer_expires_at IS NULL",
            (event_id,),
        )
        if cur.fetchone()["cnt"] == 0:
            conn.commit()
            raise HTTPException(status_code=404, detail="No one on the waitlist")

        # Grow capacity by 1 then promote
        cur.execute(
            "UPDATE events SET capacity = capacity + 1, spots_left = spots_left + 1 WHERE id = %s",
            (event_id,),
        )
        promoted = _promote_next_waitlist(cur, event_id)
        if not promoted:
            # Nobody waiting fits the crowd mix — don't leave a phantom seat.
            conn.rollback()
            raise HTTPException(status_code=409, detail="No one on the waitlist fits the crowd mix")

        cur.execute(
            "SELECT COUNT(*) AS cnt FROM event_attendees WHERE event_id = %s AND status = 'waitlist' AND offer_expires_at IS NULL",
            (event_id,),
        )
        waitlist_remaining = cur.fetchone()["cnt"]

        from routes.notifications import notify_waitlist_promoted
        if promoted:
            notify_waitlist_promoted(cur, promoted["user_id"], event_id, ev["title"])

        conn.commit()

    if promoted:
        from utils.push import get_event_image_url
        background_tasks.add_task(
            send_push, promoted["user_id"], "A spot opened up!",
            f"You have 1 hour to confirm your spot at {ev['title']}.",
            {"type": "event", "event_id": event_id}, get_event_image_url(event_id), category="attending",
        )

    return {
        "ok": True,
        "admitted": {"user_id": promoted["user_id"], "name": promoted["name"]} if promoted else None,
        "waitlist_remaining": waitlist_remaining,
    }


# ── GET /events/{id}/waitlist ─────────────────────────────────────────────────

@router.get("/{event_id}/waitlist")
def get_waitlist(event_id: str, current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, _):
        cur.execute("SELECT host_id::text FROM events WHERE id = %s", (event_id,))
        ev = cur.fetchone()
        if not ev:
            raise HTTPException(status_code=404, detail="Event not found")
        if ev["host_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Only the host can view the waitlist")

        cur.execute(
            """
            SELECT
                u.id::text,
                u.name,
                u.username,
                u.gender,
                ea.joined_at::text,
                ea.offer_expires_at::text,
                ROW_NUMBER() OVER (
                    PARTITION BY ea.event_id
                    ORDER BY ea.joined_at ASC
                ) AS position,
                (SELECT url FROM user_photos WHERE user_id = u.id ORDER BY position LIMIT 1) AS avatar
            FROM event_attendees ea
            JOIN users u ON u.id = ea.user_id
            WHERE ea.event_id = %s AND ea.status = 'waitlist'
            ORDER BY ea.joined_at ASC
            """,
            (event_id,),
        )
        rows = [dict(r) for r in cur.fetchall()]
    return {"waitlist": rows, "total": len(rows)}


# ── GET /events/{id}/attendees ────────────────────────────────────────────────

@router.get("/{event_id}/attendees")
def get_attendees(event_id: str, current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, _):
        # Only host can see attendee list
        cur.execute("SELECT host_id::text FROM events WHERE id = %s", (event_id,))
        ev = cur.fetchone()
        if not ev:
            raise HTTPException(status_code=404, detail="Event not found")
        if ev["host_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Only the host can view attendees")

        cur.execute(
            """
            SELECT
                u.id::text,
                u.name,
                u.username,
                u.city,
                u.gender,
                ea.status,
                ea.joined_at::text,
                ea.checked_in_at::text,
                ea.ticket_token,
                (SELECT url FROM user_photos WHERE user_id = u.id ORDER BY position LIMIT 1) AS avatar
            FROM event_attendees ea
            JOIN users u ON u.id = ea.user_id
            WHERE ea.event_id = %s AND ea.status IN ('going', 'waitlist', 'cancelled')
            ORDER BY ea.joined_at ASC
            """,
            (event_id,),
        )
        rows = [dict(r) for r in cur.fetchall()]
        gender_counts = {seats.WOMEN: 0, seats.MEN: 0, seats.OTHER: 0}
        for r in rows:
            if r["status"] == "going":
                gender_counts[seats.gender_bucket(r["gender"])] += 1
    return {"attendees": rows, "total": len(rows), "gender_counts": gender_counts}


# ── GET /events/{id}/guests ───────────────────────────────────────────────────
# Public guest list — anyone can see who's going, just name/avatar (no PII like
# check-in time or ticket tokens, unlike the host-only /attendees endpoint above).

@router.get("/{event_id}/guests")
def get_guests(event_id: str, current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, _):
        cur.execute("SELECT id FROM events WHERE id = %s", (event_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Event not found")

        cur.execute(
            """
            SELECT
                u.id::text,
                u.name,
                u.username,
                (SELECT url FROM user_photos WHERE user_id = u.id ORDER BY position LIMIT 1) AS avatar,
                EXISTS(
                    SELECT 1 FROM follows f
                    WHERE f.follower_id = %s AND f.following_id = u.id
                ) AS is_following
            FROM event_attendees ea
            JOIN users u ON u.id = ea.user_id
            WHERE ea.event_id = %s AND ea.status = 'going'
            ORDER BY is_following DESC, ea.joined_at ASC
            LIMIT 200
            """,
            (current_user["id"], event_id),
        )
        rows = [dict(r) for r in cur.fetchall()]

        cur.execute(
            """
            SELECT
                u.id::text,
                u.name,
                u.username,
                (SELECT url FROM user_photos WHERE user_id = u.id ORDER BY position LIMIT 1) AS avatar,
                EXISTS(
                    SELECT 1 FROM follows f
                    WHERE f.follower_id = %s AND f.following_id = u.id
                ) AS is_following
            FROM event_attendees ea
            JOIN users u ON u.id = ea.user_id
            WHERE ea.event_id = %s AND ea.status = 'waitlist'
            ORDER BY ea.joined_at ASC
            LIMIT 200
            """,
            (current_user["id"], event_id),
        )
        waitlist_rows = [dict(r) for r in cur.fetchall()]
    return {"guests": rows, "total": len(rows), "waitlist": waitlist_rows}


# ── GET /events/{id}/ticket ───────────────────────────────────────────────────

@router.get("/{event_id}/ticket")
def get_my_ticket(event_id: str, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, _):
        cur.execute(
            """
            SELECT ea.ticket_token, e.title AS event_title, e.date_time::text,
                   e.end_time::text, e.location_name, e.event_type,
                   u.name AS host_name,
                   (SELECT p.url FROM user_photos p WHERE p.user_id = u.id ORDER BY p.position LIMIT 1) AS host_avatar,
                   (SELECT COUNT(*) FROM event_attendees g WHERE g.event_id = e.id AND g.status = 'going')::int AS attendee_count
            FROM event_attendees ea
            JOIN events e ON e.id = ea.event_id
            JOIN users u ON u.id = e.host_id
            WHERE ea.event_id = %s AND ea.user_id = %s::uuid AND ea.status = 'going'
            """,
            (event_id, uid),
        )
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="No ticket found — you are not attending this event")
    return dict(row)


# ── POST /events/{id}/checkin ─────────────────────────────────────────────────

@router.post("/{event_id}/checkin")
def checkin_attendee(event_id: str, body: CheckinBody, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, conn):
        cur.execute("SELECT host_id::text, title, date_time, end_time FROM events WHERE id = %s", (event_id,))
        ev = cur.fetchone()
        if not ev:
            raise HTTPException(status_code=404, detail="Event not found")
        if ev["host_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Only the host can check in attendees")

        now = datetime.now(timezone.utc)
        checkin_open = ev["date_time"] - timedelta(hours=3)
        checkin_close = ev["end_time"] if ev["end_time"] else ev["date_time"] + timedelta(hours=6)
        if now < checkin_open:
            raise HTTPException(status_code=400, detail="Check-in opens 3 hours before the event")
        if now > checkin_close:
            raise HTTPException(status_code=400, detail="This event has ended")

        cur.execute(
            """
            SELECT ea.id, ea.checked_in_at, ea.user_id::text, u.name, u.username
            FROM event_attendees ea
            JOIN users u ON u.id = ea.user_id
            WHERE ea.event_id = %s AND ea.ticket_token = %s AND ea.status = 'going'
            """,
            (event_id, body.ticket_token),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Invalid or cancelled ticket")

        if row["checked_in_at"] is not None:
            return {"ok": True, "already_checked_in": True, "name": row["name"], "username": row["username"]}

        method = body.method if body.method in ('qr_scan', 'manual_host') else 'qr_scan'
        cur.execute(
            "UPDATE event_attendees SET checked_in_at = NOW(), check_in_method = %s WHERE id = %s",
            (method, row["id"]),
        )

        from routes.notifications import notify_checked_in
        from utils.push import get_event_image_url
        notify_checked_in(cur, row["user_id"], event_id, ev["title"])
        cover_url = get_event_image_url(event_id)
        conn.commit()

    background_tasks.add_task(
        send_push, row["user_id"], "You're checked in! \U0001f389", f"Enjoy {ev['title']}.",
        {"type": "event", "event_id": event_id}, cover_url, category="attending",
    )
    return {"ok": True, "already_checked_in": False, "name": row["name"], "username": row["username"], "method": method}


# ── POST /events/{id}/report ──────────────────────────────────────────────────

@router.post("/{event_id}/report", status_code=201)
def report_event(event_id: str, body: ReportEventBody, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    enforce_rate_limit(f"events:report:user:{uid}", max_events=10, window_seconds=3600,
                        message="You're reporting too quickly, try again later.")
    allowed = {"fake_scam", "inappropriate_content", "misleading_info", "spam", "dangerous_activity", "other"}
    if body.reason not in allowed:
        raise HTTPException(status_code=400, detail="Invalid reason")
    with get_db() as (cur, conn):
        cur.execute("SELECT 1 FROM events WHERE id = %s", (event_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Event not found")
        cur.execute(
            "SELECT 1 FROM event_reports WHERE event_id = %s AND reporter_id = %s::uuid",
            (event_id, uid),
        )
        if cur.fetchone():
            raise HTTPException(status_code=409, detail="You have already reported this event")
        cur.execute(
            "INSERT INTO event_reports (event_id, reporter_id, reason, description) VALUES (%s, %s::uuid, %s, %s)",
            (event_id, uid, body.reason, body.description),
        )
        from routes.notifications import notify_report_submitted
        notify_report_submitted(cur, uid, "event", event_id)
        conn.commit()
    return {"ok": True}


# ── POST /events/{id}/reviews ─────────────────────────────────────────────────

@router.post("/{event_id}/reviews")
def submit_review(event_id: str, body: ReviewBody, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    if not (1 <= body.rating <= 5):
        raise HTTPException(status_code=422, detail="Rating must be between 1 and 5")

    uid = current_user["id"]
    enforce_rate_limit(f"events:review:user:{uid}", max_events=20, window_seconds=86400,
                        message="You're submitting reviews too quickly, try again later.")
    with get_db() as (cur, conn):
        cur.execute("SELECT date_time FROM events WHERE id = %s", (event_id,))
        ev = cur.fetchone()
        if not ev:
            raise HTTPException(status_code=404, detail="Event not found")
        if ev["date_time"].replace(tzinfo=timezone.utc) > datetime.now(timezone.utc):
            raise HTTPException(status_code=403, detail="Event has not ended yet")

        cur.execute(
            "SELECT checked_in_at FROM event_attendees WHERE event_id = %s AND user_id = %s::uuid AND status = 'going'",
            (event_id, uid),
        )
        ea_row = cur.fetchone()
        if not ea_row:
            raise HTTPException(status_code=403, detail="You did not attend this event")
        if ea_row["checked_in_at"] is None:
            raise HTTPException(status_code=403, detail="You didn't check in at this event")

        cur.execute(
            "SELECT 1 FROM event_reviews WHERE event_id = %s AND reviewer_id = %s::uuid",
            (event_id, uid),
        )
        if cur.fetchone():
            raise HTTPException(status_code=409, detail="You have already reviewed this event")

        cur.execute(
            """
            INSERT INTO event_reviews (event_id, reviewer_id, rating, body)
            VALUES (%s, %s::uuid, %s, %s)
            """,
            (event_id, uid, body.rating, body.body),
        )
        cur.execute("SELECT host_id::text, title FROM events WHERE id = %s", (event_id,))
        ev_review = cur.fetchone()
        cur.execute("SELECT name FROM users WHERE id = %s::uuid", (uid,))
        reviewer_row = cur.fetchone()
        host_id_review = ev_review["host_id"] if ev_review else None
        reviewer_name = reviewer_row["name"] if reviewer_row else "Someone"
        event_title_review = ev_review["title"] if ev_review else ""

        milestone = None
        milestone_avg = None
        if host_id_review and host_id_review != uid:
            from routes.notifications import notify_new_review, notify_review_milestone, review_milestone_reached
            notify_new_review(cur, host_id_review, event_id, event_title_review, uid, reviewer_name, body.rating)

            cur.execute(
                """
                SELECT COUNT(*)::int AS cnt, ROUND(AVG(er.rating)::numeric, 1) AS avg
                FROM event_reviews er JOIN events e ON e.id = er.event_id
                WHERE e.host_id = %s::uuid
                """,
                (host_id_review,),
            )
            rc = cur.fetchone()
            milestone = review_milestone_reached(rc["cnt"]) if rc and float(rc["avg"] or 0) >= 4.0 else None
            milestone_avg = float(rc["avg"]) if rc else None
            if milestone:
                notify_review_milestone(cur, host_id_review, milestone, milestone_avg)

        conn.commit()

    if host_id_review and host_id_review != uid:
        from utils.push import get_event_image_url, get_user_avatar_url
        background_tasks.add_task(
            send_push, host_id_review, f"{reviewer_name} left a {body.rating}-star review",
            event_title_review,
            {"type": "event", "event_id": event_id}, get_event_image_url(event_id), category="hosting",
        )
        if milestone:
            background_tasks.add_task(
                send_push, host_id_review, f"{milestone} reviews and {milestone_avg}★ average!",
                "Your reputation is building — keep hosting to unlock more visibility.",
                {"type": "user", "user_id": host_id_review}, get_user_avatar_url(host_id_review), category="hosting",
            )
    return {"ok": True}


# ── GET /events/{id}/reviews ──────────────────────────────────────────────────

@router.get("/{event_id}/reviews")
def get_reviews(
    event_id: str,
    rating: Optional[int] = None,
    limit: int = 10,
    offset: int = 0,
    current_user: dict = Depends(get_current_user),
):
    with get_db() as (cur, _):
        cur.execute(
            """
            SELECT
                COUNT(*)::int AS count,
                ROUND(AVG(rating)::numeric, 1) AS avg_rating,
                COUNT(*) FILTER (WHERE rating = 5)::int AS r5,
                COUNT(*) FILTER (WHERE rating = 4)::int AS r4,
                COUNT(*) FILTER (WHERE rating = 3)::int AS r3,
                COUNT(*) FILTER (WHERE rating = 2)::int AS r2,
                COUNT(*) FILTER (WHERE rating = 1)::int AS r1
            FROM event_reviews
            WHERE event_id = %s
            """,
            (event_id,),
        )
        stats = cur.fetchone()

        cur.execute(
            """
            SELECT
                er.id::text,
                u.id::text AS reviewer_id,
                u.name AS reviewer_name,
                (SELECT url FROM user_photos WHERE user_id = u.id ORDER BY position LIMIT 1) AS reviewer_avatar,
                er.rating, er.body, er.created_at::text
            FROM event_reviews er
            JOIN users u ON u.id = er.reviewer_id
            WHERE er.event_id = %s
              AND (%s::int IS NULL OR er.rating = %s)
            ORDER BY er.created_at DESC
            LIMIT %s OFFSET %s
            """,
            (event_id, rating, rating, limit, offset),
        )
        reviews = [dict(r) for r in cur.fetchall()]

    return {
        "avg_rating": float(stats["avg_rating"]) if stats["avg_rating"] is not None else None,
        "count": stats["count"],
        "distribution": {"5": stats["r5"], "4": stats["r4"], "3": stats["r3"], "2": stats["r2"], "1": stats["r1"]},
        "reviews": reviews,
    }


# ── GET /events/{id}/reviews/me ───────────────────────────────────────────────

@router.get("/{event_id}/reviews/me")
def get_my_review(event_id: str, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, _):
        cur.execute(
            "SELECT rating, body FROM event_reviews WHERE event_id = %s AND reviewer_id = %s::uuid",
            (event_id, uid),
        )
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="No review found")
    return dict(row)
