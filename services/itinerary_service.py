import uuid
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.itinerary import ItineraryItem
from schemas.itinerary import ItineraryItemCreate, ItineraryItemUpdate


async def create_itinerary_item(
    db: AsyncSession,
    data: ItineraryItemCreate
) -> ItineraryItem:

    item = ItineraryItem(**data.model_dump())

    db.add(item)
    await db.commit()
    await db.refresh(item)

    return item


async def get_itinerary_item(
    db: AsyncSession,
    item_id: uuid.UUID
) -> Optional[ItineraryItem]:

    result = await db.execute(
        select(ItineraryItem)
        .where(ItineraryItem.id == item_id)
    )

    return result.scalar_one_or_none()


async def get_itinerary_by_trip(
    db: AsyncSession,
    trip_id: uuid.UUID
) -> List[ItineraryItem]:

    result = await db.execute(
        select(ItineraryItem)
        .where(ItineraryItem.trip_id == trip_id)
        .order_by(
            ItineraryItem.date,
            ItineraryItem.order_index
        )
    )

    return list(result.scalars().all())


async def update_itinerary_item(
    db: AsyncSession,
    item_id: uuid.UUID,
    data: ItineraryItemUpdate
) -> Optional[ItineraryItem]:

    item = await get_itinerary_item(db, item_id)

    if not item:
        return None

    update_data = data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(item, key, value)

    await db.commit()
    await db.refresh(item)

    return item


async def delete_itinerary_item(
    db: AsyncSession,
    item_id: uuid.UUID
) -> bool:

    item = await get_itinerary_item(db, item_id)

    if not item:
        return False

    await db.delete(item)
    await db.commit()

    return True