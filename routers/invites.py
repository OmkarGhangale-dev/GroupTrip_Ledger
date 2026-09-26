import uuid
from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from models.user import User
from schemas.invite import (
    InviteAccepted,
    InviteCreate,
    InviteCreated,
    InvitePreview,
    InviteRead,
)
from utils.deps import get_current_user
import services.invite_service as svc

router = APIRouter(prefix="/invites", tags=["Invites"])


@router.get("/preview/{token}", response_model=InvitePreview)
async def preview_invite(token: str, db: AsyncSession = Depends(get_db)):
    return await svc.preview_invite(db, token)


@router.post("/accept/{token}", response_model=InviteAccepted)
async def accept_invite(
    token: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await svc.accept_invite(db, current_user, token)


@router.post(
    "/trip/{trip_id}",
    response_model=InviteCreated,
    status_code=status.HTTP_201_CREATED,
)
async def create_invite(
    trip_id: uuid.UUID,
    data: InviteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    invite, trip = await svc.create_invite(db, current_user, trip_id, data.email)

    sent, error = False, None
    if invite.email:
        try:
            await svc.send_invite_email(invite, trip, current_user)
            sent = True
        except Exception as e:  # keep the invite; the UI offers the link instead
            error = str(e)[:200]

    return InviteCreated(
        id=invite.id,
        invite_url=svc.invite_url(invite.token),
        email=invite.email,
        expires_at=invite.expires_at,
        email_sent=sent,
        email_error=error,
    )


@router.get("/trip/{trip_id}", response_model=List[InviteRead])
async def list_invites(
    trip_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await svc.list_invites(db, current_user, trip_id)


@router.delete("/{invite_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_invite(
    invite_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await svc.revoke_invite(db, current_user, invite_id)