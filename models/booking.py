import datetime
import enum
import uuid

from sqlalchemy import (
    ForeignKey,
    Numeric,
    String,
    Text,
    DateTime,
    Enum as SAEnum,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from models.base import TimestampMixin
from models.associations import booking_participants


class BookingType(str, enum.Enum):
    FLIGHT = "flight"
    HOTEL = "hotel"
    ACTIVITY = "activity"
    TRANSPORT = "transport"
    OTHER = "other"


class BookingStatus(str, enum.Enum):
    CONFIRMED = "confirmed"
    PENDING = "pending"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class Booking(Base, TimestampMixin):

    __tablename__ = "bookings"

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

    booking_type: Mapped[BookingType] = mapped_column(
        SAEnum(
            BookingType,
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
        ),
        nullable=False,
    )

    provider: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    amount: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    status: Mapped[BookingStatus] = mapped_column(
        SAEnum(
            BookingStatus,
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
        ),
        default=BookingStatus.CONFIRMED,
        nullable=False,
    )

    cancellation_policy: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    reference_number: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    start_datetime: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    end_datetime: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    location: Mapped[str | None] = mapped_column(
        String(400),
        nullable=True,
    )

    latitude: Mapped[float | None] = mapped_column(
        Numeric(10, 7),
        nullable=True,
    )

    longitude: Mapped[float | None] = mapped_column(
        Numeric(10, 7),
        nullable=True,
    )

    trip = relationship(
        "Trip",
        back_populates="bookings",
    )

    participants = relationship(
        "Participant",
        secondary=booking_participants,
        back_populates="bookings",
    )

    refunds = relationship(
        "Refund",
        back_populates="booking",
        cascade="all, delete-orphan",
    )