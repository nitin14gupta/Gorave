"""GET /recap?month=YYYY-MM: "Your month on Gorave" for the signed-in person.
Defaults to last month. See utils/recap.py for what goes on the card."""
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException

from db.config import get_db
from middleware.auth import get_current_user
from utils.recap import build_recap, parse_month, previous_month

router = APIRouter(prefix="/recap", tags=["recap"])


@router.get("")
def get_recap(month: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    latest = previous_month()
    month = month or latest
    bounds = parse_month(month)
    # Only finished months, and only the last year.
    if not bounds or month > latest or bounds[2].year < datetime.now(timezone.utc).year - 1:
        raise HTTPException(status_code=404, detail={"code": "NO_RECAP", "message": "No recap for that month"})
    with get_db() as (cur, _):
        recap = build_recap(cur, current_user["id"], month)
    if not recap:
        raise HTTPException(status_code=404, detail={"code": "NO_RECAP", "message": "No recap for that month"})
    return recap
