import hashlib
import hmac
import os
import time
from datetime import datetime, timezone
from io import BytesIO

import cv2
import numpy as np
import razorpay
import requests as http_requests
from fastapi import APIRouter, Depends, HTTPException, Request
from PIL import Image
from pydantic import BaseModel
from typing import Optional

from db.config import get_db
from middleware.auth import get_current_user
from middleware.rate_limit import enforce_rate_limit

router = APIRouter(prefix="/payments", tags=["payments"])

# Flat platform fee charged on top of the host's ticket price — what the
# attendee sees and pays. Separate from the host's commission cut, which is
# deducted when the host is paid out and never shown to attendees.
PLATFORM_FEE_INR = 50

# Commission taken out of the host's ticket price when they get paid out.
# Attendees never see this — they only see PLATFORM_FEE_INR.
HOST_COMMISSION_RATE = 0.10

def _notify_paid_rsvp_extras(cur, uid: str, buyer_name: str, event_id: str, ev_title: str,
                              ev_host_id: Optional[str], just_sold_out: bool, cover_url: Optional[str]):
    """Shared by all 3 ticket-purchase finalize paths (wallet-pay, Razorpay
    checkout, Razorpay QR) — the same follow-RSVP social proof and
    almost-sold-out host nudge that the free RSVP path fires, extracted once
    instead of tripled across near-identical functions."""
    from routes.notifications import notify_follow_rsvp, notify_host_low_capacity
    from utils.push import send_push as _send_push

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
        notify_follow_rsvp(cur, f["follower_id"], uid, buyer_name, event_id, ev_title)
        try:
            _send_push(f["follower_id"], f"{buyer_name} is going to {ev_title} too",
                       "Someone you follow just joined an event you're already going to.",
                       {"type": "event", "event_id": event_id}, image_url=cover_url, category="social")
        except Exception:
            pass

    if ev_host_id and not just_sold_out:
        cur.execute("SELECT capacity, spots_left FROM events WHERE id = %s::uuid", (event_id,))
        ev = cur.fetchone()
        if ev and ev["capacity"] > 0 and ev["spots_left"] <= ev["capacity"] * 0.1:
            cur.execute(
                "UPDATE events SET low_capacity_notice_sent_at = NOW() "
                "WHERE id = %s::uuid AND low_capacity_notice_sent_at IS NULL",
                (event_id,),
            )
            if cur.rowcount:
                notify_host_low_capacity(cur, ev_host_id, event_id, ev_title, "almost_sold_out")
                try:
                    _send_push(ev_host_id, "Your event is almost sold out!",
                               f"{ev_title} is almost full — raise capacity to let more people in.",
                               {"type": "event", "event_id": event_id}, image_url=cover_url, category="hosting")
                except Exception:
                    pass


def _precheck_paid_seat(cur, event_id: str, uid: str) -> dict:
    """Everything that must hold before we take money for a ticket: event
    live, age, crowd mix, a free seat, and no waitlister ahead in line. A
    guest holding a waitlist promotion offer already has their seat."""
    from datetime import timedelta
    from fastapi import HTTPException as _H
    from utils import seats
    from routes.events import _calc_age

    cur.execute(
        """
        SELECT id::text, host_id::text, title, capacity, spots_left, women_pct, age_restriction,
               price_inr, platform_fee_inr, host_commission_inr, date_time, end_time, is_cancelled
        FROM events WHERE id = %s
        """,
        (event_id,),
    )
    ev = cur.fetchone()
    if not ev or ev["is_cancelled"]:
        raise _H(status_code=404, detail="Event not found")
    if ev["price_inr"] <= 0:
        raise _H(status_code=400, detail="This event is free")
    end = ev["end_time"] or ev["date_time"] + timedelta(hours=6)
    if datetime.now(timezone.utc) > end:
        raise _H(status_code=400, detail="This event has ended")

    cur.execute("SELECT dob FROM users WHERE id = %s::uuid", (uid,))
    me = cur.fetchone()
    if me and me.get("dob") and _calc_age(me["dob"]) < ev["age_restriction"]:
        raise _H(status_code=403, detail=f"You must be {ev['age_restriction']}+ to attend this event")

    if seats.user_holds_offer(cur, event_id, uid):
        return ev
    seats.assert_seat_available(cur, ev, uid)
    cur.execute(
        """
        SELECT u.gender FROM event_attendees ea JOIN users u ON u.id = ea.user_id
        WHERE ea.event_id = %s AND ea.status = 'waitlist' AND ea.offer_expires_at IS NULL
        """,
        (event_id,),
    )
    counts = seats.seat_counts(cur, event_id)
    if any(seats.bucket_has_room(ev["capacity"], ev["women_pct"], counts, seats.gender_bucket(w["gender"]))
           for w in cur.fetchall()):
        raise _H(status_code=409, detail="People on the waitlist are ahead of you — join the waitlist")
    return ev


