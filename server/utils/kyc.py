"""Government ID check for hosts, through DigiLocker.

Cashfree Secure ID does the DigiLocker part: we ask for a link, the host signs
in to DigiLocker with their Aadhaar OTP and agrees to share it, then we read
back the verified name and date of birth. We keep only what we need: the name,
birth year, gender and the last 4 digits. No address, no photo, no full number.

Set CASHFREE_KYC_CLIENT_ID and CASHFREE_KYC_CLIENT_SECRET to switch it on.
For local testing without keys, KYC_MOCK=true serves a fake DigiLocker page.
"""
import hashlib, hmac, os
from datetime import date, datetime
from typing import Optional

import httpx

CLIENT_ID = os.getenv("CASHFREE_KYC_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("CASHFREE_KYC_CLIENT_SECRET", "")
BASE_URL = (
    "https://api.cashfree.com/verification"
    if os.getenv("CASHFREE_KYC_ENV", "sandbox").lower() == "production"
    else "https://sandbox.cashfree.com/verification"
)
# Only sent if set; Cashfree's DigiLocker reference doesn't list one.
API_VERSION = os.getenv("CASHFREE_KYC_API_VERSION", "")
# Where DigiLocker sends the host back. An app link, so it reopens Gorave.
REDIRECT_URL = os.getenv("KYC_REDIRECT_URL", "https://link.gorave.in/verified")
MOCK = os.getenv("KYC_MOCK", "false").lower() == "true"
MIN_AGE = 18

_SALT = (os.getenv("KYC_HASH_SALT") or os.getenv("JWT_SECRET_KEY") or "").encode()


def provider() -> Optional[str]:
    if CLIENT_ID and CLIENT_SECRET:
        return "cashfree"
    return "mock" if MOCK else None


class KycError(Exception):
    pass


def _headers() -> dict:
    h = {"x-client-id": CLIENT_ID, "x-client-secret": CLIENT_SECRET, "Content-Type": "application/json"}
    if API_VERSION:
        h["x-api-version"] = API_VERSION
    return h


def create_link(verification_id: str) -> dict:
    """A DigiLocker link for this host. It works for 10 minutes."""
    try:
        r = httpx.post(
            f"{BASE_URL}/digilocker",
            json={
                "verification_id": verification_id,
                "document_requested": ["AADHAAR"],
                "redirect_url": REDIRECT_URL,
                "user_flow": "signup",
                "purpose": "Host verification",
                "company_name": "Gorave",
            },
            headers=_headers(),
            timeout=20,
        )
    except httpx.HTTPError as e:
        raise KycError(f"DigiLocker didn't answer: {e!r}")
    if r.status_code >= 400:
        raise KycError(f"DigiLocker link failed ({r.status_code}): {r.text[:300]}")
    body = r.json()
    return {"url": body.get("url"), "reference_id": body.get("reference_id")}


def fetch_status(verification_id: str) -> str:
    """PENDING, AUTHENTICATED, EXPIRED or CONSENT_DENIED."""
    try:
        r = httpx.get(f"{BASE_URL}/digilocker", params={"verification_id": verification_id}, headers=_headers(), timeout=20)
    except httpx.HTTPError as e:
        raise KycError(f"DigiLocker didn't answer: {e!r}")
    if r.status_code >= 400:
        raise KycError(f"DigiLocker status failed ({r.status_code}): {r.text[:300]}")
    return (r.json().get("status") or "PENDING").upper()


def fetch_aadhaar(verification_id: str) -> Optional[dict]:
    """The shared Aadhaar, or None while Cashfree is still preparing it."""
    try:
        r = httpx.get(f"{BASE_URL}/digilocker/document/AADHAAR", params={"verification_id": verification_id}, headers=_headers(), timeout=30)
    except httpx.HTTPError as e:
        raise KycError(f"DigiLocker didn't answer: {e!r}")
    if r.status_code == 202:
        return None
    if r.status_code >= 400:
        raise KycError(f"Aadhaar fetch failed ({r.status_code}): {r.text[:300]}")
    return r.json()


def parse_dob(raw: Optional[str], year: Optional[int] = None) -> Optional[date]:
    for fmt in ("%d-%m-%Y", "%Y-%m-%d", "%d/%m/%Y"):
        try:
            return datetime.strptime((raw or "").strip(), fmt).date()
        except ValueError:
            continue
    return date(int(year), 7, 1) if year else None


def age_on(dob: date, today: Optional[date] = None) -> int:
    today = today or date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


def identity_hash(name: str, dob: date, last4: str) -> str:
    """Lets us spot one ID being used for a second account, without keeping the ID."""
    key = f"{' '.join(name.lower().split())}|{dob.isoformat()}|{last4}".encode()
    return hmac.new(_SALT, key, hashlib.sha256).hexdigest()


def last4(uid: Optional[str]) -> str:
    digits = "".join(ch for ch in (uid or "") if ch.isdigit())
    return digits[-4:]
