from pydantic import BaseModel, field_validator
from typing import Optional


class EmergencyContactCreate(BaseModel):
    name: str
    phone: str
    emoji: Optional[str] = None
    source: str = "manual"

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 1:
            raise ValueError("Name is required")
        if len(v) > 100:
            raise ValueError("Name must be under 100 characters")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 6:
            raise ValueError("Enter a valid phone number")
        if len(v) > 20:
            raise ValueError("Phone number is too long")
        return v

    @field_validator("source")
    @classmethod
    def validate_source(cls, v: str) -> str:
        if v not in ("manual", "device"):
            raise ValueError("source must be 'manual' or 'device'")
        return v


class EmergencyContactResponse(BaseModel):
    id: str
    name: str
    phone: str
    emoji: Optional[str] = None
    source: str
    created_at: Optional[str] = None


class SosRequest(BaseModel):
    event_id: Optional[str] = None
    # Missing when location is off or no fix yet: the SOS still goes out, without a map link.
    lat: Optional[float] = None
    lng: Optional[float] = None


class SosContact(BaseModel):
    name: str
    phone: str


class SosResponse(BaseModel):
    ok: bool
    # Contacts the SMS actually reached (Twilio accepted it), out of `total`.
    alerted: int
    total: int
    # The ones it didn't reach, so the app can offer to text them from the phone.
    unsent: list[SosContact] = []
    # The message that was sent, for that same fallback.
    message: str
