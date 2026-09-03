import datetime
from pydantic import BaseModel, Field
from typing import Optional, List
from models.expense import SplitMethod


# ── Split schemas ─────────────────────────────────────────────────────────────

class ExpenseSplitInput(BaseModel):
    participant_id: str
    amount: Optional[float] = Field(default=None, gt=0)
    percentage: Optional[float] = Field(default=None, gt=0, le=100)
    shares: Optional[int] = Field(default=None, gt=0)


class ExpenseSplitRead(BaseModel):
    id: str
    expense_id: str
    participant_id: str
    amount: float
    percentage: Optional[float] = None
    shares: Optional[int] = None
    is_settled: bool
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = {"from_attributes": True}


# ── Base ──────────────────────────────────────────────────────────────────────

class ExpenseBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    description: Optional[str] = None
    amount: float = Field(..., gt=0)
    currency: str = Field(default="USD", max_length=10)
    category: Optional[str] = Field(default=None, max_length=100)
    split_method: SplitMethod = SplitMethod.EQUAL
    receipt_url: Optional[str] = Field(default=None, max_length=500)


# ── Create ────────────────────────────────────────────────────────────────────

class ExpenseCreate(ExpenseBase):
    trip_id: str
    paid_by_id: str
    splits: Optional[List[ExpenseSplitInput]] = None  # None = auto-split equally


# ── Update ────────────────────────────────────────────────────────────────────

class ExpenseUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=300)
    description: Optional[str] = None
    amount: Optional[float] = Field(default=None, gt=0)
    currency: Optional[str] = Field(default=None, max_length=10)
    category: Optional[str] = Field(default=None, max_length=100)
    split_method: Optional[SplitMethod] = None
    receipt_url: Optional[str] = Field(default=None, max_length=500)


# ── Read ──────────────────────────────────────────────────────────────────────

class ExpenseRead(ExpenseBase):
    id: str
    trip_id: str
    paid_by_id: str
    splits: List[ExpenseSplitRead] = []
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = {"from_attributes": True}
