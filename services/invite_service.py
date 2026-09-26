import datetime
import html
import secrets
import uuid

from fastapi import HTTPException
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from models.invite import TripInvite
from models.participant import Participant, ParticipantRole, ParticipantStatus
from models.trip import Trip
from models.user import User
from schemas.invite import InviteAccepted, InvitePreview
from services.email_service import send_email

INVITE_DAYS = 7


def _now() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc)


def invite_url(token: str) -> str:
    return f"{settings.FRONTEND_URL.rstrip('/')}/?invite={token}"


def _mask(email: str) -> str:
    name, _, domain = email.partition("@")
    return f"{name[:2]}***@{domain}"


def _invalid_reason(invite: TripInvite) -> str | None:
    if invite.status == "revoked":
        return "This invite was cancelled by the trip organizer."
    if invite.status == "accepted":
        return "This invite has already been used."
    if invite.expires_at < _now():
        return "This invite has expired. Ask the organizer for a new one."
    return None


async def _trip_as_organizer(db: AsyncSession, trip_id: uuid.UUID, user: User) -> Trip:
    result = await db.execute(select(Trip).where(Trip.id == trip_id))
    trip = result.scalar_one_or_none()
    if not trip:
        raise HTTPException(404, "Trip not found")
    if trip.organizer_id != user.id:
        raise HTTPException(403, "Only the trip organizer can invite people.")
    return trip


async def create_invite(
    db: AsyncSession, user: User, trip_id: uuid.UUID, email: str | None
):
    trip = await _trip_as_organizer(db, trip_id, user)
    email = email.lower().strip() if email else None

    if email:
        result = await db.execute(
            select(Participant).where(
                Participant.trip_id == trip_id,
                func.lower(Participant.email) == email,
                Participant.status == ParticipantStatus.ACTIVE,
            )
        )
        if result.scalars().first():
            raise HTTPException(400, f"{email} is already in this trip.")

    query = select(TripInvite).where(
        TripInvite.trip_id == trip_id,
        TripInvite.status == "pending",
        TripInvite.expires_at > _now(),
    )
    query = (
        query.where(TripInvite.email == email)
        if email
        else query.where(TripInvite.email.is_(None))
    )
    invite = (await db.execute(query)).scalars().first()

    if not invite:
        invite = TripInvite(
            trip_id=trip_id,
            invited_by_id=user.id,
            email=email,
            token=secrets.token_urlsafe(32),
            expires_at=_now() + datetime.timedelta(days=INVITE_DAYS),
        )
        db.add(invite)
        await db.commit()
        await db.refresh(invite)

    return invite, trip


async def send_invite_email(invite: TripInvite, trip: Trip, inviter: User) -> None:
    url = invite_url(invite.token)
    subject = f"{inviter.name} invited you to join {trip.name}"
    text = (
        f'{inviter.name} invited you to join the trip "{trip.name}" '
        f"({trip.destination}) on Pomaii.\n\n"
        f"Open this link and sign in with Google to accept:\n{url}\n\n"
        f"The link expires on {invite.expires_at:%d %b %Y}.\n"
    )
    h = html.escape
    body = f"""
<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#1f1b2e">
  <h2 style="margin:0 0 12px">You're invited to a trip</h2>
  <p><b>{h(inviter.name)}</b> invited you to join
     <b>{h(trip.name)}</b> ({h(trip.destination)}) on Pomaii.</p>
  <p style="margin:24px 0">
    <a href="{url}" style="background:#5b3fd6;color:#fff;padding:12px 22px;
       border-radius:8px;text-decoration:none;font-weight:bold">Accept invitation</a>
  </p>
  <p style="font-size:13px;color:#555">Sign in with Google to accept. This link expires
     on {invite.expires_at:%d %b %Y}.</p>
</div>"""
    await send_email(invite.email, subject, text, body)


async def list_invites(db: AsyncSession, user: User, trip_id: uuid.UUID):
    await _trip_as_organizer(db, trip_id, user)
    result = await db.execute(
        select(TripInvite)
        .where(
            TripInvite.trip_id == trip_id,
            TripInvite.status == "pending",
            TripInvite.expires_at > _now(),
        )
        .order_by(TripInvite.created_at.desc())
    )
    return list(result.scalars().all())


async def revoke_invite(db: AsyncSession, user: User, invite_id: uuid.UUID) -> None:
    result = await db.execute(select(TripInvite).where(TripInvite.id == invite_id))
    invite = result.scalar_one_or_none()
    if not invite:
        raise HTTPException(404, "Invite not found")
    await _trip_as_organizer(db, invite.trip_id, user)
    invite.status = "revoked"
    await db.commit()


async def preview_invite(db: AsyncSession, token: str) -> InvitePreview:
    result = await db.execute(select(TripInvite).where(TripInvite.token == token))
    invite = result.scalar_one_or_none()
    if not invite:
        return InvitePreview(valid=False, reason="This invite link is not valid.")

    trip = (
        await db.execute(select(Trip).where(Trip.id == invite.trip_id))
    ).scalar_one_or_none()
    inviter = None
    if invite.invited_by_id:
        inviter = (
            await db.execute(select(User).where(User.id == invite.invited_by_id))
        ).scalar_one_or_none()

    reason = _invalid_reason(invite)
    return InvitePreview(
        valid=reason is None and trip is not None,
        reason=reason,
        trip_name=trip.name if trip else None,
        destination=trip.destination if trip else None,
        invited_by=inviter.name if inviter else None,
        email=_mask(invite.email) if invite.email else None,
    )


async def accept_invite(db: AsyncSession, user: User, token: str) -> InviteAccepted:
    result = await db.execute(select(TripInvite).where(TripInvite.token == token))
    invite = result.scalar_one_or_none()
    if not invite:
        raise HTTPException(404, "This invite link is not valid.")

    reason = _invalid_reason(invite)
    if reason:
        raise HTTPException(410, reason)

    user_email = user.email.lower().strip()
    if invite.email and invite.email != user_email:
        raise HTTPException(
            403,
            f"This invite was sent to {_mask(invite.email)}. "
            "Sign in with that Google account to accept it.",
        )

    trip = (
        await db.execute(select(Trip).where(Trip.id == invite.trip_id))
    ).scalar_one_or_none()
    if not trip:
        raise HTTPException(404, "This trip no longer exists.")

    existing = (
        await db.execute(
            select(Participant).where(
                Participant.trip_id == trip.id,
                or_(
                    Participant.user_id == user.id,
                    func.lower(Participant.email) == user_email,
                ),
            )
        )
    ).scalars().first()

    already_member = False
    if existing:
        already_member = existing.status == ParticipantStatus.ACTIVE
        if not already_member:
            existing.status = ParticipantStatus.ACTIVE
            existing.left_at = None
        if existing.user_id is None:
            existing.user_id = user.id
    else:
        db.add(
            Participant(
                trip_id=trip.id,
                user_id=user.id,
                name=user.name,
                email=user_email,
                role=ParticipantRole.MEMBER,
                status=ParticipantStatus.ACTIVE,
                joined_at=_now(),
            )
        )

    if invite.email:  # personal invites are single use; open links stay valid
        invite.status = "accepted"
        invite.accepted_by_id = user.id
        invite.accepted_at = _now()

    await db.commit()
    return InviteAccepted(
        trip_id=trip.id, trip_name=trip.name, already_member=already_member
    )