from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from models.participant import Participant
from schemas.participant import ParticipantCreate, ParticipantUpdate


async def create_participant(db: AsyncSession, data: ParticipantCreate) -> Participant:
    participant = Participant(**data.model_dump())
    db.add(participant)
    await db.commit()
    await db.refresh(participant)
    return participant


async def get_participant(db: AsyncSession, participant_id: str) -> Optional[Participant]:
    result = await db.execute(select(Participant).where(Participant.id == participant_id))
    return result.scalar_one_or_none()


async def get_participants_by_trip(db: AsyncSession, trip_id: str) -> List[Participant]:
    result = await db.execute(
        select(Participant).where(Participant.trip_id == trip_id).order_by(Participant.created_at)
    )
    return list(result.scalars().all())


async def update_participant(
    db: AsyncSession, participant_id: str, data: ParticipantUpdate
) -> Optional[Participant]:
    participant = await get_participant(db, participant_id)
    if not participant:
        return None
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(participant, key, value)
    await db.commit()
    await db.refresh(participant)
    return participant


async def delete_participant(db: AsyncSession, participant_id: str) -> bool:
    participant = await get_participant(db, participant_id)
    if not participant:
        return False
    await db.delete(participant)
    await db.commit()
    return True
