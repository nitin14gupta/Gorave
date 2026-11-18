import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from middleware.auth import get_current_user
from middleware.rate_limit import enforce_rate_limit
from db.config import get_db

log = logging.getLogger(__name__)

router = APIRouter(prefix="/wallet", tags=["wallet"])


@router.get("")
def get_wallet(current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as (cur, _):
        cur.execute("SELECT wallet_balance FROM users WHERE id = %s::uuid", (uid,))
        row = cur.fetchone()
        balance = row["wallet_balance"] if row else 0
        cur.execute(
            """
            SELECT wt.id::text, wt.amount_inr, wt.type, wt.source, wt.description,
                   to_char(wt.expires_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS expires_at,
                   to_char(wt.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
                   wt.reference_id::text AS event_id,
                   e.title AS event_title,
                   e.cover_photos[1] AS event_cover,
                   CASE WHEN wt.source = 'event_refund' THEN COALESCE(wt.to_source_status, 'in_wallet') END AS refund_status,
                   CASE WHEN wt.source = 'event_refund' AND wt.to_source_status IS NULL AND wt.to_source_until > NOW()
                        THEN GREATEST(0, LEAST(COALESCE(wt.to_source_inr, 0), (SELECT wallet_balance FROM users WHERE id = wt.user_id))) END AS refund_sendable_inr
            FROM wallet_transactions wt
            LEFT JOIN events e
                ON wt.source IN ('ticket_purchase', 'event_refund', 'refund_to_source') AND e.id = wt.reference_id
            WHERE wt.user_id = %s::uuid
            ORDER BY wt.created_at DESC
            LIMIT 30
            """,
            (uid,),
        )
        transactions = [dict(r) for r in cur.fetchall()]
    return {"balance": balance, "transactions": transactions}

_REFUND_FIELDS = """
    wt.id::text, wt.amount_inr, wt.description, wt.payment_id, wt.to_source_inr, wt.to_source_until,
    wt.to_source_status, wt.to_source_refund_id, wt.to_source_at, wt.choice_made_at, wt.created_at,
    e.id::text AS event_id, e.title AS event_title, e.cover_photos->>0 AS event_cover, e.date_time AS event_date,
    e.is_cancelled AS event_cancelled
"""


def _method_label(payment_id: str) -> dict:
    """'UPI: name@bank' or 'Visa ending 4242', from Razorpay. Best effort."""
    try:
        from routes.payments import _get_rz
        p = _get_rz().payment.fetch(payment_id)
        method = p.get("method")
        if method == "upi":
            return {"kind": "upi", "label": p.get("vpa") or "UPI"}
        if method == "card":
            card = p.get("card") or {}
            last4 = card.get("last4")
            return {"kind": "card", "label": f"{card.get('network') or 'Card'} ending {last4}" if last4 else "Card"}
        if method == "netbanking":
            return {"kind": "bank", "label": f"Net banking ({p.get('bank')})" if p.get("bank") else "Net banking"}
    except Exception:
        pass
    return {"kind": "other", "label": "Original payment method"}


def _shape(cur, row: dict, balance: int, with_method: bool) -> dict:
    now = datetime.now(timezone.utc)
    to_source = row["to_source_inr"] or 0
    until = row["to_source_until"]
    status = row["to_source_status"]
    # A refund on its way: ask Razorpay if it has landed.
    if status == "processing" and row["to_source_refund_id"]:
        try:
            from routes.payments import _get_rz
            rf = _get_rz().refund.fetch(row["to_source_refund_id"])
            if rf.get("status") == "processed":
                cur.execute("UPDATE wallet_transactions SET to_source_status = 'done' WHERE id = %s::uuid", (row["id"],))
                status = "done"
        except Exception:
            pass
    # What can still go back, limited by what's left in the wallet (some of it
    # may have gone on another ticket since).
    window_open = bool(until) and now < until
    sendable = max(0, min(to_source, balance)) if status in (None, "failed") and window_open else 0
    return {
        "id": row["id"],
        "amount_inr": row["amount_inr"],
        "description": row["description"],
        "created_at": row["created_at"].isoformat() if row["created_at"] else None,
        "event": {"id": row["event_id"], "title": row["event_title"], "cover": row["event_cover"],
                  "date_time": row["event_date"].isoformat() if row["event_date"] else None,
                  "cancelled": row["event_cancelled"]} if row["event_id"] else None,
        # The card/UPI part of this refund (the rest was paid from the wallet).
        "to_source_inr": to_source,
        "sendable_inr": sendable,
        "send_back_until": until.isoformat() if until and window_open else None,
        "window_closed": bool(to_source) and not window_open,
        "status": status or "in_wallet",
        "sent_at": row["to_source_at"].isoformat() if row["to_source_at"] else None,
        "choice_made": bool(row["choice_made_at"]),
        "method": _method_label(row["payment_id"]) if with_method and row["payment_id"] and to_source else None,
    }


def _balance(cur, uid: str) -> int:
    cur.execute("SELECT wallet_balance FROM users WHERE id = %s::uuid", (uid,))
    return (cur.fetchone() or {}).get("wallet_balance") or 0


@router.get("/refunds")
def list_refunds(event_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """My refunds, newest first. With event_id: only that event's (what a
    notification or the cancel flow opens), with the payment method's name."""
    uid = current_user["id"]
    with get_db() as (cur, conn):
        balance = _balance(cur, uid)
        where, params = "wt.user_id = %s::uuid AND wt.source = 'event_refund' AND wt.type = 'credit'", [uid]
        if event_id:
            where += " AND wt.reference_id = %s::uuid"
            params.append(event_id)
        cur.execute(
            f"SELECT {_REFUND_FIELDS} FROM wallet_transactions wt LEFT JOIN events e ON e.id = wt.reference_id "
            f"WHERE {where} ORDER BY wt.created_at DESC LIMIT 30",
            params,
        )
        items = [_shape(cur, dict(r), balance, with_method=bool(event_id)) for r in cur.fetchall()]
        conn.commit()
    return {"balance": balance, "items": items}


@router.post("/refunds/{txn_id}/keep")
def keep_refund(txn_id: str, current_user: dict = Depends(get_current_user)):
    """Keep it in the wallet. It can still be sent back later, while the window is open."""
    with get_db() as (cur, conn):
        cur.execute(
            "UPDATE wallet_transactions SET choice_made_at = COALESCE(choice_made_at, NOW()) "
            "WHERE id = %s::uuid AND user_id = %s::uuid AND source = 'event_refund' RETURNING id",
            (txn_id, current_user["id"]),
        )
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Refund not found")
        conn.commit()
    return {"ok": True}


@router.post("/refunds/{txn_id}/send-back")
def send_refund_back(txn_id: str, current_user: dict = Depends(get_current_user)):
    """Send the card/UPI part of a refund back to the payment it came from."""
    uid = current_user["id"]
    enforce_rate_limit(f"refund:send_back:{uid}", max_events=5, window_seconds=3600, message="Too many tries. Try again in a bit.")
    with get_db() as (cur, conn):
        # Lock the balance and this refund, so a double tap, or a ticket bought
        # at the same moment, can't spend the same money twice.
        cur.execute("SELECT wallet_balance FROM users WHERE id = %s::uuid FOR UPDATE", (uid,))
        balance = (cur.fetchone() or {}).get("wallet_balance") or 0
        cur.execute(
            f"SELECT {_REFUND_FIELDS} FROM wallet_transactions wt LEFT JOIN events e ON e.id = wt.reference_id "
            "WHERE wt.id = %s::uuid AND wt.user_id = %s::uuid AND wt.source = 'event_refund' FOR UPDATE OF wt",
            (txn_id, uid),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Refund not found")
        shaped = _shape(cur, dict(row), balance, with_method=False)
        if shaped["status"] in ("processing", "done"):
            raise HTTPException(status_code=409, detail="This refund is already on its way back")
        amount = shaped["sendable_inr"]
        if amount <= 0:
            if not row["to_source_inr"]:
                detail = "This was paid from your Gorave Wallet, so it stays there"
            elif shaped["window_closed"]:
                detail = "It's too late to send this back to your payment method. Contact support and we'll help."
            else:
                detail = "This money isn't in your wallet any more. It was used for another ticket."
            raise HTTPException(status_code=400, detail=detail)

        # Every database change first, inside this transaction: if any of it
        # fails, Razorpay is never asked and no money moves. Then Razorpay;
        # if that fails, the whole transaction rolls back.
        cur.execute("UPDATE users SET wallet_balance = wallet_balance - %s WHERE id = %s::uuid", (amount, uid))
        cur.execute(
            "INSERT INTO wallet_transactions (user_id, amount_inr, type, source, reference_id, description) "
            "VALUES (%s::uuid, %s, 'debit', 'refund_to_source', %s, %s)",
            (uid, amount, row["event_id"], f"Sent back to your payment method: {row['event_title'] or 'refund'}"),
        )
        cur.execute(
            "UPDATE wallet_transactions SET to_source_status = 'processing', to_source_at = NOW(), "
            "to_source_inr = %s, choice_made_at = COALESCE(choice_made_at, NOW()) WHERE id = %s::uuid",
            (amount, txn_id),
        )
        try:
            from routes.payments import _get_rz
            rf = _get_rz().payment.refund(row["payment_id"], {
                "amount": amount * 100,
                "speed": "normal",
                "notes": {"wallet_txn": txn_id},
                "receipt": f"wt_{txn_id[:30]}",
            })
        except Exception as e:
            conn.rollback()
            log.warning("razorpay refund failed for %s: %s", txn_id, e)
            raise HTTPException(status_code=502, detail="We couldn't start the refund right now. Your money is safe in your wallet. Try again in a few minutes.")
        cur.execute("UPDATE wallet_transactions SET to_source_refund_id = %s WHERE id = %s::uuid", (rf.get("id"), txn_id))
        try:
            conn.commit()
        except Exception:
            # Razorpay has the refund but we couldn't save it: someone must fix the wallet by hand.
            log.error("REFUND SENT BUT NOT SAVED: wallet_txn=%s user=%s amount=%s razorpay_refund=%s", txn_id, uid, amount, rf.get("id"))
            raise
    return {"ok": True, "amount_inr": amount, "refund_id": rf.get("id")}
