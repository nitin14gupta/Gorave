"""Appealing a locked account, from the locked screen in the app.

1. A code by SMS to the number on the account (proves it's the owner).
2. A live selfie, compared by an admin with their profile photos.
3. What happened, in their words.

One appeal per lock. Once an appeal is turned down the decision is final.
These are the only routes a locked account can reach (get_user_even_if_locked).
"""
import io
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from db.config import get_db
from middleware.auth import get_user_even_if_locked
from middleware.rate_limit import enforce_rate_limit
from routes.upload import CHAT_IMAGE_MAX_DIMENSION, MAX_PHOTO_SIZE, RAW_IMAGE_UPLOAD_CAP, _is_image, _read_capped
from utils import chat_realtime as rt
from utils.face_detect import has_face
from utils.image_utils import ImageConversionError, convert_to_webp
from jose import JWTError, jwt
from utils.jwt import ALGORITHM, SECRET_KEY
from utils.r2_client import r2_client
from utils.twilio_client import send_otp, verify_otp

router = APIRouter(prefix="/account-appeal", tags=["account-appeal"])

CODE_PASS_MINUTES = 30
REASONS = {"not_me", "someone_else", "sorry"}


def _state(cur, uid: str) -> dict:
    cur.execute("SELECT COALESCE(is_locked, FALSE) AS locked, locked_reason, locked_at, phone FROM users WHERE id = %s::uuid", (uid,))
    u = cur.fetchone()
    cur.execute(
        "SELECT status, created_at, reviewed_at, review_note, locked_at FROM account_appeals WHERE user_id = %s::uuid ORDER BY created_at DESC",
        (uid,),
    )
    appeals = cur.fetchall()
    this_lock = next((a for a in appeals if a["locked_at"] == u["locked_at"]), None)
    final = any(a["status"] == "denied" for a in appeals)
    return {
        "locked": u["locked"],
        "reason": u["locked_reason"],
        "locked_at": u["locked_at"].isoformat() if u["locked_at"] else None,
        # Last two digits only, for "we sent a code to +91 •••••• 09".
        "phone_hint": (u["phone"] or "")[-2:],
        "appeal": {
            "status": this_lock["status"],
            "submitted_at": this_lock["created_at"].isoformat(),
            "note": this_lock["review_note"] if this_lock["status"] == "denied" else None,
        } if this_lock else None,
        "can_appeal": bool(u["locked"]) and not final and this_lock is None,
        "final": final,
    }


@router.get("")
def get_appeal(current_user: dict = Depends(get_user_even_if_locked)):
    with get_db() as (cur, _):
        return _state(cur, current_user["id"])


def _full_phone(uid: str) -> str:
    with get_db() as (cur, _):
        cur.execute("SELECT phone, COALESCE(country_code, '+91') AS cc FROM users WHERE id = %s::uuid", (uid,))
        u = cur.fetchone()
    return f"{u['cc']}{u['phone']}"


def _require_can_appeal(uid: str) -> dict:
    with get_db() as (cur, _):
        st = _state(cur, uid)
    if not st["can_appeal"]:
        raise HTTPException(status_code=409, detail="This account can't be appealed")
    return st


@router.post("/code")
def send_code(current_user: dict = Depends(get_user_even_if_locked)):
    """A code by SMS to the number on the account."""
    uid = current_user["id"]
    _require_can_appeal(uid)
    enforce_rate_limit(f"appeal:code:{uid}", max_events=5, window_seconds=3600, message="Too many codes. Try again in an hour.")
    if not send_otp(_full_phone(uid)):
        raise HTTPException(status_code=502, detail="We couldn't send the code. Try again.")
    return {"ok": True}


class CodeBody(BaseModel):
    code: str


@router.post("/code/verify")
def verify_code(body: CodeBody, current_user: dict = Depends(get_user_even_if_locked)):
    """A right code gives a short pass for this appeal, nothing else."""
    uid = current_user["id"]
    _require_can_appeal(uid)
    enforce_rate_limit(f"appeal:verify:{uid}", max_events=8, window_seconds=900, message="Too many tries. Try again in 15 minutes.")
    if not verify_otp(_full_phone(uid), body.code.strip()):
        raise HTTPException(status_code=400, detail="That code isn't right")
    token = jwt.encode(
        {"sub": uid, "type": "appeal", "exp": datetime.now(timezone.utc) + timedelta(minutes=CODE_PASS_MINUTES)},
        SECRET_KEY, algorithm=ALGORITHM,
    )
    return {"pass": token}


def _check_pass(token: str, uid: str) -> None:
    try:
        data = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Your code has expired. Start again.")
    if data.get("type") != "appeal" or data.get("sub") != uid:
        raise HTTPException(status_code=401, detail="Your code has expired. Start again.")


@router.post("/selfie")
async def upload_selfie(
    file: UploadFile = File(...),
    code_pass: str = Form(...),
    current_user: dict = Depends(get_user_even_if_locked),
):
    """The live selfie, into the private bucket. Only admins ever see it."""
    uid = current_user["id"]
    _check_pass(code_pass, uid)
    _require_can_appeal(uid)
    if not rt.chat_media_private():
        raise HTTPException(status_code=503, detail="Appeals aren't available right now. Email us instead.")
    enforce_rate_limit(f"appeal:selfie:{uid}", max_events=10, window_seconds=3600, message="Too many photos. Try again later.")
    if not _is_image(file):
        raise HTTPException(status_code=400, detail="That isn't a photo")
    contents = await _read_capped(file, RAW_IMAGE_UPLOAD_CAP, "That photo is too large")
    # Same check as a first profile photo: there has to be a face in it.
    if not has_face(contents):
        raise HTTPException(status_code=400, detail="We couldn't see your face. Try again in good light, looking at the camera.")
    try:
        webp = convert_to_webp(contents, max_dimension=CHAT_IMAGE_MAX_DIMENSION)
    except ImageConversionError:
        raise HTTPException(status_code=400, detail="We couldn't read that photo")
    if len(webp) > MAX_PHOTO_SIZE:
        raise HTTPException(status_code=400, detail="That photo is too large")
    stored = r2_client.upload_file(io.BytesIO(webp), "selfie.webp", folder=f"appeals/{uid}", bucket=rt.CHAT_BUCKET)
    return {"key": stored["path"]}


class AppealBody(BaseModel):
    code_pass: str
    selfie_key: str
    reason: str
    message: str


@router.post("")
def submit_appeal(body: AppealBody, current_user: dict = Depends(get_user_even_if_locked)):
    uid = current_user["id"]
    _check_pass(body.code_pass, uid)
    st = _require_can_appeal(uid)
    if body.reason not in REASONS:
        raise HTTPException(status_code=400, detail="Pick what happened")
    message = body.message.strip()
    if len(message) < 10:
        raise HTTPException(status_code=400, detail="Tell us a little more")
    # Only a selfie this person uploaded for their own appeal.
    if not body.selfie_key.startswith(f"appeals/{uid}/"):
        raise HTTPException(status_code=400, detail="Take your selfie again")
    with get_db() as (cur, conn):
        cur.execute(
            """
            INSERT INTO account_appeals (user_id, lock_reason, locked_at, reason, message, selfie_key)
            VALUES (%s::uuid, %s, %s, %s, %s, %s)
            ON CONFLICT (user_id, locked_at) DO NOTHING
            RETURNING id
            """,
            (uid, st["reason"], st["locked_at"], body.reason, message[:2000], body.selfie_key),
        )
        if not cur.fetchone():
            raise HTTPException(status_code=409, detail="You've already appealed this")
        conn.commit()
        return _state(cur, uid)
