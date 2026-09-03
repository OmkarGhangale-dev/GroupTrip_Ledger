import datetime
from pydantic import BaseModel, Field
from typing import Optional
from models.trip import TripStatus


# ── Base ──────────────────────────────────────────────────────────────────────

class TripBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    destination: str = Field(..., min_length=1, max_length=300)
    description: Optional[str] = None
    start_date: Optional[datetime.date] = None
    end_date: Optional[datetime.date] = None
    currency: str = Field(default="USD", max_length=10)
    budget: Optional[float] = Field(default=None, gt=0)
    status: TripStatus = TripStatus.PLANNING


# ── Create ────────────────────────────────────────────────────────────────────

class TripCreate(TripBase):
    pass


# ── Update ────────────────────────────────────────────────────────────────────

class TripUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    destination: Optional[str] = Field(default=None, min_length=1, max_length=300)
    description: Optional[str] = None
    start_date: Optional[datetime.date] = None
    end_date: Optional[datetime.date] = None
    currency: Optional[str] = Field(default=None, max_length=10)
    budget: Optional[float] = Field(default=None, gt=0)
    status: Optional[TripStatus] = None


# ── Read ──────────────────────────────────────────────────────────────────────

class TripRead(TripBase):
    id: str
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = {"from_attributes": True}
