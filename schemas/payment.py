import datetime
from pydantic import BaseModel, Field
from typing import Optional
from models.payment import PaymentStatus


# ── Payment schemas ───────────────────────────────────────────────────────────

class PaymentBase(BaseModel):
    from_participant_id: str
    to_participant_id: str
    amount: float = Field(..., gt=0)
    currency: str = Field(default="USD", max_length=10)
    note: Optional[str] = None
    status: PaymentStatus = PaymentStatus.COMPLETED


class PaymentCreate(PaymentBase):
    trip_id: str


class PaymentUpdate(BaseModel):
    note: Optional[str] = None
    status: Optional[PaymentStatus] = None


class PaymentRead(PaymentBase):
    id: str
    trip_id: str
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = {"from_attributes": True}


# ── Settlement schemas ────────────────────────────────────────────────────────

class SettlementRead(BaseModel):
    from_participant_id: str
    to_participant_id: str
    amount: float
    currency: str

    model_config = {"from_attributes": True}


class BalanceSummary(BaseModel):
    participant_id: str
    participant_name: str
    net_balance: float  # positive = is owed money, negative = owes money


class SettlementSuggestion(BaseModel):
    from_participant_id: str
    from_name: str
    to_participant_id: str
    to_name: str
    amount: float
    currency: str


# ── Refund schemas ────────────────────────────────────────────────────────────

class RefundCreate(BaseModel):
    booking_id: str
    amount: float = Field(..., gt=0)
    reason: Optional[str] = None


class RefundRead(BaseModel):
    id: str
    booking_id: str
    amount: float
    reason: Optional[str] = None
    status: str
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = {"from_attributes": True}
