from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
from models.user import User
from schemas.nl_expense import ParseExpenseRequest, ParseExpenseResponse
from utils.deps import get_current_user
import services.nl_expense_service as nl_svc
from schemas.receipt import ReceiptScanResult
import services.receipt_service as receipt_svc
from schemas.receipt_split import ReceiptSplitRequest, ReceiptSplitResult
import services.receipt_split_service as receipt_split_svc

from app.database import get_db
from schemas.expense import (
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseRead,
)
import services.expense_service as svc


router = APIRouter(
    prefix="/expenses",
    tags=["Expenses"]
)

MAX_RECEIPT_BYTES = 4 * 1024 * 1024


@router.post("/scan-receipt", response_model=ReceiptScanResult)
async def scan_receipt(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if not (file.content_type or "").startswith("image/"):
        raise HTTPException(400, "Please upload an image (JPG or PNG).")
    raw = await file.read()
    if not raw:
        raise HTTPException(400, "The uploaded file is empty.")
    if len(raw) > MAX_RECEIPT_BYTES:
        raise HTTPException(413, "Image too large. Max 5 MB.")
    return await receipt_svc.scan_receipt(raw)

@router.post("/receipt-split", response_model=ReceiptSplitResult)
async def receipt_split(
    data: ReceiptSplitRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await receipt_split_svc.split_receipt(db, current_user, data)

@router.post("/parse", response_model=ParseExpenseResponse)
async def parse_expense_text(
    data: ParseExpenseRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await nl_svc.parse_expense(db, current_user, data.trip_id, data.text)


@router.post(
    "/",
    response_model=ExpenseRead,
    status_code=status.HTTP_201_CREATED
)
async def create_expense(
    data: ExpenseCreate,
    db: AsyncSession = Depends(get_db)
):
    return await svc.create_expense(
        db,
        data
    )


@router.get(
    "/trip/{trip_id}",
    response_model=List[ExpenseRead]
)
async def list_expenses(
    trip_id: str,
    db: AsyncSession = Depends(get_db)
):
    return await svc.get_expenses_by_trip(
        db,
        trip_id
    )


@router.get(
    "/{expense_id}",
    response_model=ExpenseRead
)
async def get_expense(
    expense_id: str,
    db: AsyncSession = Depends(get_db)
):
    expense = await svc.get_expense(
        db,
        expense_id
    )

    if not expense:
        raise HTTPException(
            status_code=404,
            detail="Expense not found"
        )

    return expense


@router.patch(
    "/{expense_id}",
    response_model=ExpenseRead
)
async def update_expense(
    expense_id: str,
    data: ExpenseUpdate,
    db: AsyncSession = Depends(get_db)
):
    expense = await svc.update_expense(
        db,
        expense_id,
        data
    )

    if not expense:
        raise HTTPException(
            status_code=404,
            detail="Expense not found"
        )

    return expense


@router.delete(
    "/{expense_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
async def delete_expense(
    expense_id: str,
    db: AsyncSession = Depends(get_db)
):
    deleted = await svc.delete_expense(
        db,
        expense_id
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Expense not found"
        )