def _claim_paid_seat(cur, event_id: str, uid: str) -> tuple[bool, bool]:
    """Called inside a finaliser's transaction once money is in hand. Locks
    the event and decides whether this guest still gets a seat. Returns
    (got_seat, held_offer). A guest holding a promotion offer already had
    their spot reserved, so nothing is decremented for them."""
    from fastapi import HTTPException as _H
    from utils import seats

    ev = seats.lock_event(cur, event_id)
    if not ev or ev["is_cancelled"]:
        return False, False
    if seats.user_holds_offer(cur, event_id, uid):
        return True, True
    try:
        seats.assert_seat_available(cur, ev, uid)
    except _H:
        return False, False
    return True, False


def ticket_commission(price_paid: int, ev_price: int, ev_commission: int) -> int:
    """Gorave's cut of what this ticket really cost, at the event's locked rate
    (events keep the rate they were created under, see _fee_snapshot)."""
    if not price_paid or not ev_price:
        return 0
    return round(price_paid * ev_commission / ev_price)


def _refund_to_wallet(cur, uid: str, event_id: str, amount: int, ev_title: str,
                      description: Optional[str] = None) -> None:
    if amount <= 0:
        return
    cur.execute("UPDATE users SET wallet_balance = wallet_balance + %s WHERE id = %s::uuid", (amount, uid))
    cur.execute(
        """
        INSERT INTO wallet_transactions
            (user_id, amount_inr, type, source, reference_id, description, expires_at)
        VALUES (%s::uuid, %s, 'credit', 'event_refund', %s::uuid, %s, NOW() + INTERVAL '6 months')
        """,
        (uid, amount, event_id, description or f"Refund — spot no longer available at {ev_title}"),
    )


_rz_client: Optional[razorpay.Client] = None


def _get_rz() -> razorpay.Client:
    global _rz_client
    if _rz_client is None:
        key_id = os.getenv("RAZORPAY_KEY_ID")
        key_secret = os.getenv("RAZORPAY_KEY_SECRET")
        if not key_id or not key_secret:
            raise RuntimeError("Razorpay credentials not configured")
        _rz_client = razorpay.Client(auth=(key_id, key_secret))
    return _rz_client


# ── Schemas ───────────────────────────────────────────────────────────────────

class CreateOrderBody(BaseModel):
    event_id: str
    wallet_amount: int = 0


class VerifyPaymentBody(BaseModel):
    event_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    wallet_amount: int = 0


class WalletPayBody(BaseModel):
    event_id: str


class CreateQrBody(BaseModel):
    event_id: str
    wallet_amount: int = 0


class SaveUpiBody(BaseModel):
    upi_id: str
    name: str


# ── GET /payments/public-key ─────────────────────────────────────────────────

@router.get("/public-key")
def get_public_key(current_user: dict = Depends(get_current_user)):
    """Returns the Razorpay public key so the client can initialise the SDK early."""
    return {"key": os.getenv("RAZORPAY_KEY_ID")}


# ── POST /payments/create-order ───────────────────────────────────────────────

