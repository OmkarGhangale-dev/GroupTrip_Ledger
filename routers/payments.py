from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from schemas.payment import (
    PaymentCreate, PaymentUpdate, PaymentRead,
    BalanceSummary, SettlementSuggestion,
    RefundCreate, RefundRead,
)
import services.payment_service as svc

router = APIRouter(tags=["Payments & Balances"])


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


# ── Payments ──────────────────────────────────────────────────────────────────

@router.post("/payments/", response_model=PaymentRead, status_code=status.HTTP_201_CREATED)
async def create_payment(data: PaymentCreate, db: AsyncSession = Depends(get_db)):
    return await svc.create_payment(db, data)


@router.get("/payments/trip/{trip_id}", response_model=List[PaymentRead])
async def list_payments(trip_id: str, db: AsyncSession = Depends(get_db)):
    return await svc.get_payments_by_trip(db, trip_id)


@router.get("/payments/{payment_id}", response_model=PaymentRead)
async def get_payment(payment_id: str, db: AsyncSession = Depends(get_db)):
    p = await svc.get_payment(db, payment_id)
    if not p:
        raise HTTPException(status_code=404, detail="Payment not found")
    return p


@router.patch("/payments/{payment_id}", response_model=PaymentRead)
async def update_payment(payment_id: str, data: PaymentUpdate, db: AsyncSession = Depends(get_db)):
    p = await svc.update_payment(db, payment_id, data)
    if not p:
        raise HTTPException(status_code=404, detail="Payment not found")
    return p


@router.delete("/payments/{payment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_payment(payment_id: str, db: AsyncSession = Depends(get_db)):
    deleted = await svc.delete_payment(db, payment_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Payment not found")


# ── Balances & Settlements ────────────────────────────────────────────────────

@router.get("/trips/{trip_id}/balances", response_model=List[BalanceSummary])
async def get_balances(trip_id: str, db: AsyncSession = Depends(get_db)):
    """Get net balance for each participant in a trip."""
    return await svc.compute_balances(db, trip_id)


@router.get("/trips/{trip_id}/settlements", response_model=List[SettlementSuggestion])
async def get_settlement_suggestions(trip_id: str, db: AsyncSession = Depends(get_db)):
    """Get minimal set of payments to settle all debts."""
    return await svc.compute_settlements(db, trip_id)


# ── Refunds ───────────────────────────────────────────────────────────────────

@router.post("/refunds/", response_model=RefundRead, status_code=status.HTTP_201_CREATED)
async def create_refund(data: RefundCreate, db: AsyncSession = Depends(get_db)):
    return await svc.create_refund(db, data)


@router.get("/refunds/booking/{booking_id}", response_model=List[RefundRead])
async def list_refunds(booking_id: str, db: AsyncSession = Depends(get_db)):
    return await svc.get_refunds_by_booking(db, booking_id)
