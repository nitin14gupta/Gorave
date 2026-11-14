"""Host ID check by PAN. See utils/kyc.py.

The host types their PAN. Anything clearly wrong (no such PAN, not a person,
under 18, already used on another account) fails straight away. Everything
else waits for an admin (routes/admin_host_verification.py), who sees the PAN
record next to the profile and approves or rejects it.
"""
import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from db.config import get_db
from middleware.auth import get_current_user
from middleware.rate_limit import enforce_rate_limit
from psycopg2.extras import Json
from utils import kyc

router = APIRouter(prefix="/host-verification", tags=["host-verification"])

# Everyone gets two tries. A PAN that doesn't exist, one that's already used,
# or one our team rejects all count. After that, they talk to support.
MAX_TRIES = 2

FAILURE_TEXT = {
    "invalid_pan": "The PAN you entered doesn't exist. Check for a typing mistake and try again.",
    "not_person": "That PAN belongs to a business. Use your personal PAN.",
    "underage": "You need to be 18 or older to host on Gorave.",
    "already_used": "This PAN is already used by another Gorave account.",
    "unreadable": "We couldn't read the details on that PAN. Try again.",
}


def state(cur, uid: str) -> dict:
    cur.execute("SELECT id_verified_at, id_verified_name FROM users WHERE id = %s::uuid", (uid,))
    user = cur.fetchone()
    cur.execute(
        """
        SELECT status, failure_reason, review_note, id_masked, created_at, reviewed_at
        FROM host_verifications WHERE user_id = %s::uuid ORDER BY created_at DESC LIMIT 1
        """,
        (uid,),
    )
    last = cur.fetchone()
    cur.execute("SELECT COUNT(*)::int AS n FROM host_verifications WHERE user_id = %s::uuid AND status IN ('failed', 'rejected')", (uid,))
    misses = cur.fetchone()["n"]
    if user and user["id_verified_at"]:
        status = "verified"
    elif not last or last["status"] not in ("review", "rejected", "failed"):
        status = "none"
    else:
        status = last["status"]
    message = None
    if status == "failed":
        message = FAILURE_TEXT.get(last["failure_reason"])
    elif status == "rejected":
        message = last["review_note"]
    return {
        "status": status,
        "verified_name": user["id_verified_name"] if user else None,
        "verified_at": user["id_verified_at"].isoformat() if user and user["id_verified_at"] else None,
        "pan_masked": last["id_masked"] if last else None,
        "submitted_at": last["created_at"].isoformat() if last else None,
        "message": message,
        # Tries left out of two. 0: talk to support.
        "tries_left": max(0, MAX_TRIES - misses),
        "available": kyc.available(),
    }


@router.get("")
def get_verification(current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, _):
        return state(cur, current_user["id"])


class PanBody(BaseModel):
    pan: str
    # They agreed to us checking their PAN with the Income Tax records.
    consent: bool


@router.post("/pan")
def submit_pan(body: PanBody, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    pan = body.pan.strip().upper()
    if not body.consent:
        raise HTTPException(status_code=400, detail="Agree to the PAN check to continue")
    if not kyc.PAN_RE.match(pan):
        raise HTTPException(status_code=400, detail="A PAN looks like ABCDE1234F")
    if not kyc.available():
        raise HTTPException(status_code=503, detail="ID checks aren't available right now. Try again soon.")
    with get_db() as (cur, _):
        now = state(cur, uid)
    if now["status"] == "verified":
        raise HTTPException(status_code=409, detail="You're already verified")
    if now["status"] == "review":
        raise HTTPException(status_code=409, detail="We're already checking your PAN")
    if now["tries_left"] == 0:
        raise HTTPException(status_code=403, detail="You've used both tries. Contact support and we'll sort it out.")
    # Each lookup costs money.
    enforce_rate_limit(f"kyc:pan:{uid}", max_events=5, window_seconds=86400, message="Too many tries today. Try again tomorrow.")

    try:
        record = kyc.lookup_pan(pan)
    except kyc.KycError as e:
        print(f"[KYC] {e}", flush=True)
        raise HTTPException(status_code=502, detail="The PAN check isn't responding. Try again in a minute.")

    with get_db() as (cur, conn):
        cur.execute("SELECT name, dob, gender FROM users WHERE id = %s::uuid", (uid,))
        profile = cur.fetchone()

        def save(status: str, reason=None, **fields):
            cur.execute(
                """
                INSERT INTO host_verifications (user_id, provider, verification_id, status, failure_reason, id_type, id_masked,
                    identity_hash, full_name, dob, gender, state, masked_aadhaar, aadhaar_linked, category, matches)
                VALUES (%(uid)s, 'surepass', %(vid)s, %(status)s, %(reason)s, 'pan', %(masked)s, %(hash)s, %(name)s, %(dob)s,
                    %(gender)s, %(state)s, %(aadhaar)s, %(linked)s, %(category)s, %(matches)s)
                """,
                {
                    "uid": uid, "vid": fields.get("client_id") or f"pan_{uuid.uuid4().hex}",
                    "status": status, "reason": reason, "masked": kyc.mask_pan(pan),
                    "hash": kyc.pan_hash(pan) if status == "review" else None,
                    "name": fields.get("name"), "dob": fields.get("dob"), "gender": fields.get("gender"),
                    "state": fields.get("state"), "aadhaar": fields.get("aadhaar"), "linked": fields.get("linked"),
                    "category": fields.get("category"), "matches": Json(fields["matches"]) if fields.get("matches") else None,
                },
            )
            conn.commit()
            return state(cur, uid)

        if record is None:
            return save("failed", "invalid_pan")
        name = (record.get("full_name") or "").strip()
        try:
            dob = date.fromisoformat(record["dob"]) if record.get("dob") else None
        except ValueError:
            dob = None
        fields = {
            "client_id": record.get("client_id"), "name": name or None, "dob": dob, "gender": record.get("gender"),
            "state": ((record.get("address") or {}).get("state") or None), "aadhaar": record.get("masked_aadhaar"),
            "linked": record.get("aadhaar_linked"), "category": record.get("category"),
        }
        if (record.get("category") or "person").lower() != "person":
            return save("failed", "not_person", **fields)
        if not name:
            return save("failed", "unreadable", **fields)
        if dob and kyc.age_on(dob) < kyc.MIN_AGE:
            return save("failed", "underage", **fields)
        cur.execute(
            "SELECT 1 FROM host_verifications WHERE identity_hash = %s AND status IN ('review', 'verified') AND user_id <> %s::uuid",
            (kyc.pan_hash(pan), uid),
        )
        if cur.fetchone():
            return save("failed", "already_used", **fields)
        fields["matches"] = kyc.compare(profile or {}, record, dob)
        return save("review", **fields)
