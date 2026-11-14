"""The host ID queue: an admin sees each PAN record next to the person's
profile and approves or rejects it. Either way the person gets a push."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from db.config import get_db
from middleware.admin_auth import get_current_admin
from routes.notifications import _insert_notification
from utils.admin_audit import log_action
from utils.push import send_push

router = APIRouter(prefix="/admin/host-verifications", tags=["admin-host-verification"])

AVATAR = "(SELECT p.url FROM user_photos p WHERE p.user_id = u.id ORDER BY p.position LIMIT 1)"


@router.get("")
def list_verifications(
    status: str = Query(default="review", pattern="^(review|verified|rejected|failed)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_admin: dict = Depends(get_current_admin),
):
    with get_db() as (cur, _):
        cur.execute("SELECT COUNT(*)::int AS n FROM host_verifications WHERE status = %s", (status,))
        total = cur.fetchone()["n"]
        cur.execute(
            f"""
            SELECT v.id::text, v.status, v.failure_reason, v.id_masked, v.full_name, v.dob, v.gender, v.state,
                   v.masked_aadhaar, v.aadhaar_linked, v.category, v.matches, v.created_at, v.reviewed_at, v.review_note,
                   a.name AS reviewed_by_name,
                   u.id::text AS user_id, u.name AS profile_name, u.username, u.phone, u.dob AS profile_dob,
                   u.gender AS profile_gender, u.city, u.created_at AS joined_at, {AVATAR} AS avatar,
                   (SELECT COUNT(*) FROM host_verifications x WHERE x.user_id = v.user_id)::int AS attempts
            FROM host_verifications v
            JOIN users u ON u.id = v.user_id
            LEFT JOIN admin_users a ON a.id = v.reviewed_by
            WHERE v.status = %s
            ORDER BY {"v.created_at ASC" if status == "review" else "COALESCE(v.reviewed_at, v.created_at) DESC"}
            LIMIT %s OFFSET %s
            """,
            (status, page_size, (page - 1) * page_size),
        )
        items = cur.fetchall()
    return {"items": items, "total": total, "page": page, "page_size": page_size}


class DecisionBody(BaseModel):
    reason: Optional[str] = None


def _open(cur, verification_id: str) -> dict:
    cur.execute(
        "SELECT v.id::text, v.user_id::text, v.status, v.full_name FROM host_verifications v WHERE v.id = %s::uuid FOR UPDATE",
        (verification_id,),
    )
    v = cur.fetchone()
    if not v:
        raise HTTPException(status_code=404, detail="Not found")
    if v["status"] != "review":
        raise HTTPException(status_code=409, detail="This one has already been decided")
    return v


@router.post("/{verification_id}/approve")
def approve(verification_id: str, body: DecisionBody, current_admin: dict = Depends(get_current_admin)):
    with get_db() as (cur, conn):
        v = _open(cur, verification_id)
        cur.execute(
            "UPDATE host_verifications SET status = 'verified', verified_at = NOW(), reviewed_by = %s::uuid, reviewed_at = NOW(), review_note = %s WHERE id = %s::uuid",
            (current_admin["id"], body.reason, verification_id),
        )
        cur.execute("UPDATE users SET id_verified_at = NOW(), id_verified_name = %s WHERE id = %s::uuid", (v["full_name"], v["user_id"]))
        _insert_notification(
            cur, v["user_id"], "host_verification",
            title="You're verified to host",
            body="Your PAN checks out. Finish setting up and create your first night.",
            entity_type="host_verification", entity_id=v["user_id"],
        )
        conn.commit()
    log_action(current_admin["id"], "approve_host_id", "user", v["user_id"], body.reason)
    try:
        send_push(v["user_id"], "You're verified to host", "Your PAN checks out. Finish setting up and create your first night.", data={"type": "host_verification"})
    except Exception:
        pass
    return {"ok": True}


@router.post("/{verification_id}/reject")
def reject(verification_id: str, body: DecisionBody, current_admin: dict = Depends(get_current_admin)):
    reason = (body.reason or "").strip()
    if not reason:
        raise HTTPException(status_code=400, detail="Say why, so they can fix it")
    with get_db() as (cur, conn):
        v = _open(cur, verification_id)
        # Rejected PANs free up again, so the right person can still use theirs.
        cur.execute(
            "UPDATE host_verifications SET status = 'rejected', reviewed_by = %s::uuid, reviewed_at = NOW(), review_note = %s WHERE id = %s::uuid",
            (current_admin["id"], reason, verification_id),
        )
        _insert_notification(
            cur, v["user_id"], "host_verification",
            title="We couldn't verify your PAN",
            body=f"{reason} You can try again.",
            entity_type="host_verification", entity_id=v["user_id"],
        )
        conn.commit()
    log_action(current_admin["id"], "reject_host_id", "user", v["user_id"], reason)
    try:
        send_push(v["user_id"], "We couldn't verify your PAN", f"{reason} You can try again.", data={"type": "host_verification"})
    except Exception:
        pass
    return {"ok": True}
