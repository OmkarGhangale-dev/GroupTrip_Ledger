from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from schemas.booking import (
    BookingCreate,
    BookingUpdate,
    BookingRead,
)
import services.booking_service as svc


router = APIRouter(
    prefix="/bookings",
    tags=["Bookings"]
)


@router.post(
    "/",
    response_model=BookingRead,
    status_code=status.HTTP_201_CREATED
)
async def create_booking(
    data: BookingCreate,
    db: AsyncSession = Depends(get_db)
):
    return await svc.create_booking(
        db,
        data
    )


@router.get(
    "/trip/{trip_id}",
    response_model=List[BookingRead]
)
async def list_bookings(
    trip_id: str,
    db: AsyncSession = Depends(get_db)
):
    return await svc.get_bookings_by_trip(
        db,
        trip_id
    )


@router.get(
    "/{booking_id}",
    response_model=BookingRead
)
async def get_booking(
    booking_id: str,
    db: AsyncSession = Depends(get_db)
):
    booking = await svc.get_booking(
        db,
        booking_id
    )

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    return booking


@router.patch(
    "/{booking_id}",
    response_model=BookingRead
)
async def update_booking(
    booking_id: str,
    data: BookingUpdate,
    db: AsyncSession = Depends(get_db)
):
    booking = await svc.update_booking(
        db,
        booking_id,
        data
    )

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    return booking


@router.delete(
    "/{booking_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
async def delete_booking(
    booking_id: str,
    db: AsyncSession = Depends(get_db)
):
    deleted = await svc.delete_booking(
        db,
        booking_id
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )