from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from schemas.participant import ParticipantCreate, ParticipantUpdate, ParticipantRead
import services.participants_service as svc

router = APIRouter(prefix="/participants", tags=["Participants"])


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


@router.post("/", response_model=ParticipantRead, status_code=status.HTTP_201_CREATED)
async def create_participant(data: ParticipantCreate, db: AsyncSession = Depends(get_db)):
    return await svc.create_participant(db, data)


@router.get("/trip/{trip_id}", response_model=List[ParticipantRead])
async def list_participants(trip_id: str, db: AsyncSession = Depends(get_db)):
    return await svc.get_participants_by_trip(db, trip_id)


@router.get("/{participant_id}", response_model=ParticipantRead)
async def get_participant(participant_id: str, db: AsyncSession = Depends(get_db)):
    p = await svc.get_participant(db, participant_id)
    if not p:
        raise HTTPException(status_code=404, detail="Participant not found")
    return p


@router.patch("/{participant_id}", response_model=ParticipantRead)
async def update_participant(
    participant_id: str, data: ParticipantUpdate, db: AsyncSession = Depends(get_db)
):
    p = await svc.update_participant(db, participant_id, data)
    if not p:
        raise HTTPException(status_code=404, detail="Participant not found")
    return p


@router.delete("/{participant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_participant(participant_id: str, db: AsyncSession = Depends(get_db)):
    deleted = await svc.delete_participant(db, participant_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Participant not found")
