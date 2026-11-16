"""Locked-account appeals: the selfie next to their profile photos, why they
were locked, the reports behind it, and their side. Unlock, or keep it locked
(final: they can't appeal again). Either way they get a push."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from db.config import get_db
from middleware.admin_auth import get_current_admin
from utils import album
from utils.admin_audit import log_action
from utils.push import send_push
from utils.twilio_client import send_sms

router = APIRouter(prefix="/admin/appeals", tags=["admin-appeals"])


UNLOCK_SMS = "Your Gorave account is unlocked. Welcome back! Open the app to carry on."


def text_unlocked(user_id: str) -> None:
    """An SMS to the number on the account, on top of the push: they may have
    stopped opening the app while it was locked."""
    try:
        with get_db() as (cur, _):
            cur.execute("SELECT phone, COALESCE(country_code, '+91') AS cc FROM users WHERE id = %s::uuid", (user_id,))
            u = cur.fetchone()
        if u and u["phone"]:
            send_sms(f"{u['cc']}{u['phone']}", UNLOCK_SMS)
    except Exception as e:
        print(f"[unlock sms] {e!r}", flush=True)

REASON_LABEL = {"not_me": "I didn't do this", "someone_else": "Someone else used my account", "sorry": "I understand, it won't happen again"}


@router.get("")
def list_appeals(
    status: str = Query(default="review", pattern="^(review|unlocked|denied)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_admin: dict = Depends(get_current_admin),
):
    with get_db() as (cur, _):
        cur.execute("SELECT COUNT(*)::int AS n FROM account_appeals WHERE status = %s", (status,))
        total = cur.fetchone()["n"]
        cur.execute(
            f"""
            SELECT ap.id::text, ap.status, ap.reason, ap.message, ap.selfie_key, ap.lock_reason, ap.locked_at,
                   ap.created_at, ap.reviewed_at, ap.review_note, rv.name AS reviewed_by_name, lk.name AS locked_by_name,
                   u.id::text AS user_id, u.name, u.username, u.phone, u.city, u.created_at AS joined_at,
                   ARRAY(SELECT p.url FROM user_photos p WHERE p.user_id = u.id ORDER BY p.position LIMIT 6) AS photos,
                   (SELECT COUNT(*) FROM user_reports r WHERE r.reported_id = u.id)::int AS report_count,
                   ARRAY(SELECT r.reason FROM user_reports r WHERE r.reported_id = u.id ORDER BY r.created_at DESC LIMIT 5) AS recent_reports
            FROM account_appeals ap
            JOIN users u ON u.id = ap.user_id
            LEFT JOIN admin_users rv ON rv.id = ap.reviewed_by
            LEFT JOIN admin_users lk ON lk.id = u.locked_by
            WHERE ap.status = %s
            ORDER BY {"ap.created_at ASC" if status == "review" else "ap.reviewed_at DESC NULLS LAST"}
            LIMIT %s OFFSET %s
            """,
            (status, page_size, (page - 1) * page_size),
        )
        rows = cur.fetchall()
    items = []
    for r in rows:
        key = r.pop("selfie_key")
        items.append({**r, "reason_label": REASON_LABEL.get(r["reason"], r["reason"]), "selfie_url": album.signed(key) if key else None})
    return {"items": items, "total": total, "page": page, "page_size": page_size}


class DecisionBody(BaseModel):
    note: Optional[str] = None


def _open(cur, appeal_id: str) -> dict:
    cur.execute("SELECT id::text, user_id::text, status FROM account_appeals WHERE id = %s::uuid FOR UPDATE", (appeal_id,))
    a = cur.fetchone()
    if not a:
        raise HTTPException(status_code=404, detail="Not found")
    if a["status"] != "review":
        raise HTTPException(status_code=409, detail="This appeal has already been decided")
    return a


@router.post("/{appeal_id}/unlock")
def unlock(appeal_id: str, body: DecisionBody, current_admin: dict = Depends(get_current_admin)):
    with get_db() as (cur, conn):
        a = _open(cur, appeal_id)
        cur.execute(
            "UPDATE account_appeals SET status = 'unlocked', reviewed_by = %s::uuid, reviewed_at = NOW(), review_note = %s WHERE id = %s::uuid",
            (current_admin["id"], body.note, appeal_id),
        )
        cur.execute("UPDATE users SET is_locked = FALSE, locked_reason = NULL, locked_at = NULL, locked_by = NULL WHERE id = %s::uuid", (a["user_id"],))
        conn.commit()
    log_action(current_admin["id"], "appeal_unlocked", "user", a["user_id"], body.note)
    try:
        send_push(a["user_id"], "Your account is back", "We reviewed your appeal and unlocked your account. Welcome back.")
    except Exception:
        pass
    text_unlocked(a["user_id"])
    return {"ok": True}


@router.post("/{appeal_id}/deny")
def deny(appeal_id: str, body: DecisionBody, current_admin: dict = Depends(get_current_admin)):
    note = (body.note or "").strip()
    if not note:
        raise HTTPException(status_code=400, detail="Say why. They'll see it.")
    with get_db() as (cur, conn):
        a = _open(cur, appeal_id)
        cur.execute(
            "UPDATE account_appeals SET status = 'denied', reviewed_by = %s::uuid, reviewed_at = NOW(), review_note = %s WHERE id = %s::uuid",
            (current_admin["id"], note, appeal_id),
        )
        conn.commit()
    log_action(current_admin["id"], "appeal_denied", "user", a["user_id"], note)
    try:
        send_push(a["user_id"], "We reviewed your appeal", "Your account stays locked. Open Gorave to see why.")
    except Exception:
        pass
    return {"ok": True}
