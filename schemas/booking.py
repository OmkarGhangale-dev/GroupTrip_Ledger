import datetime
from pydantic import BaseModel, Field
from typing import Optional
from models.booking import BookingType, BookingStatus


# ── Base ──────────────────────────────────────────────────────────────────────

class BookingBase(BaseModel):
    booking_type: BookingType
    provider: Optional[str] = Field(default=None, max_length=200)
    description: Optional[str] = None
    amount: float = Field(..., gt=0)
    status: BookingStatus = BookingStatus.CONFIRMED
    cancellation_policy: Optional[str] = None
    reference_number: Optional[str] = Field(default=None, max_length=100)


# ── Create ────────────────────────────────────────────────────────────────────

class BookingCreate(BookingBase):
    trip_id: str
    participant_id: Optional[str] = None


# ── Update ────────────────────────────────────────────────────────────────────

class BookingUpdate(BaseModel):
    booking_type: Optional[BookingType] = None
    provider: Optional[str] = Field(default=None, max_length=200)
    description: Optional[str] = None
    amount: Optional[float] = Field(default=None, gt=0)
    status: Optional[BookingStatus] = None
    cancellation_policy: Optional[str] = None
    reference_number: Optional[str] = Field(default=None, max_length=100)
    participant_id: Optional[str] = None


# ── Read ──────────────────────────────────────────────────────────────────────

class BookingRead(BookingBase):
    id: str
    trip_id: str
    participant_id: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = {"from_attributes": True}