@router.post("/create-order")
def create_order(body: CreateOrderBody, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    enforce_rate_limit(f"payments:create-order:user:{uid}", max_events=30, window_seconds=3600)

    with get_db() as (cur, _):
        ev = _precheck_paid_seat(cur, body.event_id, uid)

        cur.execute(
            "SELECT wallet_balance, phone, country_code FROM users WHERE id = %s::uuid", (uid,)
        )
        user = cur.fetchone()
        wallet_bal = user["wallet_balance"] if user else 0
        raw_phone = (user["phone"] or "") if user else ""
        country_code = (user.get("country_code") or "+91") if user else "+91"
        contact = f"{country_code}{raw_phone}".replace(" ", "")

    ticket_price = ev["price_inr"]
    platform_fee = ev["platform_fee_inr"]
    total = ticket_price + platform_fee

    wallet_use = max(0, min(body.wallet_amount, wallet_bal, total))
    razorpay_charge = total - wallet_use

    if razorpay_charge == 0:
        return {
            "full_wallet": True,
            "wallet_amount": wallet_use,
            "total": total,
            "ticket_price": ticket_price,
            "platform_fee": platform_fee,
        }

    rz = _get_rz()
    order = rz.order.create({
        "amount": razorpay_charge * 100,
        "currency": "INR",
        "payment_capture": 1,
        "notes": {"event_id": body.event_id, "user_id": uid},
    })

    with get_db() as (cur, conn):
        cur.execute(
            """
            INSERT INTO payment_orders
                (user_id, event_id, razorpay_order_id, amount_inr,
                 wallet_amount_inr, razorpay_amount_inr, platform_fee_inr)
            VALUES (%s::uuid, %s::uuid, %s, %s, %s, %s, %s)
            """,
            (uid, body.event_id, order["id"], total, wallet_use, razorpay_charge, platform_fee),
        )
        conn.commit()

    return {
        "full_wallet": False,
        "order_id": order["id"],
        "razorpay_key": os.getenv("RAZORPAY_KEY_ID"),
        "amount": razorpay_charge,
        "total": total,
        "ticket_price": ticket_price,
        "platform_fee": platform_fee,
        "wallet_amount": wallet_use,
        "event_title": ev["title"],
        "contact": contact,
        "email": f"pay_{uid[:8]}@gorave.in",
    }


# ── POST /payments/verify ─────────────────────────────────────────────────────

@router.post("/verify")
def verify_payment(body: VerifyPaymentBody, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]

    msg = f"{body.razorpay_order_id}|{body.razorpay_payment_id}"
    key_secret = os.getenv("RAZORPAY_KEY_SECRET", "")
    expected = hmac.new(key_secret.encode(), msg.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, body.razorpay_signature):
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    with get_db() as (cur, _):
        # event and wallet split come from the order we created, never the
        # request body — otherwise a paid order for one event could be
        # redeemed against another.
        cur.execute(
            "SELECT status, event_id::text, wallet_amount_inr FROM payment_orders "
            "WHERE razorpay_order_id = %s AND user_id = %s::uuid",
            (body.razorpay_order_id, uid),
        )
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Order not found")
    if row["status"] == "paid":
        return {"ok": True, "status": _booking_status(row["event_id"], uid)}

    status = _finalise_rsvp(
        order_id=body.razorpay_order_id,
        event_id=row["event_id"],
        uid=uid,
        payment_id=body.razorpay_payment_id,
        wallet_amount=row["wallet_amount_inr"] or 0,
    )
    return {"ok": True, "status": status}


def _booking_status(event_id: str, uid: str) -> str:
    with get_db() as (cur, _):
        cur.execute(
            "SELECT 1 FROM event_attendees WHERE event_id = %s::uuid AND user_id = %s::uuid AND status = 'going'",
            (event_id, uid),
        )
        return "going" if cur.fetchone() else "refunded"


# ── POST /payments/wallet-pay ─────────────────────────────────────────────────

@router.post("/wallet-pay")
def wallet_pay(body: WalletPayBody, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    enforce_rate_limit(f"payments:wallet-pay:user:{uid}", max_events=20, window_seconds=3600)

    with get_db() as (cur, _):
        ev = _precheck_paid_seat(cur, body.event_id, uid)

        ev_title = ev["title"]
        ev_host_id = ev["host_id"]
        ticket_price = ev["price_inr"]
        platform_fee = ev["platform_fee_inr"]
        total = ticket_price + platform_fee
        commission = ticket_commission(ticket_price, ev["price_inr"], ev["host_commission_inr"])

        cur.execute("SELECT name FROM users WHERE id = %s::uuid", (uid,))
        user = cur.fetchone()
        buyer_name = user["name"] if user else "Someone"

    with get_db() as (cur, conn):
        # Seat first, under the event row lock — nothing is debited if the
        # last spot went to someone else since the precheck.
        got_seat, held_offer = _claim_paid_seat(cur, body.event_id, uid)
        if not got_seat:
            raise HTTPException(status_code=409, detail="That spot was just taken — no money was charged")
        cur.execute("SELECT spots_left FROM events WHERE id = %s::uuid", (body.event_id,))
        just_sold_out = not held_offer and cur.fetchone()["spots_left"] == 1

        # Atomic guard: the WHERE clause makes this a no-op (rowcount 0) if the
        # balance has dropped below `total` since the check above — closes the
        # race where two concurrent wallet-pay calls could both pass a
        # SELECT-then-UPDATE check and drive the balance negative.
        cur.execute(
            "UPDATE users SET wallet_balance = wallet_balance - %s WHERE id = %s::uuid AND wallet_balance >= %s",
            (total, uid, total),
        )
        if cur.rowcount == 0:
            raise HTTPException(status_code=400, detail="Insufficient wallet balance")
        cur.execute(
            """
            INSERT INTO wallet_transactions
                (user_id, amount_inr, type, source, reference_id, description)
            VALUES (%s::uuid, %s, 'debit', 'ticket_purchase', %s::uuid, 'Ticket purchase via wallet')
            """,
            (uid, total, body.event_id),
        )
        # The ticket keeps its own price, fee and commission (refunds and host
        # payouts use these, never the event's current price). A re-buy after
        # a cancel reuses the row, so the old refund is cleared.
        cur.execute(
            """
            INSERT INTO event_attendees (event_id, user_id, status, payment_id,
                                         price_paid_inr, fee_paid_inr, commission_inr)
            VALUES (%s::uuid, %s::uuid, 'going', 'wallet', %s, %s, %s)
            ON CONFLICT (event_id, user_id)
            DO UPDATE SET status = 'going', payment_id = 'wallet', offer_expires_at = NULL,
                          price_paid_inr = EXCLUDED.price_paid_inr, fee_paid_inr = EXCLUDED.fee_paid_inr,
                          commission_inr = EXCLUDED.commission_inr,
                          prior_fees_kept_inr = event_attendees.prior_fees_kept_inr + CASE
                              WHEN event_attendees.refunded_at IS NOT NULL
                              THEN GREATEST(0, COALESCE(event_attendees.fee_paid_inr, 0)
                                   - GREATEST(0, COALESCE(event_attendees.refund_amount_inr, 0) - COALESCE(event_attendees.price_paid_inr, 0)))
                              ELSE 0 END,
                          refund_amount_inr = NULL, refunded_at = NULL, joined_at = NOW()
            """,
            (body.event_id, uid, ticket_price, platform_fee, commission),
        )
        if not held_offer:
            cur.execute(
                "UPDATE events SET spots_left = spots_left - 1 WHERE id = %s::uuid",
                (body.event_id,),
            )

        from routes.notifications import notify_payment_confirmed, notify_event_sold_out, notify_ticket_sold
        notify_payment_confirmed(cur, uid, body.event_id, ev_title)
        if ev_host_id:
            notify_ticket_sold(cur, ev_host_id, body.event_id, ev_title, uid, buyer_name)
        if just_sold_out and ev_host_id:
            notify_event_sold_out(cur, ev_host_id, body.event_id, ev_title)

        cover_url_pre = None
        try:
            from utils.push import get_event_image_url as _cover
            cover_url_pre = _cover(body.event_id)
        except Exception:
            pass
        _notify_paid_rsvp_extras(cur, uid, buyer_name, body.event_id, ev_title, ev_host_id, just_sold_out, cover_url_pre)

        conn.commit()

    from utils.push import send_push, get_event_image_url
    cover_url = get_event_image_url(body.event_id)
    if ev_host_id:
        try:
            send_push(ev_host_id, f"{buyer_name} bought a ticket!",
                      f"Someone's going to {ev_title}.",
                      {"type": "event", "event_id": body.event_id}, image_url=cover_url, category="hosting")
        except Exception:
            pass
    if just_sold_out and ev_host_id:
        try:
            send_push(ev_host_id, "Your event sold out!", f"{ev_title} has no spots left.",
                      {"type": "event", "event_id": body.event_id}, image_url=cover_url, category="hosting")
        except Exception:
            pass
    try:
        send_push(uid, "Payment confirmed!", "Your ticket is ready. 🎉",
                  {"type": "payment_success", "event_id": body.event_id}, image_url=cover_url, category="payments")
    except Exception:
        pass

    return {"ok": True, "status": "going"}


# ── QR decode helper ─────────────────────────────────────────────────────────

def _decode_qr_image(image_url: str) -> str:
    """Download Razorpay QR image and decode the embedded UPI payment URL."""
    try:
        resp = http_requests.get(image_url, timeout=10, allow_redirects=True)
        resp.raise_for_status()
        img_pil = Image.open(BytesIO(resp.content)).convert("RGB")
        img_np = np.array(img_pil)
        img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
        detector = cv2.QRCodeDetector()
        data, _, _ = detector.detectAndDecode(img_bgr)
        return data or ""
    except Exception as e:
        print(f"[QR decode error] url={image_url[:60]} err={e}")
        return ""


def _fetch_qr_image_url(rz_client, qr_id: str) -> str:
    """Fetch QR code from Razorpay API to get the direct CDN image URL
    (the create response returns a rzp.io short URL which may not resolve on server).
    """
    try:
        qr_full = rz_client.qrcode.fetch(qr_id)
        return qr_full.get("image_url", "")
    except Exception as e:
        print(f"[QR fetch error] {e}")
        return ""


def _close_qr(rz_client, qr_id: str) -> None:
    """Explicitly close a Razorpay QR code so it can no longer accept payments.
    `close_by` at creation only tells Razorpay when to auto-close it — calling
    this directly guarantees it's dead the moment we know it's expired, rather
    than trusting that timer alone. Best-effort: already-closed/paid QRs raise,
    which we don't care about here.
    """
    try:
        rz_client.qrcode.close(qr_id)
    except Exception as e:
        print(f"[QR close error] id={qr_id} err={e}")


# ── Internal helper ───────────────────────────────────────────────────────────

def _finalise_rsvp(*, order_id: str, event_id: str, uid: str, payment_id: str, wallet_amount: int) -> str:
    with get_db() as (cur, conn):
        # Atomic claim: the WHERE clause means only one concurrent call to
        # this function for the same order can ever see rowcount 1 — closes
        # the race where two near-simultaneous /verify calls for the same
        # order both pass the "not yet paid" check in the route handler and
        # both try to finalise (double wallet-debit, double spots_left decrement).
        cur.execute(
            "UPDATE payment_orders SET status = 'paid', razorpay_payment_id = %s "
            "WHERE razorpay_order_id = %s AND status != 'paid'",
            (payment_id, order_id),
        )
        if cur.rowcount == 0:
            conn.commit()
            return _booking_status(event_id, uid)
        cur.execute("SELECT razorpay_amount_inr FROM payment_orders WHERE razorpay_order_id = %s", (order_id,))
        paid_externally = (cur.fetchone() or {}).get("razorpay_amount_inr") or 0

    return _complete_paid_booking(event_id=event_id, uid=uid, payment_id=payment_id,
                                  wallet_amount=wallet_amount, paid_externally=paid_externally,
                                  wallet_note="Wallet used for ticket")


def _complete_paid_booking(*, event_id: str, uid: str, payment_id: str, wallet_amount: int,
                           paid_externally: int, wallet_note: str) -> str:
    """Shared tail of both Razorpay finalisers once the order is claimed:
    claim the seat under lock, or — if it's gone (sold out / crowd mix full
    since checkout started) — refund what was paid to the Gorave Wallet.
    Returns 'going' or 'refunded'."""
    from utils.push import send_push, get_event_image_url
    from routes.notifications import notify_payment_confirmed, notify_event_sold_out, notify_ticket_sold

    with get_db() as (cur, conn):
        got_seat, held_offer = _claim_paid_seat(cur, event_id, uid)
        cur.execute("SELECT title, host_id::text, spots_left FROM events WHERE id = %s", (event_id,))
        ev_row = cur.fetchone()
        ev_title = ev_row["title"] if ev_row else ""
        ev_host_id = ev_row["host_id"] if ev_row else None

        if not got_seat:
            # The wallet portion was never debited; refund the UPI/card part.
            _refund_to_wallet(cur, uid, event_id, paid_externally, ev_title)
            conn.commit()
            try:
                send_push(uid, "Refund in your Gorave Wallet 💰",
                          f"The last spot at {ev_title} went just before your payment. ₹{paid_externally} is in your wallet.",
                          {"type": "wallet", "event_id": event_id}, category="payments")
            except Exception:
                pass
            return "refunded"

        just_sold_out = not held_offer and bool(ev_row) and ev_row["spots_left"] == 1

        cur.execute("SELECT name FROM users WHERE id = %s::uuid", (uid,))
        buyer_row = cur.fetchone()
        buyer_name = buyer_row["name"] if buyer_row else "Someone"

        if wallet_amount > 0:
            cur.execute(
                "UPDATE users SET wallet_balance = wallet_balance - %s WHERE id = %s::uuid AND wallet_balance >= %s",
                (wallet_amount, uid, wallet_amount),
            )
            cur.execute(
                """
                INSERT INTO wallet_transactions
                    (user_id, amount_inr, type, source, reference_id, description)
                VALUES (%s::uuid, %s, 'debit', 'ticket_purchase', %s::uuid, %s)
                """,
                (uid, wallet_amount, event_id, wallet_note),
            )
        # What this ticket cost, from the order that was actually paid.
        cur.execute(
            "SELECT amount_inr, platform_fee_inr FROM payment_orders WHERE razorpay_payment_id = %s",
            (payment_id,),
        )
        order = cur.fetchone()
        cur.execute("SELECT price_inr, host_commission_inr FROM events WHERE id = %s", (event_id,))
        ev_money = cur.fetchone()
        fee_paid = order["platform_fee_inr"] if order else 0
        price_paid = (order["amount_inr"] - fee_paid) if order else (ev_money["price_inr"] if ev_money else 0)
        commission = ticket_commission(price_paid, ev_money["price_inr"], ev_money["host_commission_inr"]) if ev_money else 0
        cur.execute(
            """
            INSERT INTO event_attendees (event_id, user_id, status, payment_id,
                                         price_paid_inr, fee_paid_inr, commission_inr)
            VALUES (%s::uuid, %s::uuid, 'going', %s, %s, %s, %s)
            ON CONFLICT (event_id, user_id)
            DO UPDATE SET status = 'going', payment_id = EXCLUDED.payment_id, offer_expires_at = NULL,
                          price_paid_inr = EXCLUDED.price_paid_inr, fee_paid_inr = EXCLUDED.fee_paid_inr,
                          commission_inr = EXCLUDED.commission_inr,
                          prior_fees_kept_inr = event_attendees.prior_fees_kept_inr + CASE
                              WHEN event_attendees.refunded_at IS NOT NULL
                              THEN GREATEST(0, COALESCE(event_attendees.fee_paid_inr, 0)
                                   - GREATEST(0, COALESCE(event_attendees.refund_amount_inr, 0) - COALESCE(event_attendees.price_paid_inr, 0)))
                              ELSE 0 END,
                          refund_amount_inr = NULL, refunded_at = NULL, joined_at = NOW()
            """,
            (event_id, uid, payment_id, price_paid, fee_paid, commission),
        )
        if not held_offer:
            cur.execute("UPDATE events SET spots_left = spots_left - 1 WHERE id = %s::uuid", (event_id,))

        notify_payment_confirmed(cur, uid, event_id, ev_title)
        if ev_host_id:
            notify_ticket_sold(cur, ev_host_id, event_id, ev_title, uid, buyer_name)
        if just_sold_out and ev_host_id:
            notify_event_sold_out(cur, ev_host_id, event_id, ev_title)

        cover_url_pre = None
        try:
            cover_url_pre = get_event_image_url(event_id)
        except Exception:
            pass
        _notify_paid_rsvp_extras(cur, uid, buyer_name, event_id, ev_title, ev_host_id, just_sold_out, cover_url_pre)

        conn.commit()

    cover_url = get_event_image_url(event_id)

    try:
        send_push(uid, "Payment confirmed!", "Your ticket is ready. 🎉",
                  {"type": "payment_success", "event_id": event_id}, image_url=cover_url, category="payments")
    except Exception:
        pass

    if ev_host_id:
        try:
            send_push(ev_host_id, f"{buyer_name} bought a ticket!",
                      f"Someone's going to {ev_title}.",
                      {"type": "event", "event_id": event_id}, image_url=cover_url, category="hosting")
        except Exception:
            pass

    if just_sold_out and ev_host_id:
        try:
            send_push(ev_host_id, "Your event sold out!", f"{ev_title} has no spots left.",
                      {"type": "event", "event_id": event_id}, image_url=cover_url, category="hosting")
        except Exception:
            pass
    return "going"


# ── GET /payments/saved-upi-id ────────────────────────────────────────────────

@router.get("/saved-upi-id")
def get_saved_upi(current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, _):
        cur.execute(
            "SELECT upi_id, name FROM saved_upi_ids WHERE user_id = %s::uuid ORDER BY created_at DESC LIMIT 1",
            (uid,),
        )
        row = cur.fetchone()
    if not row:
        return None
    return {"upi_id": row["upi_id"], "name": row["name"]}


# ── POST /payments/save-upi-id ────────────────────────────────────────────────

@router.post("/save-upi-id")
def save_upi(body: SaveUpiBody, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, conn):
        cur.execute(
            """
            INSERT INTO saved_upi_ids (user_id, upi_id, name)
            VALUES (%s::uuid, %s, %s)
            ON CONFLICT (user_id, upi_id) DO UPDATE SET name = EXCLUDED.name
            """,
            (uid, body.upi_id, body.name),
        )
        conn.commit()
    return {"ok": True}


# ── POST /payments/create-qr ──────────────────────────────────────────────────

@router.post("/create-qr")
def create_qr(body: CreateQrBody, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    enforce_rate_limit(f"payments:create-qr:user:{uid}", max_events=20, window_seconds=3600)

    with get_db() as (cur, _):
        ev = _precheck_paid_seat(cur, body.event_id, uid)

        cur.execute("SELECT wallet_balance FROM users WHERE id = %s::uuid", (uid,))
        user = cur.fetchone()
        wallet_bal = user["wallet_balance"] if user else 0

    ticket_price = ev["price_inr"]
    platform_fee = ev["platform_fee_inr"]
    total = ticket_price + platform_fee
    wallet_use = max(0, min(body.wallet_amount, wallet_bal, total))
    charge = total - wallet_use

    if charge <= 0:
        raise HTTPException(status_code=400, detail="Use wallet-pay for full wallet payment")

    close_by = int(time.time()) + 900  # 15 minutes
    try:
        rz = _get_rz()
        qr = rz.qrcode.create({
            "type": "upi_qr",
            "name": "Gorave",
            "usage": "single_use",
            "fixed_amount": True,
            "payment_amount": charge * 100,
            "description": f"Ticket — {ev['title']}",
            "close_by": close_by,
        })

        image_url = qr.get("image_url", "")
        qr_id = qr["id"]

        # Razorpay live API doesn't return payment_url — decode the QR image ourselves.
        # The create response gives a rzp.io short URL which may fail on server DNS.
        # Fetching by ID from api.razorpay.com returns the direct CDN URL instead.
        payment_url = qr.get("payment_url") or qr.get("link") or qr.get("short_url") or ""
        if not payment_url:
            decode_url = image_url
            if "rzp.io" in image_url:
                # Short URL won't resolve on server — get direct CDN URL via API fetch
                cdn_url = _fetch_qr_image_url(rz, qr_id)
                if cdn_url and "rzp.io" not in cdn_url:
                    decode_url = cdn_url
                    image_url = cdn_url  # use the direct CDN URL everywhere
            payment_url = _decode_qr_image(decode_url)
        print(f"[QR] id={qr_id} image_url={image_url[:60]} payment_url={payment_url[:80] if payment_url else 'EMPTY'}")
        if not payment_url:
            raise HTTPException(
                status_code=503,
                detail="Payment service is temporarily unavailable. Please try again in a few minutes.",
            )
    except HTTPException:
        raise
    except Exception as e:
        err_msg = str(e).lower()
        print(f"[QR create error] {e}")
        if any(x in err_msg for x in ["max retries", "getaddrinfo", "connection", "timeout", "name resolution", "dns"]):
            raise HTTPException(
                status_code=503,
                detail="Payment service is temporarily unavailable. Please try again in a few minutes.",
            )
        raise HTTPException(status_code=503, detail="Could not generate QR code. Please try again.")

    expires_at = datetime.fromtimestamp(qr["close_by"], tz=timezone.utc)

    with get_db() as (cur, conn):
        cur.execute(
            """
            INSERT INTO payment_orders
                (user_id, event_id, qr_code_id, qr_image_url, qr_expires_at,
                 amount_inr, wallet_amount_inr, razorpay_amount_inr, platform_fee_inr)
            VALUES (%s::uuid, %s::uuid, %s, %s, %s, %s, %s, %s, %s)
            """,
            (uid, body.event_id, qr_id, image_url,
             expires_at, total, wallet_use, charge, platform_fee),
        )
        conn.commit()

    return {
        "qr_id": qr["id"],
        "image_url": image_url,
        "payment_url": payment_url,
        "amount_inr": total,
        "expires_at": expires_at.isoformat(),
    }


# ── GET /payments/qr-status/{qr_id} ──────────────────────────────────────────

@router.get("/qr-status/{qr_id}")
def get_qr_status(qr_id: str, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]

    with get_db() as (cur, _):
        cur.execute(
            """
            SELECT id::text, status, event_id::text, wallet_amount_inr, qr_expires_at
            FROM payment_orders
            WHERE qr_code_id = %s AND user_id = %s::uuid
            """,
            (qr_id, uid),
        )
        row = cur.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="QR not found")

    if row["status"] == "paid":
        return {"status": "paid" if _booking_status(row["event_id"], uid) == "going" else "refunded"}

    now = datetime.now(timezone.utc)
    expires_at = row["qr_expires_at"]
    if expires_at and now > expires_at:
        if row["status"] != "expired":
            _close_qr(_get_rz(), qr_id)
            with get_db() as (cur, conn):
                cur.execute(
                    "UPDATE payment_orders SET status = 'expired' WHERE id = %s::uuid AND status = 'created'",
                    (row["id"],),
                )
                conn.commit()
        return {"status": "expired"}

    rz = _get_rz()
    try:
        payments_resp = rz.qrcode.fetch_all_payments(qr_id)
        items = payments_resp.get("items", [])
    except Exception:
        return {"status": "pending"}

    captured = next((p for p in items if p.get("status") == "captured"), None)
    if not captured:
        return {"status": "pending"}

    status = _finalise_qr_rsvp(
        order_db_id=row["id"],
        qr_code_id=qr_id,
        event_id=row["event_id"],
        uid=uid,
        payment_id=captured["id"],
        wallet_amount=row["wallet_amount_inr"],
    )
    return {"status": "paid" if status == "going" else "refunded"}


# ── Internal helper — QR finalise ─────────────────────────────────────────────

def _finalise_qr_rsvp(*, order_db_id: str, qr_code_id: str, event_id: str,
                       uid: str, payment_id: str, wallet_amount: int) -> str:
    with get_db() as (cur, conn):
        # Same atomic-claim pattern as _finalise_rsvp above.
        cur.execute(
            "UPDATE payment_orders SET status = 'paid', razorpay_payment_id = %s "
            "WHERE id = %s::uuid AND status != 'paid' "
            "RETURNING razorpay_amount_inr",
            (payment_id, order_db_id),
        )
        claimed = cur.fetchone()
        if not claimed:
            conn.commit()
            return _booking_status(event_id, uid)

    return _complete_paid_booking(event_id=event_id, uid=uid, payment_id=payment_id,
                                  wallet_amount=wallet_amount or 0,
                                  paid_externally=claimed["razorpay_amount_inr"] or 0,
                                  wallet_note="Wallet used for QR ticket")
