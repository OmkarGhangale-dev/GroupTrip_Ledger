import datetime
import uuid

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from models.participant import (
    ParticipantRole,
    ParticipantStatus,
)


# =========================================================
# Base
# =========================================================

class ParticipantBase(BaseModel):

    name: str = Field(
        ...,
        min_length=1,
        max_length=150
    )

    email: EmailStr

    role: ParticipantRole = ParticipantRole.MEMBER

    status: ParticipantStatus = ParticipantStatus.ACTIVE


# =========================================================
# Create
# =========================================================

class ParticipantCreate(ParticipantBase):

    trip_id: uuid.UUID


# =========================================================
# Update
# =========================================================

class ParticipantUpdate(BaseModel):

    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=150
    )

    email: EmailStr | None = None

    role: ParticipantRole | None = None

    status: ParticipantStatus | None = None


# =========================================================
# Read
# =========================================================

class ParticipantRead(ParticipantBase):

    id: uuid.UUID

    trip_id: uuid.UUID

    created_at: datetime.datetime

    updated_at: datetime.datetime

    model_config = ConfigDict(
        from_attributes=True
    )