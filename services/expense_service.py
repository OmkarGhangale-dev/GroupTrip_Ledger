import uuid
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from models.expense import Expense, ExpenseSplit, SplitMethod
from models.participant import Participant
from schemas.expense import (
    ExpenseCreate,
    ExpenseUpdate,
)


async def _build_equal_splits(
    db: AsyncSession,
    expense: Expense,
    trip_id: uuid.UUID,
    splits_data=None,
) -> List[ExpenseSplit]:

    if splits_data:
        participant_ids = [item.participant_id for item in splits_data]
    else:
        result = await db.execute(
            select(Participant.id).where(Participant.trip_id == trip_id)
        )
        participant_ids = list(result.scalars().all())

    if not participant_ids:
        return []

    cents = round(float(expense.amount) * 100)
    base, rem = divmod(cents, len(participant_ids))

    return [
        ExpenseSplit(
            expense_id=expense.id,
            participant_id=pid,
            amount=(base + (1 if i < rem else 0)) / 100,
        )
        for i, pid in enumerate(participant_ids)
    ]


async def _build_custom_splits(
    db: AsyncSession,
    expense: Expense,
    splits_data
) -> List[ExpenseSplit]:

    splits = []

    for item in splits_data:

        if item.amount is None:
            continue

        splits.append(
            ExpenseSplit(
                expense_id=expense.id,
                participant_id=item.participant_id,
                amount=item.amount,
                percentage=item.percentage,
                shares=item.shares,
            )
        )

    return splits


async def _build_percentage_splits(
    db: AsyncSession,
    expense: Expense,
    splits_data
) -> List[ExpenseSplit]:

    splits = []

    for item in splits_data:

        if item.percentage is None:
            continue

        amount = round(
            float(expense.amount) *
            float(item.percentage) / 100,
            2
        )

        splits.append(
            ExpenseSplit(
                expense_id=expense.id,
                participant_id=item.participant_id,
                amount=amount,
                percentage=item.percentage,
            )
        )

    return splits


async def create_expense(
    db: AsyncSession,
    data: ExpenseCreate
) -> Expense:

    expense_data = data.model_dump(
        exclude={"splits"}
    )

    expense = Expense(**expense_data)

    db.add(expense)

    await db.flush()

    splits = []

    if data.split_method == SplitMethod.EQUAL:
        splits = await _build_equal_splits(
            db,
            expense,
            data.trip_id,
            data.splits
        )

    elif data.splits:

        if data.split_method == SplitMethod.CUSTOM:
            splits = await _build_custom_splits(
                db,
                expense,
                data.splits
            )

        elif data.split_method == SplitMethod.PERCENTAGE:
            splits = await _build_percentage_splits(
                db,
                expense,
                data.splits
            )

        elif data.split_method == SplitMethod.SHARES:
            splits = await _build_shares_splits(
                db,
                expense,
                data.splits
            )

    if splits:
        db.add_all(splits)

    await db.commit()

    result = await db.execute(
        select(Expense)
        .where(Expense.id == expense.id)
        .options(
            selectinload(Expense.splits),
            selectinload(Expense.paid_by_participant),
        )
    )

    return result.scalar_one()


async def get_expense(
    db: AsyncSession,
    expense_id: uuid.UUID
) -> Optional[Expense]:

    result = await db.execute(
        select(Expense)
        .where(Expense.id == expense_id)
        .options(
            selectinload(Expense.splits),
            selectinload(Expense.paid_by_participant),
        )
    )

    return result.scalar_one_or_none()


async def get_expenses_by_trip(
    db: AsyncSession,
    trip_id: uuid.UUID
) -> List[Expense]:

    result = await db.execute(
        select(Expense)
        .where(Expense.trip_id == trip_id)
        .options(
            selectinload(Expense.splits),
            selectinload(Expense.paid_by_participant),
        )
        .order_by(Expense.created_at.desc())
    )

    return list(result.scalars().all())


async def update_expense(
    db: AsyncSession,
    expense_id: uuid.UUID,
    data: ExpenseUpdate
) -> Optional[Expense]:

    expense = await get_expense(
        db,
        expense_id
    )

    if not expense:
        return None

    update_data = data.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():
        setattr(expense, key, value)

    await db.commit()

    return await get_expense(
        db,
        expense_id
    )


async def delete_expense(
    db: AsyncSession,
    expense_id: uuid.UUID
) -> bool:

    expense = await get_expense(
        db,
        expense_id
    )

    if not expense:
        return False

    await db.delete(expense)

    await db.commit()

    return True