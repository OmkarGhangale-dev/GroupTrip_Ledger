import uuid

from pydantic import BaseModel, Field


class ParseExpenseRequest(BaseModel):
    trip_id: uuid.UUID
    text: str = Field(..., min_length=3, max_length=500)


class ParsedSplit(BaseModel):
    participant_id: uuid.UUID
    name: str
    amount: float


class ParseExpenseResponse(BaseModel):
    title: str
    amount: float
    currency: str = "INR"
    category: str
    split_method: str = "equal"
    paid_by_id: uuid.UUID
    paid_by_name: str
    splits: list[ParsedSplit]
    notes: list[str] = []