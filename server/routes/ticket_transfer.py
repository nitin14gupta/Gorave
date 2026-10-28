"""Ticket transfer: "Can't make it? Send it to a friend."

A paid ticket can be passed on once, any time before the event starts (the
48h cancel cutoff doesn't apply, which is the point: no empty spot, no refund,
nothing lost by the host). It works as an offer:

- Sent to a friend in chat (to_user_id set): only they can accept, from a
  ticket card in the chat.
- Shared as a link (to_user_id NULL): anyone on Gorave who opens it can
  accept, including someone who installs the app for it.

Until it's accepted the sender's ticket keeps working. On accept, under the
event's row lock: the sender's row becomes 'transferred' (old QR dead, money
columns zeroed so revenue isn't counted twice), the friend gets a 'going' row
with a fresh QR and the ticket's money columns, and paid_by_user_id keeps
pointing at the buyer, so any later refund goes to whoever paid. The friend
must pass the same checks as a booking: age, crowd mix, blocks.
"""
import secrets
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel

from db.config import get_db
from middleware.auth import get_current_user
from utils import seats
from utils.push import send_push

router = APIRouter(prefix="/events", tags=["ticket-transfer"])

MAX_TRANSFERS = 1


def _utc(dt):
    if dt is None:
        return None
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt


def transfer_quote(ev: dict, att: dict, now: datetime | None = None) -> dict:
    """Can this ticket be passed on right now? `ev` needs date_time and
    is_cancelled; `att` needs status, payment_id, price_paid_inr, refunded_at,
    transfer_count."""
    now = now or datetime.now(timezone.utc)
    no = lambda reason: {"allowed": False, "reason": reason}  # noqa: E731
    if att.get("status") != "going" or ev.get("is_cancelled") or att.get("refunded_at"):
        return no("Nothing to pass on")
    if now >= _utc(ev["date_time"]):
        return no("The event has already started")
    if not att.get("payment_id") or not (att.get("price_paid_inr") or 0) > 0:
        return no("Free spots are picked by the host, so they can't be passed on")
    if (att.get("transfer_count") or 0) >= MAX_TRANSFERS:
        return no("This ticket was already passed on once, so it can't be passed on again")
    return {"allowed": True, "reason": None}


def pending_offer(cur, event_id: str, uid: str) -> Optional[dict]:
    cur.execute(
        """
        SELECT t.id::text, t.token, t.to_user_id::text, u.name AS to_name, t.created_at::text
        FROM ticket_transfers t LEFT JOIN users u ON u.id = t.to_user_id
        WHERE t.event_id = %s AND t.from_user_id = %s::uuid AND t.status = 'pending'
        """,
        (event_id, uid),
    )
    row = cur.fetchone()
    return dict(row) if row else None


def cancel_pending_offers(cur, event_id: str, from_user_id: Optional[str] = None) -> None:
    """The ticket is gone (cancelled, refunded, event cancelled): its offer dies too."""
    if from_user_id:
        cur.execute(
            "UPDATE ticket_transfers SET status = 'cancelled', decided_at = NOW() "
            "WHERE event_id = %s AND from_user_id = %s::uuid AND status = 'pending'",
            (event_id, from_user_id),
        )
    else:
        cur.execute(
            "UPDATE ticket_transfers SET status = 'cancelled', decided_at = NOW() "
            "WHERE event_id = %s AND status = 'pending'",
            (event_id,),
        )


def _first_cover(photos) -> Optional[str]:
    """Events store covers either as plain URLs or as {"url": ...} objects."""
    if not photos:
        return None
    first = photos[0]
    if isinstance(first, str):
        return first
    return first.get("url") if isinstance(first, dict) else None


def _blocked(cur, a: str, b: str) -> bool:
    cur.execute(
        """
        SELECT 1 FROM user_blocks
        WHERE (blocker_id = %s::uuid AND blocked_id = %s::uuid)
           OR (blocker_id = %s::uuid AND blocked_id = %s::uuid)
        """,
        (a, b, b, a),
    )
    return cur.fetchone() is not None


