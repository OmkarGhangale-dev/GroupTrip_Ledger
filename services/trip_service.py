import uuid
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.trip import Trip
from schemas.trip import TripCreate, TripUpdate


async def create_trip(db: AsyncSession, data: TripCreate) -> Trip:
    trip = Trip(**data.model_dump())

    db.add(trip)
    await db.commit()
    await db.refresh(trip)

    return trip


async def get_trip(
    db: AsyncSession,
    trip_id: uuid.UUID
) -> Optional[Trip]:

    result = await db.execute(
        select(Trip).where(Trip.id == trip_id)
    )

    return result.scalar_one_or_none()


async def get_trips(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100
) -> List[Trip]:

    result = await db.execute(
        select(Trip)
        .offset(skip)
        .limit(limit)
        .order_by(Trip.created_at.desc())
    )

    return list(result.scalars().all())


async def update_trip(
    db: AsyncSession,
    trip_id: uuid.UUID,
    data: TripUpdate
) -> Optional[Trip]:

    trip = await get_trip(db, trip_id)

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
    trip_id: uuid.UUID
) -> bool:

    trip = await get_trip(db, trip_id)

    if not trip:
        return False

    await db.delete(trip)
    await db.commit()

    return True