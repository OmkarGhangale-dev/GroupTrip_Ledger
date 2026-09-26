from pydantic import BaseModel


class ReceiptLineItem(BaseModel):
    item_name: str
    item_quantity: float = 1
    item_price: float | None = None
    item_total: float | None = None


class ReceiptScanResult(BaseModel):
    merchant_name: str | None = None
    transaction_date: str | None = None  # YYYY-MM-DD
    currency: str = "INR"
    total_amount: float
    tax_amount: float | None = None
    category: str = "Other"
    line_items: list[ReceiptLineItem] = []
    warnings: list[str] = []