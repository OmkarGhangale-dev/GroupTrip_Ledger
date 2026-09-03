from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from schemas.trip import TripCreate, TripUpdate, TripRead
import services.trip_service as svc

router = APIRouter(prefix="/trips", tags=["Trips"])


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


@router.post("/", response_model=TripRead, status_code=status.HTTP_201_CREATED)
async def create_trip(data: TripCreate, db: AsyncSession = Depends(get_db)):
    return await svc.create_trip(db, data)


@router.get("/", response_model=List[TripRead])
async def list_trips(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    return await svc.get_trips(db, skip=skip, limit=limit)


@router.get("/{trip_id}", response_model=TripRead)
async def get_trip(trip_id: str, db: AsyncSession = Depends(get_db)):
    trip = await svc.get_trip(db, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@router.patch("/{trip_id}", response_model=TripRead)
async def update_trip(trip_id: str, data: TripUpdate, db: AsyncSession = Depends(get_db)):
    trip = await svc.update_trip(db, trip_id, data)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trip(trip_id: str, db: AsyncSession = Depends(get_db)):
    deleted = await svc.delete_trip(db, trip_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Trip not found")
