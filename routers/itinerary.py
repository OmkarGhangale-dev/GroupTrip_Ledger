from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from schemas.itinerary import ItineraryItemCreate, ItineraryItemUpdate, ItineraryItemRead
import services.itinerary_service as svc

router = APIRouter(prefix="/itinerary", tags=["Itinerary"])


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


@router.post("/", response_model=ItineraryItemRead, status_code=status.HTTP_201_CREATED)
async def create_item(data: ItineraryItemCreate, db: AsyncSession = Depends(get_db)):
    return await svc.create_itinerary_item(db, data)


@router.get("/trip/{trip_id}", response_model=List[ItineraryItemRead])
async def list_items(trip_id: str, db: AsyncSession = Depends(get_db)):
    return await svc.get_itinerary_by_trip(db, trip_id)


@router.get("/{item_id}", response_model=ItineraryItemRead)
async def get_item(item_id: str, db: AsyncSession = Depends(get_db)):
    item = await svc.get_itinerary_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Itinerary item not found")
    return item


@router.patch("/{item_id}", response_model=ItineraryItemRead)
async def update_item(item_id: str, data: ItineraryItemUpdate, db: AsyncSession = Depends(get_db)):
    item = await svc.update_itinerary_item(db, item_id, data)
    if not item:
        raise HTTPException(status_code=404, detail="Itinerary item not found")
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(item_id: str, db: AsyncSession = Depends(get_db)):
    deleted = await svc.delete_itinerary_item(db, item_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Itinerary item not found")
