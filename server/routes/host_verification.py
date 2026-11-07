"""Host ID check. See utils/kyc.py for how DigiLocker fits in.

The app opens the DigiLocker link, then asks us to check whenever the host
comes back to it. Nothing here trusts the app: we read the result from the
provider ourselves.
"""
import html, uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse

from db.config import get_db
from middleware.auth import get_current_user
from middleware.rate_limit import enforce_rate_limit
from utils import kyc

router = APIRouter(prefix="/host-verification", tags=["host-verification"])

FAILURE_TEXT = {
    "underage": "You need to be 18 or older to host on Gorave.",
    "already_used": "This Aadhaar is already verified on another Gorave account.",
    "not_linked": "We couldn't find an Aadhaar in your DigiLocker.",
    "unreadable": "We couldn't read your details from DigiLocker. Try again.",
}


def _state(cur, uid: str) -> dict:
    cur.execute("SELECT id_verified_at, id_verified_name FROM users WHERE id = %s::uuid", (uid,))
    user = cur.fetchone()
    cur.execute(
        "SELECT status, failure_reason, created_at FROM host_verifications WHERE user_id = %s::uuid ORDER BY created_at DESC LIMIT 1",
        (uid,),
    )
    last = cur.fetchone()
    if user and user["id_verified_at"]:
        status = "verified"
    elif not last:
        status = "none"
    else:
        status = last["status"]
    return {
        "status": status,
        "verified_name": user["id_verified_name"] if user else None,
        "verified_at": user["id_verified_at"].isoformat() if user and user["id_verified_at"] else None,
        "message": FAILURE_TEXT.get(last["failure_reason"]) if last and status == "failed" else None,
        "available": kyc.provider() is not None,
    }


@router.get("")
def get_verification(current_user: dict = Depends(get_current_user)):
    with get_db() as (cur, _):
        return _state(cur, current_user["id"])


@router.post("/start")
def start_verification(current_user: dict = Depends(get_current_user)):
    """A fresh DigiLocker link. Each one costs money, so they're limited."""
    uid = current_user["id"]
    which = kyc.provider()
    if not which:
        raise HTTPException(status_code=503, detail="ID verification isn't available right now. Try again soon.")
    with get_db() as (cur, _):
        if _state(cur, uid)["status"] == "verified":
            raise HTTPException(status_code=409, detail="You're already verified")
    enforce_rate_limit(f"kyc:start:{uid}", max_events=5, window_seconds=86400,
                       message="Too many tries today. Try again tomorrow.")
    verification_id = f"gv_{uuid.uuid4().hex[:24]}"
    if which == "cashfree":
        try:
            link = kyc.create_link(verification_id)
        except kyc.KycError as e:
            print(f"[KYC] {e}", flush=True)
            raise HTTPException(status_code=502, detail="DigiLocker isn't responding. Try again in a minute.")
    else:
        link = {"url": f"/host-verification/mock/{verification_id}", "reference_id": None}
    with get_db() as (cur, conn):
        cur.execute(
            "INSERT INTO host_verifications (user_id, provider, verification_id, reference_id) VALUES (%s::uuid, %s, %s, %s)",
            (uid, which, verification_id, link["reference_id"]),
        )
        conn.commit()
    return {"url": link["url"], "verification_id": verification_id}


def _mock_document(cur, uid: str, row: dict) -> dict:
    cur.execute("SELECT name, dob, gender FROM users WHERE id = %s::uuid", (uid,))
    u = cur.fetchone()
    dob = u["dob"]
    return {
        "status": "SUCCESS",
        "name": u["name"] or "Test Host",
        "dob": dob.strftime("%d-%m-%Y") if dob else "01-01-1995",
        "gender": (u["gender"] or "")[:1].upper() or None,
        "uid": "xxxxxxxx" + uid.replace("-", "")[-4:].translate(str.maketrans("abcdef", "123456")),
    }