def _my_ticket(cur, event_id: str, uid: str, lock: bool = False) -> Optional[dict]:
    cur.execute(
        f"""
        SELECT status, payment_id, price_paid_inr, fee_paid_inr, commission_inr, refunded_at,
               transfer_count, paid_by_user_id::text, prior_fees_kept_inr
        FROM event_attendees WHERE event_id = %s AND user_id = %s::uuid
        {"FOR UPDATE" if lock else ""}
        """,
        (event_id, uid),
    )
    row = cur.fetchone()
    return dict(row) if row else None


# ── Make an offer ─────────────────────────────────────────────────────────────

class TransferBody(BaseModel):
    # A friend you chat with; leave empty for a link anyone can claim.
    to_user_id: Optional[str] = None


@router.post("/{event_id}/transfer")
async def offer_transfer(event_id: str, body: TransferBody, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    to_uid = body.to_user_id or None
    conv_id = None
    with get_db() as (cur, conn):
        ev = seats.lock_event(cur, event_id)
        if not ev:
            raise HTTPException(status_code=404, detail="Event not found")
        mine = _my_ticket(cur, event_id, uid, lock=True)
        quote = transfer_quote(ev, mine or {})
        if not quote["allowed"]:
            raise HTTPException(status_code=400, detail=quote["reason"])

        if to_uid:
            if to_uid in (uid, ev["host_id"]):
                raise HTTPException(status_code=400, detail="Pick a friend who isn't going already")
            if _blocked(cur, uid, to_uid):
                raise HTTPException(status_code=403, detail="You can't send this to them")
            cur.execute(
                """
                SELECT id::text FROM conversations
                WHERE status = 'active'
                  AND ((user1_id = %s::uuid AND user2_id = %s::uuid) OR (user1_id = %s::uuid AND user2_id = %s::uuid))
                """,
                (uid, to_uid, to_uid, uid),
            )
            conv = cur.fetchone()
            if not conv:
                raise HTTPException(status_code=400, detail="You can only send tickets to people you chat with")
            conv_id = conv["id"]

        # A new offer replaces the old one.
        cancel_pending_offers(cur, event_id, uid)
        token = secrets.token_urlsafe(18)
        cur.execute(
            """
            INSERT INTO ticket_transfers (event_id, from_user_id, to_user_id, token)
            VALUES (%s, %s::uuid, %s::uuid, %s) RETURNING id::text
            """,
            (event_id, uid, to_uid, token),
        )
        transfer_id = cur.fetchone()["id"]

        msg = None
        if conv_id:
            from routes.chat import _insert_message
            cur.execute("SELECT cover_photos, area, city FROM events WHERE id = %s", (event_id,))
            extra = cur.fetchone() or {}
            cover = _first_cover(extra.get("cover_photos"))
            msg, _ = _insert_message(cur, conv_id, uid, None, "ticket", {
                "transfer_token": token, "event_id": event_id, "title": ev["title"],
                "date_time": ev["date_time"].isoformat(), "area": extra.get("area"),
                "city": extra.get("city"), "cover_url": cover,
            })
            cur.execute("SELECT name FROM users WHERE id = %s::uuid", (uid,))
            sender_name = (cur.fetchone() or {}).get("name") or "Someone"
        conn.commit()

    if msg:
        from routes.chat import _deliver_new_message, _serialize
        # Its own push instead of the generic "Sent you a message".
        await _deliver_new_message(conv_id, _serialize(msg), uid, to_uid, sender_name, push=False)
        import asyncio
        asyncio.create_task(asyncio.to_thread(
            send_push, to_uid, f"{sender_name.split(' ')[0]} sent you a ticket 🎟️",
            f"{ev['title']} is yours if you want it. Tap to accept.",
            {"type": "ticket_transfer", "token": token, "event_id": event_id}, category="attending",
        ))
    return {"transfer_id": transfer_id, "token": token, "conversation_id": conv_id}


@router.delete("/{event_id}/transfer")
def withdraw_transfer(event_id: str, current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, conn):
        cancel_pending_offers(cur, event_id, current_user["id"])
        conn.commit()
    return {"ok": True}


# ── Look at / accept an offer ─────────────────────────────────────────────────

def _load_offer(cur, token: str, lock: bool = False) -> dict:
    cur.execute(
        f"""
        SELECT t.id::text, t.event_id::text, t.from_user_id::text, t.to_user_id::text, t.status,
               u.name AS from_name,
               (SELECT p.url FROM user_photos p WHERE p.user_id = u.id ORDER BY p.position LIMIT 1) AS from_avatar
        FROM ticket_transfers t JOIN users u ON u.id = t.from_user_id
        WHERE t.token = %s
        {"FOR UPDATE OF t" if lock else ""}
        """,
        (token,),
    )
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="This ticket link isn't valid")
    return dict(row)


