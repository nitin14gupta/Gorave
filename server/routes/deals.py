"""Deals hosts give: early-bird tickets and promo codes. Plus the price
preview a guest sees before paying (with or without a code).

Pricing itself lives in utils/pricing.py.
"""
import re
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from db.config import get_db
from middleware.auth import get_current_user
from middleware.rate_limit import enforce_rate_limit
from utils import pricing

router = APIRouter(tags=["deals"])

CODE_RE = re.compile(r"^[A-Z0-9]{3,20}$")


def _own_paid_event(cur, event_id: str, uid: str) -> dict:
    cur.execute(
        """
        SELECT id::text, host_id::text, title, price_inr, platform_fee_inr, capacity,
               early_bird_price_inr, early_bird_count, is_cancelled, date_time
        FROM events WHERE id = %s::uuid
        """,
        (event_id,),
    )
    ev = cur.fetchone()
    if not ev or ev["is_cancelled"]:
        raise HTTPException(status_code=404, detail="Event not found")
    if ev["host_id"] != uid:
        raise HTTPException(status_code=403, detail="Not your event")
    if ev["price_inr"] <= 0:
        raise HTTPException(status_code=400, detail="Deals are for paid events")
    return dict(ev)


def _deals(cur, ev: dict) -> dict:
    cur.execute(
        """
        SELECT id::text, code, percent_off, amount_off, max_uses, uses, active, created_at
        FROM promo_codes WHERE event_id = %s::uuid ORDER BY active DESC, created_at DESC
        """,
        (ev["id"],),
    )
    codes = [dict(r) for r in cur.fetchall()]
    for c in codes:
        c["created_at"] = c["created_at"].isoformat()
        c["price_inr"] = pricing.code_price(ev["price_inr"], c)
    sold_eb = 0
    if ev["early_bird_count"]:
        sold_eb = ev["early_bird_count"] - pricing.early_bird_left(cur, ev)
    return {
        "price_inr": ev["price_inr"],
        "early_bird": {
            "price_inr": ev["early_bird_price_inr"],
            "count": ev["early_bird_count"],
            "sold": sold_eb,
            "left": max(0, (ev["early_bird_count"] or 0) - sold_eb),
        } if ev["early_bird_price_inr"] else None,
        "codes": codes,
    }


# ── Host ─────────────────────────────────────────────────────────────────────

@router.get("/events/{event_id}/deals")
def get_deals(event_id: str, current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, _):
        return _deals(cur, _own_paid_event(cur, event_id, current_user["id"]))


class EarlyBirdBody(BaseModel):
    # null price turns early bird off
    price_inr: Optional[int] = None
    count: Optional[int] = None


