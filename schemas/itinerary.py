import datetime
import uuid

from pydantic import BaseModel, ConfigDict, Field

from models.itinerary import ItineraryItemType


# =========================================================
# Base
# =========================================================

class ItineraryItemBase(BaseModel):

    title: str = Field(
        ...,
        min_length=1,
        max_length=300
    )

    description: str | None = None

    item_type: str = "OTHER"

    date: datetime.date | None = None

    start_time: datetime.time | None = None

    end_time: datetime.time | None = None

    location: str | None = Field(
        default=None,
        max_length=400
    )

    latitude: float | None = None

    longitude: float | None = None

    notes: str | None = None

    order_index: int = Field(
        default=0,
        ge=0
    )


# =========================================================
# Create
# =========================================================

class ItineraryItemCreate(ItineraryItemBase):

    trip_id: uuid.UUID

    booking_id: uuid.UUID | None = None


# =========================================================
# Update
# =========================================================

class ItineraryItemUpdate(BaseModel):

    title: str | None = Field(
        default=None,
        min_length=1,
        max_length=300
    )

    description: str | None = None

    item_type: str | None = None

    date: datetime.date | None = None

    start_time: datetime.time | None = None

    end_time: datetime.time | None = None

    location: str | None = Field(
        default=None,
        max_length=400
    )

    latitude: float | None = None

    longitude: float | None = None

    notes: str | None = None

    order_index: int | None = Field(
        default=None,
        ge=0
    )

    booking_id: uuid.UUID | None = None


# =========================================================
# Read
# =========================================================

class ItineraryItemRead(ItineraryItemBase):

    id: uuid.UUID

    trip_id: uuid.UUID

    booking_id: uuid.UUID | None = None

    created_at: datetime.datetime

    updated_at: datetime.datetime

    model_config = ConfigDict(
        from_attributes=True
    )