def _accept_check(cur, offer: dict, ev: dict, uid: str) -> Optional[str]:
    """Why this person can't take the ticket, or None if they can."""
    if offer["status"] == "accepted":
        return "This ticket was already accepted"
    if offer["status"] != "pending":
        return "This ticket offer was withdrawn"
    if ev["is_cancelled"]:
        return "This event was cancelled"
    if datetime.now(timezone.utc) >= _utc(ev["date_time"]):
        return "The event has already started"
    if uid == offer["from_user_id"]:
        return "This is your own ticket"
    if offer["to_user_id"] and offer["to_user_id"] != uid:
        return "This ticket was sent to someone else"
    if uid == ev["host_id"]:
        return "You're hosting this event"
    sender = _my_ticket(cur, offer["event_id"], offer["from_user_id"])
    if not transfer_quote(ev, sender or {})["allowed"]:
        return "This ticket can't be passed on any more"
    mine = _my_ticket(cur, offer["event_id"], uid)
    if mine and mine["status"] == "going":
        return "You already have a ticket for this"
    if _blocked(cur, uid, ev["host_id"]) or _blocked(cur, uid, offer["from_user_id"]):
        return "You can't accept this ticket"
    return None


@router.get("/transfers/{token}")
def preview_transfer(token: str, current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, _):
        offer = _load_offer(cur, token)
        cur.execute(
            """
            SELECT id::text, host_id::text, title, date_time, area, city, cover_photos, price_inr,
                   is_cancelled, women_pct, capacity, spots_left, age_restriction, join_mode
            FROM events WHERE id = %s
            """,
            (offer["event_id"],),
        )
        ev = dict(cur.fetchone())
        reason = _accept_check(cur, offer, ev, current_user["id"])
    return {
        "status": offer["status"],
        "can_accept": reason is None,
        "reason": reason,
        "is_sender": offer["from_user_id"] == current_user["id"],
        "from": {"id": offer["from_user_id"], "name": offer["from_name"], "avatar": offer["from_avatar"]},
        "event": {
            "id": ev["id"], "title": ev["title"], "date_time": ev["date_time"].isoformat(),
            "area": ev["area"], "city": ev["city"], "price_inr": ev["price_inr"],
            "cover_url": _first_cover(ev.get("cover_photos")),
        },
    }


