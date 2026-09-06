import uuid
from typing import List, Optional

from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from models.booking import Booking, BookingStatus
from models.participant import Participant
from models.associations import booking_participants
from schemas.booking import BookingCreate, BookingUpdate
from models.expense import Expense, ExpenseSplit, SplitMethod

async def create_booking(
    db: AsyncSession,
    data: BookingCreate
) -> Booking:

    booking = Booking(
        trip_id=data.trip_id,
        booking_type=data.booking_type,
        provider=data.provider,
        description=data.description,
        amount=data.amount,
        status=data.status,
        cancellation_policy=data.cancellation_policy,
        reference_number=data.reference_number,
        start_datetime=data.start_datetime,
        end_datetime=data.end_datetime,
        location=data.location,
        latitude=data.latitude,
        longitude=data.longitude,
    )

    db.add(booking)
    await db.flush()

    # Add participants directly to association table
    if data.participant_ids:
        result = await db.execute(
            select(Participant.id).where(
                Participant.id.in_(data.participant_ids),
                Participant.trip_id == data.trip_id,
            )
        )

        participant_ids = [row[0] for row in result.all()]

        for participant_id in participant_ids:
            await db.execute(
                booking_participants.insert().values(
                    booking_id=booking.id,
                    participant_id=participant_id,
                )
            )

    await db.commit()

    # Reload booking with participants eagerly loaded
    result = await db.execute(
        select(Booking)
        .where(Booking.id == booking.id)
        .options(selectinload(Booking.participants))
    )

    return result.scalar_one()


async def get_booking(
    db: AsyncSession,
    booking_id: uuid.UUID
) -> Optional[Booking]:

    result = await db.execute(
        select(Booking)
        .where(Booking.id == booking_id)
        .options(selectinload(Booking.participants))
    )

    return result.scalar_one_or_none()


async def get_bookings_by_trip(
    db: AsyncSession,
    trip_id: uuid.UUID
) -> List[Booking]:

    result = await db.execute(
        select(Booking)
        .where(
            Booking.trip_id == trip_id,
            Booking.status != BookingStatus.REFUNDED
        )
        .options(
            selectinload(Booking.participants)
        )
        .order_by(Booking.created_at.desc())
    )

    return list(result.scalars().all())


async def update_booking(
    db: AsyncSession,
    booking_id: uuid.UUID,
    data: BookingUpdate
) -> Optional[Booking]:

    booking = await get_booking(db, booking_id)

    if not booking:
        return None

    update_data = data.model_dump(
        exclude_unset=True,
        exclude={"participant_ids"}
    )

    for key, value in update_data.items():
        setattr(booking, key, value)

    if data.participant_ids is not None:

        # Remove old relationships
        await db.execute(
            delete(booking_participants).where(
                booking_participants.c.booking_id == booking.id
            )
        )

        # Add new relationships
        if data.participant_ids:

            result = await db.execute(
                select(Participant.id).where(
                    Participant.id.in_(data.participant_ids),
                    Participant.trip_id == booking.trip_id,
                )
            )

            participant_ids = [row[0] for row in result.all()]

            for participant_id in participant_ids:
                await db.execute(
                    booking_participants.insert().values(
                        booking_id=booking.id,
                        participant_id=participant_id,
                    )
                )

    await db.commit()

    return await get_booking(db, booking_id)


async def delete_booking(
    db: AsyncSession,
    booking_id: uuid.UUID
) -> bool:

    booking = await get_booking(db, booking_id)

    if not booking:
        return False

    await db.delete(booking)
    await db.commit()

    return True

async def mark_booking_used(
    db: AsyncSession,
    booking_id: uuid.UUID,
    paid_by_id: uuid.UUID,
):
    # Get booking and its participants
    result = await db.execute(
        select(Booking)
        .where(Booking.id == booking_id)
        .options(selectinload(Booking.participants))
    )

    booking = result.scalar_one_or_none()

    if not booking:
        raise ValueError("Booking not found")

    # Prevent invalid status changes
    if booking.status == BookingStatus.COMPLETED:
        raise ValueError("Booking is already completed")

    if booking.status == BookingStatus.REFUNDED:
        raise ValueError("Refunded booking cannot be marked as used")

    if booking.status == BookingStatus.CANCELLED:
        raise ValueError("Cancelled booking cannot be marked as used")

    # Check that payer belongs to this trip
    payer_result = await db.execute(
        select(Participant).where(
            Participant.id == paid_by_id,
            Participant.trip_id == booking.trip_id
        )
    )

    payer = payer_result.scalar_one_or_none()

    if not payer:
        raise ValueError("Selected payer is not a participant of this trip")

    # Make sure booking has participants
    participants = list(booking.participants)

    if not participants:
        raise ValueError("Booking has no participants")

    # Mark booking as completed
    booking.status = BookingStatus.COMPLETED

    # Create expense
    expense = Expense(
        trip_id=booking.trip_id,
        booking_id=booking.id,
        paid_by_id=paid_by_id,
        title=f"{booking.provider or 'Booking'} - {booking.booking_type.value}",
        description=booking.description,
        amount=booking.amount,
        currency="INR",
        category="Booking",
        split_method=SplitMethod.EQUAL,
    )

    db.add(expense)

    # IMPORTANT:
    # Flush first so expense.id is generated
    await db.flush()

    # Divide booking amount equally
    split_amount = float(booking.amount) / len(participants)

    # Create expense splits
    for participant in participants:
        split = ExpenseSplit(
            expense_id=expense.id,
            participant_id=participant.id,
            amount=split_amount,
            is_settled=False,
        )

        db.add(split)

    # Save everything
    await db.commit()

    # Reload booking with participants
    result = await db.execute(
        select(Booking)
        .where(Booking.id == booking.id)
        .options(selectinload(Booking.participants))
    )

    return result.scalar_one()