@router.post("/check")
def check_verification(current_user: dict = Depends(get_current_user)):
    """Called when the host comes back from DigiLocker. Safe to call any number of times."""
    uid = current_user["id"]
    with get_db() as (cur, conn):
        cur.execute(
            "SELECT * FROM host_verifications WHERE user_id = %s::uuid AND status = 'pending' ORDER BY created_at DESC LIMIT 1",
            (uid,),
        )
        row = cur.fetchone()
        if not row:
            return _state(cur, uid)

        try:
            if row["provider"] == "cashfree":
                status = kyc.fetch_status(row["verification_id"])
            else:
                status = row["mock_status"] or "PENDING"
        except kyc.KycError as e:
            print(f"[KYC] {e}", flush=True)
            raise HTTPException(status_code=502, detail="DigiLocker isn't responding. Try again in a minute.")

        if status in ("EXPIRED", "CONSENT_DENIED"):
            cur.execute("UPDATE host_verifications SET status = %s WHERE id = %s", ("expired" if status == "EXPIRED" else "denied", row["id"]))
            conn.commit()
            return _state(cur, uid)
        if status != "AUTHENTICATED":
            return _state(cur, uid)

        try:
            doc = kyc.fetch_aadhaar(row["verification_id"]) if row["provider"] == "cashfree" else _mock_document(cur, uid, row)
        except kyc.KycError as e:
            print(f"[KYC] {e}", flush=True)
            raise HTTPException(status_code=502, detail="DigiLocker isn't responding. Try again in a minute.")
        if doc is None:
            return _state(cur, uid)  # still being prepared, the app checks again

        def fail(reason: str):
            cur.execute("UPDATE host_verifications SET status = 'failed', failure_reason = %s WHERE id = %s", (reason, row["id"]))
            conn.commit()
            return _state(cur, uid)

        if (doc.get("status") or "SUCCESS").upper() != "SUCCESS":
            return fail("not_linked")
        name = (doc.get("name") or "").strip()
        dob = kyc.parse_dob(doc.get("dob"), doc.get("year_of_birth"))
        digits = kyc.last4(doc.get("uid"))
        if not name or not dob or len(digits) != 4:
            return fail("unreadable")
        if kyc.age_on(dob) < kyc.MIN_AGE:
            return fail("underage")
        identity = kyc.identity_hash(name, dob, digits)
        cur.execute(
            "SELECT 1 FROM host_verifications WHERE identity_hash = %s AND status = 'verified' AND user_id <> %s::uuid",
            (identity, uid),
        )
        if cur.fetchone():
            return fail("already_used")

        now = datetime.now(timezone.utc)
        cur.execute(
            """
            UPDATE host_verifications SET status = 'verified', aadhaar_name = %s, birth_year = %s, gender = %s,
                aadhaar_last4 = %s, identity_hash = %s, verified_at = %s
            WHERE id = %s
            """,
            (name, dob.year, doc.get("gender"), digits, identity, now, row["id"]),
        )
        cur.execute("UPDATE users SET id_verified_at = %s, id_verified_name = %s WHERE id = %s::uuid", (now, name, uid))
        conn.commit()
        return _state(cur, uid)


# ── Local testing only (KYC_MOCK=true): a stand-in for the DigiLocker page ──

_MOCK_PAGE = """<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Test DigiLocker</title><style>
body{{font-family:system-ui,sans-serif;background:#f5efe3;color:#111;margin:0;padding:32px 20px}}
h1{{font-size:22px;margin:0 0 6px}}p{{color:#555;margin:0 0 24px;line-height:1.4}}
button{{display:block;width:100%;height:52px;border-radius:26px;border:0;font-size:16px;font-weight:600;margin-bottom:12px}}
.ok{{background:#111;color:#fff}}.no{{background:transparent;border:1.5px solid #bbb;color:#111}}</style></head>
<body><h1>Test DigiLocker</h1><p>Local testing only. Real hosts sign in to DigiLocker with their Aadhaar OTP here.</p>
<form method="post" action="{base}/approve"><button class="ok">Share my Aadhaar</button></form>
<form method="post" action="{base}/deny"><button class="no">Deny</button></form></body></html>"""

def _mock_row(verification_id: str) -> dict:
    if kyc.provider() != "mock":
        raise HTTPException(status_code=404, detail="Not found")
    with get_db() as (cur, _):
        cur.execute("SELECT id FROM host_verifications WHERE verification_id = %s AND provider = 'mock' AND status = 'pending'", (verification_id,))
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="This link has expired")
    return row


@router.get("/mock/{verification_id}", response_class=HTMLResponse, include_in_schema=False)
def mock_page(verification_id: str):
    _mock_row(verification_id)
    return _MOCK_PAGE.format(base=f"/host-verification/mock/{html.escape(verification_id)}")


@router.post("/mock/{verification_id}/{choice}", include_in_schema=False)
def mock_choice(verification_id: str, choice: str):
    row = _mock_row(verification_id)
    status: Optional[str] = {"approve": "AUTHENTICATED", "deny": "CONSENT_DENIED"}.get(choice)
    if not status:
        raise HTTPException(status_code=404, detail="Not found")
    with get_db() as (cur, conn):
        cur.execute("UPDATE host_verifications SET mock_status = %s WHERE id = %s", (status, row["id"]))
        conn.commit()
    # Like DigiLocker: back to the return link, which closes the in-app browser.
    return RedirectResponse(f"{kyc.REDIRECT_URL}?verification_id={verification_id}", status_code=303)
