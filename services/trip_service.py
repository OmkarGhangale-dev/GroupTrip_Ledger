import uuid
from sqlalchemy import delete
from models.twin import TwinModelState
from models.invite import TripInvite
from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete, text
from models.twin import TwinModelState
from models.invite import TripInvite

from models.trip import Trip
from models.participant import Participant
from models.user import User
from schemas.trip import TripCreate, TripUpdate


async def create_trip(
    db: AsyncSession,
    data: TripCreate,
    current_user: User,
) -> Trip:

    trip = Trip(
        **data.model_dump(),
        organizer_id=current_user.id,
    )

    db.add(trip)
    await db.flush()

    # Automatically add the creator as a participant
    participant = Participant(
    trip_id=trip.id,
    user_id=current_user.id,
    name=current_user.name,
    email=current_user.email,
    role="organizer",
    status="active",
    joined_at=datetime.now(timezone.utc),
    )

    db.add(participant)

    await db.commit()
    await db.refresh(trip)

    return trip


async def get_trip(
    db: AsyncSession,
    trip_id: uuid.UUID,
    current_user: User,
) -> Optional[Trip]:

    result = await db.execute(
        select(Trip)
        .outerjoin(
            Participant,
            Participant.trip_id == Trip.id
        )
        .where(
            Trip.id == trip_id,
            or_(
                Trip.organizer_id == current_user.id,
                Participant.user_id == current_user.id,
                Participant.email == current_user.email,
            )
        )
    )

    return result.unique().scalar_one_or_none()


async def get_trips(
    db: AsyncSession,
    current_user: User,
    skip: int = 0,
    limit: int = 100,
) -> List[Trip]:

    result = await db.execute(
        select(Trip)
        .outerjoin(
            Participant,
            Participant.trip_id == Trip.id
        )
        .where(
            or_(
                Trip.organizer_id == current_user.id,
                Participant.user_id == current_user.id,
                Participant.email == current_user.email,
            )
        )
        .distinct()
        .offset(skip)
        .limit(limit)
        .order_by(Trip.created_at.desc())
    )

    return list(result.scalars().all())


async def update_trip(
    db: AsyncSession,
    trip_id: uuid.UUID,
    data: TripUpdate,
    current_user: User,
) -> Optional[Trip]:

    trip = await get_trip(db, trip_id, current_user)

    if not trip:
        return None

    update_data = data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(trip, key, value)

    await db.commit()
    await db.refresh(trip)

    return trip


async def delete_trip(
    db: AsyncSession,
    trip_id: uuid.UUID,
    current_user: User,
) -> bool:

    trip = await get_trip(db, trip_id, current_user)

    if not trip:
        return False

    p = {"tid": trip_id}
    people = "(SELECT id FROM participants WHERE trip_id = :tid)"
    trip_expenses = (
        "(SELECT id FROM expenses WHERE trip_id = :tid OR paid_by_id IN " + people + ")"
    )
    trip_bookings = "(SELECT id FROM bookings WHERE trip_id = :tid)"

    await db.execute(text(
        f"DELETE FROM refunds WHERE booking_id IN {trip_bookings} OR expense_id IN {trip_expenses}"), p)
    await db.execute(text(
        f"DELETE FROM expense_splits WHERE expense_id IN {trip_expenses} OR participant_id IN {people}"), p)
    await db.execute(text(
        f"DELETE FROM expenses WHERE trip_id = :tid OR paid_by_id IN {people}"), p)
    await db.execute(text(
        f"DELETE FROM payments WHERE trip_id = :tid OR from_participant_id IN {people} "
        f"OR to_participant_id IN {people}"), p)
    await db.execute(text(
        f"DELETE FROM settlements WHERE trip_id = :tid OR from_participant_id IN {people} "
        f"OR to_participant_id IN {people}"), p)
    await db.execute(text("DELETE FROM itinerary_items WHERE trip_id = :tid"), p)
    await db.execute(text("DELETE FROM bookings WHERE trip_id = :tid"), p)
    await db.execute(delete(TwinModelState).where(TwinModelState.trip_id == trip_id))
    await db.execute(delete(TripInvite).where(TripInvite.trip_id == trip_id))
    await db.execute(text("DELETE FROM notifications WHERE trip_id = :tid"), p)
    await db.execute(text("DELETE FROM participants WHERE trip_id = :tid"), p)
    await db.execute(text("DELETE FROM trips WHERE id = :tid"), p)

    await db.commit()
    db.expunge_all()

    return True