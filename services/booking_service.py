from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from models.booking import Booking
from schemas.booking import BookingCreate, BookingUpdate


async def create_booking(db: AsyncSession, data: BookingCreate) -> Booking:
    booking = Booking(**data.model_dump())
    db.add(booking)
    await db.commit()
    await db.refresh(booking)
    return booking


async def get_booking(db: AsyncSession, booking_id: str) -> Optional[Booking]:
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    return result.scalar_one_or_none()


async def get_bookings_by_trip(db: AsyncSession, trip_id: str) -> List[Booking]:
    result = await db.execute(
        select(Booking).where(Booking.trip_id == trip_id).order_by(Booking.created_at.desc())
    )
    return list(result.scalars().all())


async def update_booking(
    db: AsyncSession, booking_id: str, data: BookingUpdate
) -> Optional[Booking]:
    booking = await get_booking(db, booking_id)
    if not booking:
        return None
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(booking, key, value)
    await db.commit()
    await db.refresh(booking)
    return booking


async def delete_booking(db: AsyncSession, booking_id: str) -> bool:
    booking = await get_booking(db, booking_id)
    if not booking:
        return False
    await db.delete(booking)
    await db.commit()
    return True
