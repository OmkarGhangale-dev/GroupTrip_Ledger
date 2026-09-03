import enum
import datetime
from sqlalchemy import String, Text, Date, Numeric, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from models.base import TimestampMixin, new_uuid


class TripStatus(str, enum.Enum):
    PLANNING = "planning"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Trip(Base, TimestampMixin):
    __tablename__ = "trips"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    destination: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    start_date: Mapped[datetime.date | None] = mapped_column(Date)
    end_date: Mapped[datetime.date | None] = mapped_column(Date)
    currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)
    budget: Mapped[float | None] = mapped_column(Numeric(12, 2))
    status: Mapped[TripStatus] = mapped_column(
        SAEnum(TripStatus), default=TripStatus.PLANNING, nullable=False
    )

    # Relationships
    participants = relationship("Participant", back_populates="trip", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="trip", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="trip", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="trip", cascade="all, delete-orphan")
    settlements = relationship("Settlement", back_populates="trip", cascade="all, delete-orphan")
    itinerary_items = relationship("ItineraryItem", back_populates="trip", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Trip {self.name!r} ({self.status})>"
