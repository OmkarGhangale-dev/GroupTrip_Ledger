from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from models.expense import Expense, ExpenseSplit
from models.participant import Participant
from schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseSplitInput
from models.expense import SplitMethod
from models.base import new_uuid


async def _build_equal_splits(
    db: AsyncSession,
    expense: Expense,
    trip_id: str,
) -> List[ExpenseSplit]:
    """Divide expense equally among all active trip participants."""
    result = await db.execute(
        select(Participant).where(
            Participant.trip_id == trip_id,
            Participant.status == "active",
        )
    )
    participants = list(result.scalars().all())
    if not participants:
        return []
    per_person = round(float(expense.amount) / len(participants), 2)
    splits = []
    for p in participants:
        splits.append(
            ExpenseSplit(
                id=new_uuid(),
                expense_id=expense.id,
                participant_id=p.id,
                amount=per_person,
            )
        )
    return splits


async def _build_custom_splits(
    expense: Expense,
    split_inputs: List[ExpenseSplitInput],
) -> List[ExpenseSplit]:
    splits = []
    for inp in split_inputs:
        splits.append(
            ExpenseSplit(
                id=new_uuid(),
                expense_id=expense.id,
                participant_id=inp.participant_id,
                amount=round(float(inp.amount or 0), 2),
                percentage=inp.percentage,
                shares=inp.shares,
            )
        )
    return splits


async def _build_percentage_splits(
    expense: Expense,
    split_inputs: List[ExpenseSplitInput],
) -> List[ExpenseSplit]:
    splits = []
    total_amount = float(expense.amount)
    for inp in split_inputs:
        pct = float(inp.percentage or 0)
        amount = round(total_amount * pct / 100, 2)
        splits.append(
            ExpenseSplit(
                id=new_uuid(),
                expense_id=expense.id,
                participant_id=inp.participant_id,
                amount=amount,
                percentage=pct,
            )
        )
    return splits


async def _build_shares_splits(
    expense: Expense,
    split_inputs: List[ExpenseSplitInput],
) -> List[ExpenseSplit]:
    total_shares = sum(inp.shares or 1 for inp in split_inputs)
    total_amount = float(expense.amount)
    splits = []
    for inp in split_inputs:
        sh = inp.shares or 1
        amount = round(total_amount * sh / total_shares, 2)
        splits.append(
            ExpenseSplit(
                id=new_uuid(),
                expense_id=expense.id,
                participant_id=inp.participant_id,
                amount=amount,
                shares=sh,
            )
        )
    return splits


async def create_expense(db: AsyncSession, data: ExpenseCreate) -> Expense:
    expense_data = data.model_dump(exclude={"splits"})
    expense = Expense(**expense_data)
    expense.id = new_uuid()
    db.add(expense)
    await db.flush()  # generate id before splits

    # Build splits
    if data.split_method == SplitMethod.EQUAL or data.splits is None:
        splits = await _build_equal_splits(db, expense, data.trip_id)
    elif data.split_method == SplitMethod.CUSTOM:
        splits = await _build_custom_splits(expense, data.splits or [])
    elif data.split_method == SplitMethod.PERCENTAGE:
        splits = await _build_percentage_splits(expense, data.splits or [])
    elif data.split_method == SplitMethod.SHARES:
        splits = await _build_shares_splits(expense, data.splits or [])
    else:
        splits = []

    db.add_all(splits)
    await db.commit()

    # Reload with splits
    result = await db.execute(
        select(Expense).where(Expense.id == expense.id).options(selectinload(Expense.splits))
    )
    return result.scalar_one()


async def get_expense(db: AsyncSession, expense_id: str) -> Optional[Expense]:
    result = await db.execute(
        select(Expense)
        .where(Expense.id == expense_id)
        .options(selectinload(Expense.splits))
    )
    return result.scalar_one_or_none()


async def get_expenses_by_trip(db: AsyncSession, trip_id: str) -> List[Expense]:
    result = await db.execute(
        select(Expense)
        .where(Expense.trip_id == trip_id)
        .options(selectinload(Expense.splits))
        .order_by(Expense.created_at.desc())
    )
    return list(result.scalars().all())


async def update_expense(
    db: AsyncSession, expense_id: str, data: ExpenseUpdate
) -> Optional[Expense]:
    expense = await get_expense(db, expense_id)
    if not expense:
        return None
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(expense, key, value)
    await db.commit()
    return await get_expense(db, expense_id)


async def delete_expense(db: AsyncSession, expense_id: str) -> bool:
    expense = await get_expense(db, expense_id)
    if not expense:
        return False
    await db.delete(expense)
    await db.commit()
    return True
