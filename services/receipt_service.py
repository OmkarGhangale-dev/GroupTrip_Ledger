import asyncio
import base64
import datetime
import io
import json
import re

import httpx
from fastapi import HTTPException
from PIL import Image, ImageOps

from app.config import settings
from schemas.receipt import ReceiptLineItem, ReceiptScanResult

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

CATEGORIES = [
    "Food & Dining",
    "Transportation",
    "Accommodation",
    "Activities & Tours",
    "Groceries & Supplies",
    "Entertainment",
    "Shopping",
    "Emergency / Medical",
    "Other",
]

SYSTEM_PROMPT = f"""You read photos of receipts and bills.
Reply with ONLY a JSON object, no markdown, no explanation, with these keys:
- merchant_name: shop or restaurant name, or null
- transaction_date: the date printed on the receipt as YYYY-MM-DD, or null
- currency: 3-letter code (₹, Rs, INR = INR; $ = USD; € = EUR). Default "INR"
- total_amount: the final amount paid, including taxes and service charge, as a number
- tax_amount: total GST/VAT/tax as a number, or null
- category: exactly one of {CATEGORIES}
- line_items: array of {{"item_name": string, "item_quantity": number, "item_price": unit price as number, "item_total": line total as number}}.
  Do NOT list tax, service charge, discount or total rows as items.
Rules: use null when a value is not visible. Never invent values.
Numbers must have no currency symbols and no thousands separators."""


def _num(v):
    if v is None:
        return None
    if isinstance(v, (int, float)):
        return float(v)
    try:
        return float(re.sub(r"[^\d.\-]", "", str(v)))
    except ValueError:
        return None


def _prepare_image(raw: bytes) -> str:
    try:
        img = Image.open(io.BytesIO(raw))
        img = ImageOps.exif_transpose(img)  # fixes sideways phone photos
    except Exception:
        raise HTTPException(
            400,
            "That file is not a readable image. Use a JPG or PNG "
            "(iPhone HEIC photos are not supported yet).",
        )
    if img.mode != "RGB":
        img = img.convert("RGB")
    if max(img.size) > 1600:
        img.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


def _normalise(data: dict) -> ReceiptScanResult:
    warnings: list[str] = []

    items: list[ReceiptLineItem] = []
    for it in data.get("line_items") or []:
        if not isinstance(it, dict):
            continue
        name = str(it.get("item_name") or "").strip()
        if not name:
            continue
        qty = _num(it.get("item_quantity")) or 1
        price = _num(it.get("item_price"))
        line_total = _num(it.get("item_total"))
        if line_total is None and price is not None:
            line_total = round(price * qty, 2)
        items.append(
            ReceiptLineItem(
                item_name=name[:200],
                item_quantity=qty,
                item_price=price,
                item_total=line_total,
            )
        )

    total = _num(data.get("total_amount"))
    items_sum = round(sum(i.item_total or 0 for i in items), 2)

    if (total is None or total <= 0) and items_sum > 0:
        total = items_sum
        warnings.append(
            "The total was not clear, so I added up the items. Please check it."
        )
    if total is None or total <= 0:
        raise HTTPException(
            422, "I couldn't find a total on that receipt. Try a clearer photo."
        )

    tax = _num(data.get("tax_amount"))
    if items:
        expected = items_sum + (tax or 0)
        if abs(expected - total) > max(1.0, total * 0.02):
            warnings.append(
                f"The items add up to {items_sum:.2f} but the total is "
                f"{total:.2f}. Some lines may be missing or misread."
            )

    date = None
    try:
        date = datetime.date.fromisoformat(
            str(data.get("transaction_date") or "").strip()
        ).isoformat()
    except ValueError:
        date = None

    category = data.get("category")
    if category not in CATEGORIES:
        category = "Other"

    merchant = str(data.get("merchant_name") or "").strip() or None

    return ReceiptScanResult(
        merchant_name=merchant[:200] if merchant else None,
        transaction_date=date,
        currency=(str(data.get("currency") or "INR").upper())[:10],
        total_amount=round(total, 2),
        tax_amount=tax,
        category=category,
        line_items=items,
        warnings=warnings,
    )


async def scan_receipt(raw: bytes) -> ReceiptScanResult:
    data_url = _prepare_image(raw)
    key = settings.RECEIPT_OCR_API_KEY or settings.effective_groq_api_key
    if not key:
        raise HTTPException(503, "No API key is set for receipt scanning.")
    url = settings.RECEIPT_OCR_BASE_URL.rstrip("/") + "/chat/completions"

    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(
            url,
            headers={"Authorization": f"Bearer {key}"},
            json={
                "model": settings.RECEIPT_OCR_MODEL,
                "temperature": 0,
                "max_tokens": 1500,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "Extract this receipt."},
                            {"type": "image_url", "image_url": {"url": data_url}},
                        ],
                    },
                ],
            },
        )

    if r.status_code != 200:
        try:
            msg = r.json()["error"]["message"]
        except Exception:
            msg = r.text[:200]
        raise HTTPException(502, f"The receipt scanner failed: {msg}")

    content = r.json()["choices"][0]["message"]["content"] or ""
    match = re.search(r"\{.*\}", content, re.S)
    if not match:
        raise HTTPException(
            422, "I couldn't read that receipt. Try a clearer, well-lit photo."
        )
    try:
        data = json.loads(match.group(0))
    except json.JSONDecodeError:
        raise HTTPException(
            422, "I couldn't read that receipt. Try a clearer, well-lit photo."
        )

    return _normalise(data)