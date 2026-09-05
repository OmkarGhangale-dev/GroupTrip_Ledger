import datetime
import uuid
from typing import Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.payment import Payment, Settlement, Refund
from models.participant import Participant, ParticipantStatus
from models.expense import Expense, ExpenseSplit

from schemas.payment import (
    PaymentCreate,
    PaymentUpdate,
    RefundCreate,
    BalanceSummary,
    SettlementSuggestion,
)

# ─────────────────────────────────────────────────────────────────────────────
# Payment CRUD
# ─────────────────────────────────────────────────────────────────────────────

async def create_payment(
    db: AsyncSession,
    data: PaymentCreate
) -> Payment:

    payment = Payment(
        **data.model_dump(),
        payment_date=datetime.datetime.now(datetime.timezone.utc)
    )

    db.add(payment)

    await db.commit()
    await db.refresh(payment)

    return payment


async def get_payment(
    db: AsyncSession,
    payment_id: uuid.UUID
) -> Optional[Payment]:

    result = await db.execute(
        select(Payment)
        .where(Payment.id == payment_id)
    )

    return result.scalar_one_or_none()


async def get_payments_by_trip(
    db: AsyncSession,
    trip_id: uuid.UUID
) -> List[Payment]:

    result = await db.execute(
        select(Payment)
        .where(Payment.trip_id == trip_id)
        .order_by(Payment.created_at.desc())
    )

    return list(result.scalars().all())


async def update_payment(
    db: AsyncSession,
    payment_id: uuid.UUID,
    data: PaymentUpdate
) -> Optional[Payment]:

    payment = await get_payment(db, payment_id)

    if not payment:
        return None

    update_data = data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(payment, key, value)

    await db.commit()
    await db.refresh(payment)

    return payment


async def delete_payment(
    db: AsyncSession,
    payment_id: uuid.UUID
) -> bool:

    payment = await get_payment(db, payment_id)

    if not payment:
        return False

    await db.delete(payment)
    await db.commit()

    return True


# ─────────────────────────────────────────────────────────────────────────────
# Balance Engine
# ─────────────────────────────────────────────────────────────────────────────

async def compute_balances(
    db: AsyncSession,
    trip_id: uuid.UUID
) -> List[BalanceSummary]:
    """
    Net balance for each participant:

    + expenses they paid
    - expenses they owe
    + payments received
    - payments made
    """

    # Get active participants
    participant_result = await db.execute(
        select(Participant).where(
            Participant.trip_id == trip_id,
            Participant.status == ParticipantStatus.ACTIVE
        )
    )

    participants = {
        participant.id: participant
        for participant in participant_result.scalars().all()
    }

    balances: Dict[uuid.UUID, float] = {
        participant_id: 0.0
        for participant_id in participants
    }

    # ────────────────────────────────────────────────────────────────────────
    # Expenses paid by participants
    # ────────────────────────────────────────────────────────────────────────

    expense_result = await db.execute(
        select(Expense)
        .where(Expense.trip_id == trip_id)
    )

    expenses = expense_result.scalars().all()

    for expense in expenses:

        if expense.paid_by_id in balances:
            balances[expense.paid_by_id] += float(expense.amount)

    # ────────────────────────────────────────────────────────────────────────
    # Expense splits owed by participants
    # ────────────────────────────────────────────────────────────────────────

    split_result = await db.execute(
        select(ExpenseSplit)
        .join(
            Expense,
            Expense.id == ExpenseSplit.expense_id
        )
        .where(Expense.trip_id == trip_id)
    )

    splits = split_result.scalars().all()

    for split in splits:

        if split.participant_id in balances:
            balances[split.participant_id] -= float(split.amount)

    # ────────────────────────────────────────────────────────────────────────
    # Peer-to-peer payments
    # ────────────────────────────────────────────────────────────────────────

    payment_result = await db.execute(
        select(Payment)
        .where(Payment.trip_id == trip_id)
    )

    payments = payment_result.scalars().all()

    for payment in payments:

        # Sender pays
        if payment.from_participant_id in balances:
            balances[payment.from_participant_id] -= float(
                payment.amount
            )

        # Receiver receives
        if payment.to_participant_id in balances:
            balances[payment.to_participant_id] += float(
                payment.amount
            )

    # ────────────────────────────────────────────────────────────────────────
    # Create response
    # ────────────────────────────────────────────────────────────────────────

    return [
        BalanceSummary(
            participant_id=participant_id,
            participant_name=participants[participant_id].name,
            net_balance=round(balance, 2),
        )
        for participant_id, balance in balances.items()
    ]


# ─────────────────────────────────────────────────────────────────────────────
# Settlement Engine
# ─────────────────────────────────────────────────────────────────────────────

async def compute_settlements(
    db: AsyncSession,
    trip_id: uuid.UUID
) -> List[SettlementSuggestion]:
    """
    Calculate minimal settlement transactions
    using a greedy algorithm.
    """

    participant_result = await db.execute(
        select(Participant).where(
            Participant.trip_id == trip_id,
            Participant.status == ParticipantStatus.ACTIVE
        )
    )

    participants = {
        participant.id: participant
        for participant in participant_result.scalars().all()
    }

    balances_list = await compute_balances(
        db,
        trip_id
    )

    balances = {
        balance.participant_id: balance.net_balance
        for balance in balances_list
    }

    # Participants who should receive money
    creditors = sorted(
        [
            (participant_id, balance)
            for participant_id, balance in balances.items()
            if balance > 0.01
        ],
        key=lambda x: -x[1],
    )

    # Participants who should pay money
    debtors = sorted(
        [
            (participant_id, -balance)
            for participant_id, balance in balances.items()
            if balance < -0.01
        ],
        key=lambda x: -x[1],
    )

    creditors = list(creditors)
    debtors = list(debtors)

    suggestions: List[SettlementSuggestion] = []

    i = 0
    j = 0

    while i < len(debtors) and j < len(creditors):

        debtor_id, debt = debtors[i]
        creditor_id, credit = creditors[j]

        amount = round(
            min(debt, credit),
            2
        )

        suggestions.append(
            SettlementSuggestion(
                from_participant_id=debtor_id,
                from_name=participants[debtor_id].name,
                to_participant_id=creditor_id,
                to_name=participants[creditor_id].name,
                amount=amount,
                currency="INR",
            )
        )

        debtors[i] = (
            debtor_id,
            round(debt - amount, 2)
        )

        creditors[j] = (
            creditor_id,
            round(credit - amount, 2)
        )

        if debtors[i][1] < 0.01:
            i += 1

        if creditors[j][1] < 0.01:
            j += 1

    return suggestions


# ─────────────────────────────────────────────────────────────────────────────
# Refund CRUD
# ─────────────────────────────────────────────────────────────────────────────

async def create_refund(
    db: AsyncSession,
    data: RefundCreate
) -> Refund:

    refund = Refund(**data.model_dump())

    db.add(refund)
    await db.commit()
    await db.refresh(refund)

    return refund


async def get_refunds_by_booking(
    db: AsyncSession,
    booking_id: uuid.UUID
) -> List[Refund]:

    result = await db.execute(
        select(Refund)
        .where(Refund.booking_id == booking_id)
        .order_by(Refund.created_at.desc())
    )

    return list(result.scalars().all())