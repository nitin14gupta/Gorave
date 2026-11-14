"""Host ID check: PAN, through Surepass.

The host types their PAN; Surepass returns what the Income Tax records say.
We compare that with their profile and an admin makes the call. We keep the
PAN masked (last 4 only) plus a one-way hash, never the full number, and
nothing of the address beyond the state.

Set SUREPASS_TOKEN and SUREPASS_BASE_URL (https://sandbox.surepass.app for
testing, the live base URL from the Surepass dashboard for production).
"""
import hashlib, hmac, os, re
from datetime import date
from typing import Optional

import httpx

TOKEN = os.getenv("SUREPASS_TOKEN", "")
BASE_URL = os.getenv("SUREPASS_BASE_URL", "").rstrip("/")
MIN_AGE = 18
PAN_RE = re.compile(r"^[A-Z]{5}[0-9]{4}[A-Z]$")

_SALT = (os.getenv("KYC_HASH_SALT") or os.getenv("JWT_SECRET_KEY") or "").encode()


def available() -> bool:
    return bool(TOKEN and BASE_URL)


class KycError(Exception):
    """Surepass didn't answer properly. Not the host's fault."""


def lookup_pan(pan: str) -> Optional[dict]:
    """What the Income Tax records say about this PAN, or None if there's no such PAN."""
    try:
        r = httpx.post(
            f"{BASE_URL}/api/v1/pan/pan-comprehensive",
            json={"id_number": pan},
            headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"},
            timeout=30,
        )
    except httpx.HTTPError as e:
        raise KycError(f"Surepass didn't answer: {e!r}")
    try:
        body = r.json()
    except ValueError:
        raise KycError(f"Surepass answered {r.status_code} without JSON: {r.text[:200]}")
    data = body.get("data") or {}
    if r.status_code == 422 or (data.get("status") or "").lower() == "invalid":
        return None
    if r.status_code >= 400 or not body.get("success"):
        raise KycError(f"Surepass error {r.status_code}: {body.get('message')}")
    return data


def mask_pan(pan: str) -> str:
    return "XXXXXX" + pan[-4:]


def pan_hash(pan: str) -> str:
    return hmac.new(_SALT, pan.upper().encode(), hashlib.sha256).hexdigest()


def age_on(dob: date, today: Optional[date] = None) -> int:
    today = today or date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


def _tokens(name: Optional[str]) -> list[str]:
    return [t for t in re.sub(r"[^a-z ]", " ", (name or "").lower()).split() if len(t) > 1]


def compare(profile: dict, pan: dict, pan_dob: Optional[date]) -> dict:
    """How the PAN record lines up with their Gorave profile, for the admin to see."""
    mine, theirs = _tokens(profile.get("name")), set(_tokens(pan.get("full_name")))
    if not mine or not theirs:
        name = "unknown"
    elif all(t in theirs for t in mine):
        name = "match"
    elif mine[0] in theirs:
        name = "partial"  # first name agrees, the rest doesn't
    else:
        name = "mismatch"
    p_dob = profile.get("dob")
    dob = "unknown" if not (p_dob and pan_dob) else "match" if p_dob == pan_dob else "mismatch"
    p_g, t_g = (profile.get("gender") or "")[:1].upper(), (pan.get("gender") or "")[:1].upper()
    gender = "unknown" if not (p_g and t_g) else "match" if p_g == t_g else "mismatch"
    return {"name": name, "dob": dob, "gender": gender}
