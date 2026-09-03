import datetime
from pydantic import BaseModel, Field
from typing import Optional
from models.itinerary import ItineraryItemType


# ── Base ──────────────────────────────────────────────────────────────────────

class ItineraryItemBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    description: Optional[str] = None
    item_type: ItineraryItemType = ItineraryItemType.OTHER
    date: Optional[datetime.date] = None
    start_time: Optional[datetime.time] = None
    end_time: Optional[datetime.time] = None
    location: Optional[str] = Field(default=None, max_length=400)
    notes: Optional[str] = None
    order_index: int = Field(default=0, ge=0)


# ── Create ────────────────────────────────────────────────────────────────────

class ItineraryItemCreate(ItineraryItemBase):
    trip_id: str


# ── Update ────────────────────────────────────────────────────────────────────

class ItineraryItemUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=300)
    description: Optional[str] = None
    item_type: Optional[ItineraryItemType] = None
    date: Optional[datetime.date] = None
    start_time: Optional[datetime.time] = None
    end_time: Optional[datetime.time] = None
    location: Optional[str] = Field(default=None, max_length=400)
    notes: Optional[str] = None
    order_index: Optional[int] = Field(default=None, ge=0)


# ── Read ──────────────────────────────────────────────────────────────────────

class ItineraryItemRead(ItineraryItemBase):
    id: str
    trip_id: str
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = {"from_attributes": True}
