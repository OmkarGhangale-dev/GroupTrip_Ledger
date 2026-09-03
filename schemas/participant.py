import datetime
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from models.participant import ParticipantRole, ParticipantStatus


# ── Base ──────────────────────────────────────────────────────────────────────

class ParticipantBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    email: EmailStr
    role: ParticipantRole = ParticipantRole.MEMBER
    status: ParticipantStatus = ParticipantStatus.ACTIVE


# ── Create ────────────────────────────────────────────────────────────────────

class ParticipantCreate(ParticipantBase):
    trip_id: str


# ── Update ────────────────────────────────────────────────────────────────────

class ParticipantUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    email: Optional[EmailStr] = None
    role: Optional[ParticipantRole] = None
    status: Optional[ParticipantStatus] = None


# ── Read ──────────────────────────────────────────────────────────────────────

class ParticipantRead(ParticipantBase):
    id: str
    trip_id: str
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = {"from_attributes": True}
