import datetime
import uuid

from pydantic import BaseModel, ConfigDict, Field

from models.payment import PaymentStatus


# =========================================================
# Payment
# =========================================================

class PaymentBase(BaseModel):

    from_participant_id: uuid.UUID

    to_participant_id: uuid.UUID

    amount: float = Field(
        ...,
        gt=0
    )

    currency: str = Field(
        default="INR",
        max_length=10
    )

    note: str | None = None

    status: PaymentStatus = PaymentStatus.COMPLETED


class PaymentCreate(PaymentBase):

    trip_id: uuid.UUID


class PaymentUpdate(BaseModel):

    note: str | None = None

    status: PaymentStatus | None = None


class PaymentRead(PaymentBase):

    id: uuid.UUID

    trip_id: uuid.UUID

    created_at: datetime.datetime

    updated_at: datetime.datetime

    model_config = ConfigDict(
        from_attributes=True
    )


# =========================================================
# Settlement
# =========================================================

class SettlementRead(BaseModel):

    id: uuid.UUID | None = None

    trip_id: uuid.UUID | None = None

    from_participant_id: uuid.UUID

    to_participant_id: uuid.UUID

    amount: float

    currency: str

    model_config = ConfigDict(
        from_attributes=True
    )


# =========================================================
# Balance
# =========================================================

class BalanceSummary(BaseModel):

    participant_id: uuid.UUID

    participant_name: str

    net_balance: float


# =========================================================
# Settlement Suggestion
# =========================================================

class SettlementSuggestion(BaseModel):

    from_participant_id: uuid.UUID

    from_name: str

    to_participant_id: uuid.UUID

    to_name: str

    amount: float

    currency: str


# =========================================================
# Refund
# =========================================================

class RefundCreate(BaseModel):

    booking_id: uuid.UUID

    amount: float = Field(
        ...,
        gt=0
    )

    reason: str | None = None


class RefundRead(BaseModel):

    id: uuid.UUID

    booking_id: uuid.UUID

    expense_id: uuid.UUID | None = None

    amount: float

    reason: str | None = None

    status: str

    refund_date: datetime.datetime | None = None

    created_at: datetime.datetime

    updated_at: datetime.datetime

    model_config = ConfigDict(
        from_attributes=True
    )