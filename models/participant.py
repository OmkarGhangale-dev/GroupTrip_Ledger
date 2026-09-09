import datetime
import enum
import uuid

from sqlalchemy import (
    String,
    ForeignKey,
    Enum as SAEnum,
    DateTime,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from models.base import TimestampMixin
from models.associations import booking_participants


class ParticipantRole(str, enum.Enum):
    ORGANIZER = "organizer"
    MEMBER = "member"


class ParticipantStatus(str, enum.Enum):
    ACTIVE = "active"
    REMOVED = "removed"


class Participant(Base, TimestampMixin):

    __tablename__ = "participants"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    trip_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("trips.id"),
        nullable=False,
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
    UUID(as_uuid=True),
    ForeignKey("users.id", ondelete="SET NULL"),
    nullable=True,
    )
    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    email: Mapped[str] = mapped_column(
        String(254),
        nullable=False,
    )

    role: Mapped[ParticipantRole] = mapped_column(
    SAEnum(
        ParticipantRole,
        name="participant_role",
        values_callable=lambda enum_cls: [e.value for e in enum_cls],
    ),
    default=ParticipantRole.MEMBER,
    nullable=False,
    )

    status: Mapped[ParticipantStatus] = mapped_column(
    SAEnum(
        ParticipantStatus,
        name="participant_status",
        values_callable=lambda enum_cls: [e.value for e in enum_cls],
    ),
    default=ParticipantStatus.ACTIVE,
    nullable=False,
    )

    joined_at: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    left_at: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    trip = relationship(
        "Trip",
        back_populates="participants",
    )

    bookings = relationship(
        "Booking",
        secondary=booking_participants,
        back_populates="participants",
    )

    expenses_paid = relationship(
        "Expense",
        back_populates="paid_by_participant",
        foreign_keys="Expense.paid_by_id",
    )

    expense_splits = relationship(
        "ExpenseSplit",
        back_populates="participant",
    )

    payments_made = relationship(
        "Payment",
        back_populates="from_participant",
        foreign_keys="Payment.from_participant_id",
    )

    payments_received = relationship(
        "Payment",
        back_populates="to_participant",
        foreign_keys="Payment.to_participant_id",
    )

    settlements_from = relationship(
        "Settlement",
        back_populates="from_participant",
        foreign_keys="Settlement.from_participant_id",
    )

    settlements_to = relationship(
        "Settlement",
        back_populates="to_participant",
        foreign_keys="Settlement.to_participant_id",
    )