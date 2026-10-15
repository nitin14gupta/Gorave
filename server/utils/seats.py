"""Seat accounting shared by every path that hands out a spot — free RSVP,
join-request accept, waitlist promotion and the three paid-ticket finalisers.

A seat is taken by an attendee row that is `going`, or a `waitlist` row
holding a live promotion offer (the spot is reserved for them for an hour).

Gender ratio (events.women_pct):
  NULL      → open, anyone can take any spot
  100 / 0   → women only / men only, strict
  otherwise → capacity splits into a women share, a men share and a small
              open pool (OPEN_POOL_PCT) anyone can use. Non-binary, "Prefer
              not to say" and unknown genders only ever use the open pool.
"""
from fastapi import HTTPException

OPEN_POOL_PCT = 0.10

WOMEN, MEN, OTHER = "women", "men", "other"

_BUCKET_LABEL = {WOMEN: "women", MEN: "men", OTHER: "this crowd mix"}


def gender_bucket(gender: str | None) -> str:
    if gender == "Female":
        return WOMEN
    if gender == "Male":
        return MEN
    return OTHER


def lock_event(cur, event_id: str) -> dict | None:
    """Row-locks the event for the rest of the transaction so concurrent
    bookings serialise on it — the check-then-decrement below is only safe
    while this lock is held."""
    cur.execute(
        """
        SELECT id::text, host_id::text, title, capacity, spots_left, women_pct, join_mode,
               age_restriction, price_inr, date_time, end_time, is_cancelled
        FROM events WHERE id = %s::uuid
        FOR UPDATE
        """,
        (event_id,),
    )
    return cur.fetchone()


def quota_split(capacity: int, women_pct: int | None) -> dict | None:
    if women_pct is None:
        return None
    if women_pct >= 100:
        return {"women": capacity, "men": 0, "open": 0}
    if women_pct <= 0:
        return {"women": 0, "men": capacity, "open": 0}
    open_pool = max(1, round(capacity * OPEN_POOL_PCT))
    women = round((capacity - open_pool) * women_pct / 100)
    return {"women": women, "men": capacity - open_pool - women, "open": open_pool}


def seat_counts(cur, event_id: str, exclude_user_id: str | None = None) -> dict:
    cur.execute(
        """
        SELECT u.gender
        FROM event_attendees ea
        JOIN users u ON u.id = ea.user_id
        WHERE ea.event_id = %s::uuid
          AND (ea.status = 'going'
               OR (ea.status = 'waitlist' AND ea.offer_expires_at IS NOT NULL AND ea.offer_expires_at > NOW()))
          AND (%s::uuid IS NULL OR ea.user_id != %s::uuid)
        """,
        (event_id, exclude_user_id, exclude_user_id),
    )
    counts = {WOMEN: 0, MEN: 0, OTHER: 0}
    for row in cur.fetchall():
        counts[gender_bucket(row["gender"])] += 1
    return counts


def ratio_left(capacity: int, women_pct: int | None, counts: dict) -> dict | None:
    """Spots each bucket could still take. women_left/men_left include the
    open pool (either could take those), so they intentionally overlap."""
    split = quota_split(capacity, women_pct)
    if split is None:
        return None
    women_over = max(0, counts[WOMEN] - split["women"])
    men_over = max(0, counts[MEN] - split["men"])
    open_left = max(0, split["open"] - women_over - men_over - counts[OTHER])
    return {
        "women_pct": women_pct,
        "women_left": max(0, split["women"] - counts[WOMEN]) + open_left,
        "men_left": max(0, split["men"] - counts[MEN]) + open_left,
        "open_left": open_left,
    }


def bucket_eligible(women_pct: int | None, bucket: str) -> bool:
    """Could this bucket ever attend, regardless of how full the event is?"""
    if women_pct is None:
        return True
    if women_pct >= 100:
        return bucket == WOMEN
    if women_pct <= 0:
        return bucket == MEN
    return True


def bucket_has_room(capacity: int, women_pct: int | None, counts: dict, bucket: str) -> bool:
    left = ratio_left(capacity, women_pct, counts)
    if left is None:
        return True
    if not bucket_eligible(women_pct, bucket):
        return False
    if bucket == WOMEN:
        return left["women_left"] > 0
    if bucket == MEN:
        return left["men_left"] > 0
    return left["open_left"] > 0


def ineligible_message(women_pct: int | None) -> str:
    if women_pct is not None and women_pct >= 100:
        return "This event is for women only"
    if women_pct is not None and women_pct <= 0:
        return "This event is for men only"
    return "You can't join this event"


def full_message(bucket: str) -> str:
    return f"Spots for {_BUCKET_LABEL[bucket]} are full"


def user_bucket(cur, user_id: str) -> str:
    cur.execute("SELECT gender FROM users WHERE id = %s::uuid", (user_id,))
    row = cur.fetchone()
    return gender_bucket(row["gender"] if row else None)


def user_holds_offer(cur, event_id: str, user_id: str) -> bool:
    cur.execute(
        """
        SELECT 1 FROM event_attendees
        WHERE event_id = %s::uuid AND user_id = %s::uuid AND status = 'waitlist'
          AND offer_expires_at IS NOT NULL AND offer_expires_at > NOW()
        """,
        (event_id, user_id),
    )
    return cur.fetchone() is not None


def assert_seat_available(cur, ev: dict, user_id: str) -> None:
    """Raises if this user can't take a fresh (not already-held) seat on a
    locked event row. Callers handle the held-offer case before calling."""
    bucket = user_bucket(cur, user_id)
    if not bucket_eligible(ev["women_pct"], bucket):
        raise HTTPException(status_code=403, detail=ineligible_message(ev["women_pct"]))
    if ev["spots_left"] <= 0:
        raise HTTPException(status_code=409, detail="No spots left for this event")
    counts = seat_counts(cur, ev["id"])
    if not bucket_has_room(ev["capacity"], ev["women_pct"], counts, bucket):
        raise HTTPException(status_code=409, detail=full_message(bucket))