@router.post("/transfers/{token}/accept")
def accept_transfer(token: str, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, conn):
        offer = _load_offer(cur, token)
        # Same lock every booking takes, so seats and crowd mix stay exact.
        ev = seats.lock_event(cur, offer["event_id"])
        if not ev:
            raise HTTPException(status_code=404, detail="Event not found")
        offer = _load_offer(cur, token, lock=True)
        reason = _accept_check(cur, offer, ev, uid)
        if reason:
            raise HTTPException(status_code=409, detail=reason)

        # Same gate as booking: age and crowd mix (the seat moves from the
        # sender's side of the split to the friend's).
        from routes.events import _calc_age
        cur.execute("SELECT dob, name FROM users WHERE id = %s::uuid", (uid,))
        me = cur.fetchone()
        if me and me.get("dob") and _calc_age(me["dob"]) < ev["age_restriction"]:
            raise HTTPException(status_code=403, detail=f"You must be {ev['age_restriction']}+ to attend this event")
        bucket = seats.user_bucket(cur, uid)
        if not seats.bucket_eligible(ev["women_pct"], bucket):
            raise HTTPException(status_code=403, detail=seats.ineligible_message(ev["women_pct"]))
        counts = seats.seat_counts(cur, offer["event_id"], exclude_user_id=offer["from_user_id"])
        if not seats.bucket_has_room(ev["capacity"], ev["women_pct"], counts, bucket):
            raise HTTPException(status_code=409, detail="The crowd mix is full on your side, so this ticket can't move to you")

        sender = _my_ticket(cur, offer["event_id"], offer["from_user_id"], lock=True)
        payer = sender["paid_by_user_id"] or offer["from_user_id"]

        # The sender's ticket stops working; its money moves with the ticket.
        cur.execute(
            """
            UPDATE event_attendees
            SET status = 'transferred', ticket_token = gen_random_uuid()::text, checked_in_at = NULL,
                price_paid_inr = 0, fee_paid_inr = 0, commission_inr = 0
            WHERE event_id = %s AND user_id = %s::uuid
            """,
            (offer["event_id"], offer["from_user_id"]),
        )
        cur.execute(
            """
            INSERT INTO event_attendees (event_id, user_id, status, payment_id, price_paid_inr, fee_paid_inr,
                                         commission_inr, paid_by_user_id, transferred_from_user_id, transfer_count)
            VALUES (%s, %s::uuid, 'going', 'transfer', %s, %s, %s, %s::uuid, %s::uuid, %s)
            ON CONFLICT (event_id, user_id) DO UPDATE SET
                status = 'going', payment_id = 'transfer', offer_expires_at = NULL, checked_in_at = NULL,
                ticket_token = gen_random_uuid()::text,
                price_paid_inr = EXCLUDED.price_paid_inr, fee_paid_inr = EXCLUDED.fee_paid_inr,
                commission_inr = EXCLUDED.commission_inr, paid_by_user_id = EXCLUDED.paid_by_user_id,
                transferred_from_user_id = EXCLUDED.transferred_from_user_id,
                transfer_count = EXCLUDED.transfer_count,
                refund_amount_inr = NULL, refunded_at = NULL, cancel_reason = NULL, joined_at = NOW()
            """,
            (offer["event_id"], uid, sender["price_paid_inr"], sender["fee_paid_inr"], sender["commission_inr"],
             payer, offer["from_user_id"], (sender["transfer_count"] or 0) + 1),
        )
        cur.execute(
            "UPDATE ticket_transfers SET status = 'accepted', decided_at = NOW(), accepted_by = %s::uuid WHERE id = %s",
            (uid, offer["id"]),
        )
        conn.commit()

    friend = (me or {}).get("name") or "Your friend"
    data = {"type": "event", "event_id": offer["event_id"]}
    background_tasks.add_task(
        send_push, offer["from_user_id"], "Ticket passed on 🎟️",
        f"{friend} accepted your ticket to {ev['title']}. Your old ticket no longer works.", data, category="attending",
    )
    # The host should always know who's actually coming.
    background_tasks.add_task(
        send_push, ev["host_id"], "A ticket changed hands",
        f"{offer['from_name']} passed their ticket to {ev['title']} on to {friend}.", data, category="hosting",
    )
    return {"ok": True, "event_id": offer["event_id"]}
