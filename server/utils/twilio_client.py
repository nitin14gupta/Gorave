import os
from typing import Optional

from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

_account_sid = os.getenv("TWILIO_ACCOUNT_SID")
_auth_token = os.getenv("TWILIO_AUTH_TOKEN")
_verify_sid = os.getenv("TWILIO_VERIFY_SERVICE_SID")
_sms_from = os.getenv("TWILIO_PHONE_NUMBER") or os.getenv("TWILIO_MESSAGING_SERVICE_SID")

# Android reads the OTP SMS by itself when the SMS ends with the app's
# 11-character code. If SMS in India turn out to arrive without it, set
# OTP_APP_HASH=false: phones then fall back to a one-tap "Allow" prompt.
OTP_APP_HASH = os.getenv("OTP_APP_HASH", "true").lower() != "false"

_client = Client(_account_sid, _auth_token)


def send_otp(phone: str, app_hash: Optional[str] = None) -> bool:
    """Send OTP via Twilio Verify. Returns True on success."""
    extra = {"app_hash": app_hash} if app_hash and OTP_APP_HASH else {}
    verification = _client.verify.v2.services(_verify_sid).verifications.create(
        to=phone,
        channel="sms",
        **extra,
    )
    return verification.status == "pending"


def verify_otp(phone: str, code: str) -> bool:
    """Check OTP code via Twilio Verify. Returns True if approved."""
    check = _client.verify.v2.services(_verify_sid).verification_checks.create(
        to=phone,
        code=code,
    )
    return check.status == "approved"


def send_sms(to: str, body: str) -> bool:
    """Send a plain SMS (SOS alerts, etc — anything outside the OTP Verify flow). Returns True on success."""
    # No sender number set up yet (only the Verify service, for OTP): log instead.
    if not _sms_from:
        print(f"[SMS NOT SENT, no sender configured] to={to} body={body!r}")
        return True
    message = _client.messages.create(body=body, from_=_sms_from, to=to)
    return message.sid is not None
