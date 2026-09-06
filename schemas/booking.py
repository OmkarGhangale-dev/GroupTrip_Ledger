import datetime
import uuid

from pydantic import BaseModel, ConfigDict, Field

from models.booking import BookingType, BookingStatus


# =========================================================
# Base
# =========================================================

class BookingBase(BaseModel):

    booking_type: BookingType

    provider: str | None = Field(
        default=None,
        max_length=200
    )

    description: str | None = None

    amount: float = Field(
        ...,
        gt=0
    )

    status: BookingStatus = BookingStatus.CONFIRMED

    cancellation_policy: str | None = None

    reference_number: str | None = Field(
        default=None,
        max_length=100
    )


# =========================================================
# Create
# =========================================================

class BookingCreate(BookingBase):

    trip_id: uuid.UUID

    participant_ids: list[uuid.UUID] = Field(
        default_factory=list
    )

    start_datetime: datetime.datetime | None = None

    end_datetime: datetime.datetime | None = None

    location: str | None = Field(
        default=None,
        max_length=400
    )

    latitude: float | None = None

    longitude: float | None = None


# =========================================================
# Update
# =========================================================

class BookingUpdate(BaseModel):

    booking_type: BookingType | None = None

    provider: str | None = Field(
        default=None,
        max_length=200
    )

    description: str | None = None

    amount: float | None = Field(
        default=None,
        gt=0
    )

    status: BookingStatus | None = None

    cancellation_policy: str | None = None

    reference_number: str | None = Field(
        default=None,
        max_length=100
    )

    participant_ids: list[uuid.UUID] | None = None

    start_datetime: datetime.datetime | None = None

    end_datetime: datetime.datetime | None = None

    location: str | None = Field(
        default=None,
        max_length=400
    )

    latitude: float | None = None

    longitude: float | None = None


# =========================================================
# Read
# =========================================================

class BookingRead(BookingBase):

    id: uuid.UUID

    trip_id: uuid.UUID

    participant_ids: list[uuid.UUID] = Field(
        default_factory=list
    )

    start_datetime: datetime.datetime | None = None

    end_datetime: datetime.datetime | None = None

    location: str | None = None

    latitude: float | None = None

    longitude: float | None = None

    created_at: datetime.datetime

    updated_at: datetime.datetime

    model_config = ConfigDict(
        from_attributes=True
    )


class BookingUseRequest(BaseModel):
    paid_by_id: uuid.UUID