"""What a ticket costs right now, for one guest. One place, used by the
price preview, all three ways to pay, and the event page.

Hosts have two deals:
- Early bird: the first N tickets at a lower price.
- Promo codes: % or ₹ off the full ticket price (RIYA20).
They don't stack: a guest gets whichever is cheaper. The ₹50 platform fee is
never discounted. The host funds the discount (their payout is on the price
actually paid, as always).
"""
from typing import Optional
from fastapi import HTTPException

EARLY_BIRD_MIN_INR = 49
# Guardrails, so deals stay deals (and the full price stays believable):
# early bird at least half the full price, for at most half the seats; codes
# up to 50% off, or deeper only as a small comp code (10 uses or fewer).
MAX_OFF_PCT = 50
COMP_MAX_USES = 10


def early_bird_floor(full_price: int) -> int:
    """Lowest early-bird price allowed: half the full price, never under ₹49."""
    return max(EARLY_BIRD_MIN_INR, -(-full_price * (100 - MAX_OFF_PCT) // 100))


def early_bird_left(cur, event: dict) -> int:
    """Early-bird spots still open (0 when there's no early bird)."""
    if not event.get("early_bird_price_inr") or not event.get("early_bird_count"):
        return 0
    cur.execute(
        """
        SELECT COUNT(*)::int AS n FROM event_attendees
        WHERE event_id = %s::uuid AND pricing = 'early_bird' AND status IN ('going', 'transferred') AND refunded_at IS NULL
        """,
        (event["id"],),
    )
    return max(0, event["early_bird_count"] - cur.fetchone()["n"])


def find_code(cur, event_id: str, code: str) -> dict:
    """A promo code that can be used right now, or a 400 saying why not."""
    cur.execute(
        "SELECT * FROM promo_codes WHERE event_id = %s::uuid AND upper(code) = upper(%s)",
        (event_id, code.strip()),
    )
    row = cur.fetchone()
    if not row or not row["active"]:
        raise HTTPException(status_code=400, detail="That code doesn't work for this event")
    if row["max_uses"] is not None and row["uses"] >= row["max_uses"]:
        raise HTTPException(status_code=400, detail="That code has been used up")
    return dict(row)


def code_price(full: int, code: dict) -> int:
    off = round(full * code["percent_off"] / 100) if code["percent_off"] else code["amount_off"]
    return max(0, full - off)


def quote(cur, event: dict, code: Optional[str] = None) -> dict:
    """Ticket price now. `event` needs id, price_inr, platform_fee_inr,
    early_bird_price_inr, early_bird_count. A bad code raises a 400."""
    full = event["price_inr"]
    fee = event["platform_fee_inr"]
    price, pricing, promo = full, None, None

    eb_left = early_bird_left(cur, event)
    if eb_left > 0 and event["early_bird_price_inr"] < full:
        price, pricing = event["early_bird_price_inr"], "early_bird"

    if code and code.strip():
        promo = find_code(cur, event["id"], code)
        with_code = code_price(full, promo)
        if with_code < price:
            price, pricing = with_code, "promo"

    return {
        "full_price_inr": full,
        "price_inr": price,
        "fee_inr": fee,
        "total_inr": price + fee,
        "discount_inr": full - price,
        "pricing": pricing,
        "early_bird_left": eb_left,
        "early_bird_price_inr": event.get("early_bird_price_inr") if eb_left > 0 else None,
        # The code was valid but early bird is already cheaper: say so, don't hide it.
        "code_applied": pricing == "promo",
        "code": promo["code"] if promo else None,
        "promo_code_id": str(promo["id"]) if promo and pricing == "promo" else None,
    }


def use_code(cur, promo_code_id: Optional[str]) -> None:
    """Count one use of a code, once a ticket is actually sold with it."""
    if promo_code_id:
        cur.execute("UPDATE promo_codes SET uses = uses + 1 WHERE id = %s::uuid", (promo_code_id,))
