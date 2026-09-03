import datetime
import enum
import uuid

from sqlalchemy import (
    String,
    Text,
    Date,
    Numeric,
    Enum as SAEnum,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from models.base import TimestampMixin


class TripStatus(str, enum.Enum):
    PLANNING = "planning"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Trip(Base, TimestampMixin):

    __tablename__ = "trips"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    destination: Mapped[str] = mapped_column(
        String(300),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    start_date: Mapped[datetime.date | None] = mapped_column(
        Date,
        nullable=True,
    )

    end_date: Mapped[datetime.date | None] = mapped_column(
        Date,
        nullable=True,
    )

    currency: Mapped[str] = mapped_column(
        String(10),
        default="INR",
        nullable=False,
    )

    budget: Mapped[float | None] = mapped_column(
        Numeric(12, 2),
        nullable=True,
    )

    status: Mapped[TripStatus] = mapped_column(
        SAEnum(
            TripStatus,
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
        ),
        default=TripStatus.PLANNING,
        nullable=False,
    )

    organizer_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
    )

    participants = relationship(
        "Participant",
        back_populates="trip",
    )

    bookings = relationship(
        "Booking",
        back_populates="trip",
    )

    expenses = relationship(
        "Expense",
        back_populates="trip",
    )

    payments = relationship(
        "Payment",
        back_populates="trip",
    )

    settlements = relationship(
        "Settlement",
        back_populates="trip",
    )

    itinerary_items = relationship(
        "ItineraryItem",
        back_populates="trip",
    )