import datetime
import uuid

from pydantic import BaseModel, ConfigDict, Field

from models.trip import TripStatus


# =========================================================
# Base
# =========================================================

class TripBase(BaseModel):
    name: str = Field(
        ...,
        min_length=1,
        max_length=200
    )

    destination: str = Field(
        ...,
        min_length=1,
        max_length=300
    )

    description: str | None = None

    start_date: datetime.date | None = None

    end_date: datetime.date | None = None

    currency: str = Field(
        default="INR",
        max_length=10
    )

    budget: float | None = Field(
        default=None,
        gt=0
    )

    status: TripStatus = TripStatus.PLANNING


# =========================================================
# Create
# =========================================================

class TripCreate(TripBase):
    pass


# =========================================================
# Update
# =========================================================

class TripUpdate(BaseModel):

    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=200
    )

    destination: str | None = Field(
        default=None,
        min_length=1,
        max_length=300
    )

    description: str | None = None

    start_date: datetime.date | None = None

    end_date: datetime.date | None = None

    currency: str | None = Field(
        default=None,
        max_length=10
    )

    budget: float | None = Field(
        default=None,
        gt=0
    )

    status: TripStatus | None = None


# =========================================================
# Read
# =========================================================

class TripRead(TripBase):

    id: uuid.UUID

    organizer_id: uuid.UUID | None = None

    created_at: datetime.datetime

    updated_at: datetime.datetime

    model_config = ConfigDict(
        from_attributes=True
    )