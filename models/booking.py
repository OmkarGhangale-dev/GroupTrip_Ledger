import enum
from sqlalchemy import String, ForeignKey, Numeric, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from models.base import TimestampMixin, new_uuid


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

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    trip_id: Mapped[str] = mapped_column(String(36), ForeignKey("trips.id"), nullable=False)
    participant_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("participants.id"))
    booking_type: Mapped[BookingType] = mapped_column(SAEnum(BookingType), nullable=False)
    provider: Mapped[str | None] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    status: Mapped[BookingStatus] = mapped_column(
        SAEnum(BookingStatus), default=BookingStatus.CONFIRMED, nullable=False
    )
    cancellation_policy: Mapped[str | None] = mapped_column(Text)
    reference_number: Mapped[str | None] = mapped_column(String(100))

    # Relationships
    trip = relationship("Trip", back_populates="bookings")
    participant = relationship("Participant", back_populates="bookings")
    refunds = relationship("Refund", back_populates="booking",
                           primaryjoin="Refund.booking_id == Booking.id")

    def __repr__(self) -> str:
        return f"<Booking {self.booking_type} ${self.amount} ({self.status})>"