@router.put("/events/{event_id}/early-bird")
def set_early_bird(event_id: str, body: EarlyBirdBody, current_user: dict = Depends(get_current_user)):
    """The first `count` tickets at `price_inr`. Send price_inr null to stop it."""
    with get_db() as (cur, conn):
        ev = _own_paid_event(cur, event_id, current_user["id"])
        if body.price_inr is None:
            cur.execute("UPDATE events SET early_bird_price_inr = NULL, early_bird_count = NULL WHERE id = %s::uuid", (event_id,))
        else:
            floor = pricing.early_bird_floor(ev["price_inr"])
            if not (floor <= body.price_inr < ev["price_inr"]):
                raise HTTPException(status_code=400, detail=f"Early bird can be ₹{floor} to ₹{ev['price_inr'] - 1}. Up to half off keeps your full price believable.")
            max_spots = max(1, ev["capacity"] // 2)
            if not body.count or body.count < 1 or body.count > max_spots:
                raise HTTPException(status_code=400, detail=f"Early bird can be 1 to {max_spots} tickets, up to half your capacity")
            sold = (ev["early_bird_count"] or 0) - pricing.early_bird_left(cur, ev) if ev["early_bird_count"] else 0
            if body.count < sold:
                raise HTTPException(status_code=400, detail=f"{sold} early-bird tickets are already sold")
            cur.execute(
                "UPDATE events SET early_bird_price_inr = %s, early_bird_count = %s WHERE id = %s::uuid",
                (body.price_inr, body.count, event_id),
            )
        conn.commit()
        ev = _own_paid_event(cur, event_id, current_user["id"])
        return _deals(cur, ev)


class CodeBody(BaseModel):
    code: str
    percent_off: Optional[int] = None
    amount_off: Optional[int] = None
    max_uses: Optional[int] = None


@router.post("/events/{event_id}/promo-codes", status_code=201)
def create_code(event_id: str, body: CodeBody, current_user: dict = Depends(get_current_user)):
    code = body.code.strip().upper()
    if not CODE_RE.match(code):
        raise HTTPException(status_code=400, detail="Codes are 3 to 20 letters or numbers, like RIYA20")
    if (body.percent_off is None) == (body.amount_off is None):
        raise HTTPException(status_code=400, detail="Pick a % off or a ₹ off")
    if body.percent_off is not None and not (5 <= body.percent_off <= 100):
        raise HTTPException(status_code=400, detail="% off must be between 5 and 100")
    if body.max_uses is not None and body.max_uses < 1:
        raise HTTPException(status_code=400, detail="Uses must be at least 1")
    small_comp = body.max_uses is not None and body.max_uses <= pricing.COMP_MAX_USES
    if body.percent_off is not None and body.percent_off > pricing.MAX_OFF_PCT and not small_comp:
        raise HTTPException(status_code=400, detail=f"Over {pricing.MAX_OFF_PCT}% off needs a limit of {pricing.COMP_MAX_USES} uses or fewer, like a guest-list code")
    with get_db() as (cur, conn):
        ev = _own_paid_event(cur, event_id, current_user["id"])
        if body.amount_off is not None and not (10 <= body.amount_off <= ev["price_inr"]):
            raise HTTPException(status_code=400, detail=f"₹ off must be between ₹10 and ₹{ev['price_inr']}")
        if body.amount_off is not None and body.amount_off * 100 > ev["price_inr"] * pricing.MAX_OFF_PCT and not small_comp:
            raise HTTPException(status_code=400, detail=f"Over half off needs a limit of {pricing.COMP_MAX_USES} uses or fewer, like a guest-list code")
        cur.execute("SELECT 1 FROM promo_codes WHERE event_id = %s::uuid AND upper(code) = %s", (event_id, code))
        if cur.fetchone():
            raise HTTPException(status_code=409, detail="You already have that code on this event")
        cur.execute(
            """
            INSERT INTO promo_codes (event_id, host_id, code, percent_off, amount_off, max_uses)
            VALUES (%s::uuid, %s::uuid, %s, %s, %s, %s)
            """,
            (event_id, current_user["id"], code, body.percent_off, body.amount_off, body.max_uses),
        )
        conn.commit()
        return _deals(cur, ev)


@router.delete("/events/{event_id}/promo-codes/{code_id}")
def stop_code(event_id: str, code_id: str, current_user: dict = Depends(get_current_user)):
    """Stops a code working. Kept (not deleted) so past tickets still show it."""
    with get_db() as (cur, conn):
        ev = _own_paid_event(cur, event_id, current_user["id"])
        cur.execute("UPDATE promo_codes SET active = FALSE WHERE id = %s::uuid AND event_id = %s::uuid RETURNING id", (code_id, event_id))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Code not found")
        conn.commit()
        return _deals(cur, ev)


# ── Guest ────────────────────────────────────────────────────────────────────

@router.get("/payments/quote")
def price_quote(event_id: str, code: Optional[str] = Query(default=None), current_user: dict = Depends(get_current_user)):
    """What this ticket costs right now, with a code if one is given. A bad
    code is a 400 with the reason, so the app can say it under the field."""
    if code:
        enforce_rate_limit(f"promo:try:{current_user['id']}", max_events=20, window_seconds=600, message="Too many tries. Wait a few minutes.")
    with get_db() as (cur, _):
        cur.execute(
            "SELECT id::text, price_inr, platform_fee_inr, early_bird_price_inr, early_bird_count, is_cancelled FROM events WHERE id = %s::uuid",
            (event_id,),
        )
        ev = cur.fetchone()
        if not ev or ev["is_cancelled"]:
            raise HTTPException(status_code=404, detail="Event not found")
        if ev["price_inr"] <= 0:
            raise HTTPException(status_code=400, detail="This event is free")
        q = pricing.quote(cur, dict(ev), code)
    q.pop("promo_code_id", None)
    return q


# ── Host insights ────────────────────────────────────────────────────────────

@router.get("/events/{event_id}/insights")
def event_insights(event_id: str, current_user: dict = Depends(get_current_user)):
    """For the host: how the night is doing. Views (unique people per day),
    saves, bookings, and for paid nights what each deal sold."""
    uid = current_user["id"]
    with get_db() as (cur, _):
        cur.execute("SELECT host_id::text, price_inr, capacity, created_at FROM events WHERE id = %s::uuid", (event_id,))
        ev = cur.fetchone()
        if not ev:
            raise HTTPException(status_code=404, detail="Event not found")
        if ev["host_id"] != uid:
            raise HTTPException(status_code=403, detail="Not your event")
        cur.execute(
            """
            SELECT
              (SELECT COUNT(DISTINCT user_id) FROM event_views WHERE event_id = %(e)s::uuid)::int AS viewers,
              (SELECT COUNT(*) FROM event_views WHERE event_id = %(e)s::uuid)::int AS views,
              (SELECT COUNT(*) FROM event_hotlist WHERE event_id = %(e)s::uuid)::int AS saves,
              (SELECT COUNT(*) FROM event_attendees WHERE event_id = %(e)s::uuid AND status = 'going')::int AS going,
              (SELECT COUNT(*) FROM event_attendees WHERE event_id = %(e)s::uuid AND status = 'requested')::int AS requests,
              (SELECT COUNT(*) FROM event_attendees WHERE event_id = %(e)s::uuid AND status = 'waitlist')::int AS waitlist
            """,
            {"e": event_id},
        )
        totals = dict(cur.fetchone())
        # Bookings and views over the last 7 days, for a small chart.
        cur.execute(
            """
            SELECT d::date AS day,
                   (SELECT COUNT(DISTINCT user_id) FROM event_views v WHERE v.event_id = %(e)s::uuid AND v.day = d::date)::int AS views,
                   (SELECT COUNT(*) FROM event_attendees a WHERE a.event_id = %(e)s::uuid AND a.status = 'going'
                      AND (a.joined_at AT TIME ZONE 'Asia/Kolkata')::date = d::date)::int AS bookings
            FROM generate_series((NOW() AT TIME ZONE 'Asia/Kolkata')::date - 6, (NOW() AT TIME ZONE 'Asia/Kolkata')::date, INTERVAL '1 day') d
            ORDER BY d
            """,
            {"e": event_id},
        )
        days = [{"day": r["day"].isoformat(), "views": r["views"], "bookings": r["bookings"]} for r in cur.fetchall()]
        # Money by how each ticket was priced (paid, not refunded).
        cur.execute(
            """
            SELECT COALESCE(a.pricing, 'full') AS kind, pc.code,
                   COUNT(*)::int AS tickets,
                   COALESCE(SUM(a.price_paid_inr), 0)::int AS revenue,
                   COALESCE(SUM(a.commission_inr), 0)::int AS commission
            FROM event_attendees a LEFT JOIN promo_codes pc ON pc.id = a.promo_code_id
            WHERE a.event_id = %(e)s::uuid AND a.status = 'going' AND a.refunded_at IS NULL
              AND a.payment_id IS NOT NULL AND COALESCE(a.price_paid_inr, 0) > 0
            GROUP BY 1, 2 ORDER BY tickets DESC
            """,
            {"e": event_id},
        )
        sold = [dict(r) for r in cur.fetchall()]
    revenue = sum(s["revenue"] for s in sold)
    commission = sum(s["commission"] for s in sold)
    return {
        **totals,
        "capacity": ev["capacity"],
        "conversion_pct": round(100 * totals["going"] / totals["viewers"]) if totals["viewers"] else None,
        "days": days,
        "paid": ev["price_inr"] > 0,
        "revenue_inr": revenue,
        "you_get_inr": revenue - commission,
        "by_deal": sold,
    }
