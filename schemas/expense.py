import datetime
import uuid

from pydantic import BaseModel, ConfigDict, Field

from models.expense import SplitMethod


# =========================================================
# Split Input
# =========================================================

class ExpenseSplitInput(BaseModel):

    participant_id: uuid.UUID

    amount: float | None = Field(
        default=None,
        gt=0
    )

    percentage: float | None = Field(
        default=None,
        gt=0,
        le=100
    )

    shares: int | None = Field(
        default=None,
        gt=0
    )


# =========================================================
# Split Read
# =========================================================

class ExpenseSplitRead(BaseModel):

    id: uuid.UUID

    expense_id: uuid.UUID

    participant_id: uuid.UUID

    amount: float

    percentage: float | None = None

    shares: int | None = None

    is_settled: bool

    created_at: datetime.datetime

    updated_at: datetime.datetime

    model_config = ConfigDict(
        from_attributes=True
    )


# =========================================================
# Base
# =========================================================

class ExpenseBase(BaseModel):

    title: str = Field(
        ...,
        min_length=1,
        max_length=300
    )

    description: str | None = None

    amount: float = Field(
        ...,
        gt=0
    )

    currency: str = Field(
        default="INR",
        max_length=10
    )

    category: str | None = Field(
        default=None,
        max_length=100
    )

    split_method: SplitMethod = SplitMethod.EQUAL

    receipt_url: str | None = Field(
        default=None,
        max_length=500
    )


# =========================================================
# Create
# =========================================================

class ExpenseCreate(ExpenseBase):

    trip_id: uuid.UUID

    paid_by_id: uuid.UUID

    booking_id: uuid.UUID | None = None

    splits: list[ExpenseSplitInput] | None = None


# =========================================================
# Update
# =========================================================

class ExpenseUpdate(BaseModel):

    title: str | None = Field(
        default=None,
        min_length=1,
        max_length=300
    )

    description: str | None = None

    amount: float | None = Field(
        default=None,
        gt=0
    )

    currency: str | None = Field(
        default=None,
        max_length=10
    )

    category: str | None = Field(
        default=None,
        max_length=100
    )

    split_method: SplitMethod | None = None

    receipt_url: str | None = Field(
        default=None,
        max_length=500
    )

    booking_id: uuid.UUID | None = None


# =========================================================
# Read
# =========================================================

class ExpenseRead(ExpenseBase):

    id: uuid.UUID

    trip_id: uuid.UUID

    paid_by_id: uuid.UUID

    booking_id: uuid.UUID | None = None

    splits: list[ExpenseSplitRead] = Field(
        default_factory=list
    )

    created_at: datetime.datetime

    updated_at: datetime.datetime

    model_config = ConfigDict(
        from_attributes=True
    )