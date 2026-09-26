import uuid

from pydantic import BaseModel, Field

from schemas.nl_expense import ParsedSplit


class ReceiptItemIn(BaseModel):
    item_name: str
    item_total: float | None = None


class ReceiptSplitRequest(BaseModel):
    trip_id: uuid.UUID
    text: str = Field(..., min_length=3, max_length=500)
    total_amount: float = Field(..., gt=0)
    currency: str = "INR"
    line_items: list[ReceiptItemIn] = []


class ReceiptSplitResult(BaseModel):
    split_method: str = "custom"
    paid_by_id: uuid.UUID | None = None
    splits: list[ParsedSplit]
    notes: list[str] = []