import datetime
import uuid

from pydantic import BaseModel, ConfigDict, EmailStr


class InviteCreate(BaseModel):
    email: EmailStr | None = None  # None = create a shareable link


class InviteRead(BaseModel):
    id: uuid.UUID
    email: str | None = None
    status: str
    expires_at: datetime.datetime
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


class InviteCreated(BaseModel):
    id: uuid.UUID
    invite_url: str
    email: str | None = None
    expires_at: datetime.datetime
    email_sent: bool = False
    email_error: str | None = None


class InvitePreview(BaseModel):
    valid: bool
    reason: str | None = None
    trip_name: str | None = None
    destination: str | None = None
    invited_by: str | None = None
    email: str | None = None  # masked


class InviteAccepted(BaseModel):
    trip_id: uuid.UUID
    trip_name: str
    already_member: bool