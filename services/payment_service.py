from typing import List, Optional, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from models.payment import Payment, Settlement, Refund
from models.participant import Participant
from models.expense import ExpenseSplit
from schemas.payment import (
    PaymentCreate, PaymentUpdate,
    RefundCreate,
    BalanceSummary, SettlementSuggestion,
)


# ── Payment CRUD ──────────────────────────────────────────────────────────────

async def create_payment(db: AsyncSession, data: PaymentCreate) -> Payment:
    payment = Payment(**data.model_dump())
    db.add(payment)
    await db.commit()
    await db.refresh(payment)
    return payment


async def get_payment(db: AsyncSession, payment_id: str) -> Optional[Payment]:
    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    return result.scalar_one_or_none()


async def get_payments_by_trip(db: AsyncSession, trip_id: str) -> List[Payment]:
    result = await db.execute(
        select(Payment).where(Payment.trip_id == trip_id).order_by(Payment.created_at.desc())
    )
    return list(result.scalars().all())


async def update_payment(db: AsyncSession, payment_id: str, data: PaymentUpdate) -> Optional[Payment]:
    payment = await get_payment(db, payment_id)
    if not payment:
        return None
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(payment, key, value)
    await db.commit()
    await db.refresh(payment)
    return payment


async def delete_payment(db: AsyncSession, payment_id: str) -> bool:
    payment = await get_payment(db, payment_id)
    if not payment:
        return False
    await db.delete(payment)
    await db.commit()
    return True


# ── Balance Engine ────────────────────────────────────────────────────────────

async def compute_balances(db: AsyncSession, trip_id: str) -> List[BalanceSummary]:
    """
    Net balance for each participant:
      + for every expense they paid
      - for every split they owe
      + for every payment received
      - for every payment made
    """
    # Get participants
    p_result = await db.execute(
        select(Participant).where(Participant.trip_id == trip_id, Participant.status == "active")
    )
    participants = {p.id: p for p in p_result.scalars().all()}
    balances: Dict[str, float] = {pid: 0.0 for pid in participants}

    # Expenses paid
    from models.expense import Expense
    exp_result = await db.execute(select(Expense).where(Expense.trip_id == trip_id))
    for exp in exp_result.scalars().all():
        if exp.paid_by_id in balances:
            balances[exp.paid_by_id] += float(exp.amount)

    # Expense splits owed
    split_result = await db.execute(
        select(ExpenseSplit)
        .join(Expense, Expense.id == ExpenseSplit.expense_id)
        .where(Expense.trip_id == trip_id)
    )
    for split in split_result.scalars().all():
        if split.participant_id in balances:
            balances[split.participant_id] -= float(split.amount)

    # Payments (peer-to-peer)
    pay_result = await db.execute(select(Payment).where(Payment.trip_id == trip_id))
    for pay in pay_result.scalars().all():
        if pay.from_participant_id in balances:
            balances[pay.from_participant_id] -= float(pay.amount)
        if pay.to_participant_id in balances:
            balances[pay.to_participant_id] += float(pay.amount)

    return [
        BalanceSummary(
            participant_id=pid,
            participant_name=participants[pid].name,
            net_balance=round(bal, 2),
        )
        for pid, bal in balances.items()
    ]


async def compute_settlements(db: AsyncSession, trip_id: str) -> List[SettlementSuggestion]:
    """
    Minimal transactions to settle all debts (greedy algorithm).
    """
    p_result = await db.execute(
        select(Participant).where(Participant.trip_id == trip_id, Participant.status == "active")
    )
    participants = {p.id: p for p in p_result.scalars().all()}

    balances_list = await compute_balances(db, trip_id)
    balances = {b.participant_id: b.net_balance for b in balances_list}

    creditors = sorted(
        [(pid, bal) for pid, bal in balances.items() if bal > 0.01],
        key=lambda x: -x[1],
    )
    debtors = sorted(
        [(pid, -bal) for pid, bal in balances.items() if bal < -0.01],
        key=lambda x: -x[1],
    )

    suggestions = []
    i, j = 0, 0
    creditors = list(creditors)
    debtors = list(debtors)

    while i < len(debtors) and j < len(creditors):
        debtor_id, debt = debtors[i]
        creditor_id, credit = creditors[j]
        amount = round(min(debt, credit), 2)

        suggestions.append(
            SettlementSuggestion(
                from_participant_id=debtor_id,
                from_name=participants[debtor_id].name,
                to_participant_id=creditor_id,
                to_name=participants[creditor_id].name,
                amount=amount,
                currency="USD",
            )
        )
        debtors[i] = (debtor_id, round(debt - amount, 2))
        creditors[j] = (creditor_id, round(credit - amount, 2))
        if debtors[i][1] < 0.01:
            i += 1
        if creditors[j][1] < 0.01:
            j += 1

    return suggestions


# ── Refund CRUD ───────────────────────────────────────────────────────────────

async def create_refund(db: AsyncSession, data: RefundCreate) -> Refund:
    refund = Refund(**data.model_dump())
    db.add(refund)
    await db.commit()
    await db.refresh(refund)
    return refund


async def get_refunds_by_booking(db: AsyncSession, booking_id: str) -> List[Refund]:
    result = await db.execute(select(Refund).where(Refund.booking_id == booking_id))
    return list(result.scalars().all())
