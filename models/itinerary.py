import datetime
import enum
import uuid

from sqlalchemy import (
    String,
    ForeignKey,
    Text,
    Time,
    Date,
    Enum as SAEnum,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from models.base import TimestampMixin

class ItineraryItemType(str, enum.Enum):
    ACCOMMODATION = "ACCOMMODATION"
    TRANSPORT = "TRANSPORT"
    ACTIVITY = "ACTIVITY"
    MEAL = "MEAL"
    FREE_TIME = "FREE_TIME"
    OTHER = "OTHER"


class ItineraryItem(Base, TimestampMixin):

    __tablename__ = "itinerary_items"

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

    booking_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("bookings.id"),
        nullable=True,
    )

    title: Mapped[str] = mapped_column(
        String(300),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    item_type: Mapped[str] = mapped_column(
    String(50),
    default="OTHER",
    nullable=False,
)

    date: Mapped[datetime.date | None] = mapped_column(
        Date,
        nullable=True,
    )

    start_time: Mapped[datetime.time | None] = mapped_column(
        Time,
        nullable=True,
    )

    end_time: Mapped[datetime.time | None] = mapped_column(
        Time,
        nullable=True,
    )

    location: Mapped[str | None] = mapped_column(
        String(400),
        nullable=True,
    )

    latitude: Mapped[float | None] = mapped_column(
        nullable=True,
    )

    longitude: Mapped[float | None] = mapped_column(
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    order_index: Mapped[int] = mapped_column(
        default=0,
        nullable=False,
    )

    trip = relationship(
        "Trip",
        back_populates="itinerary_items",
    )