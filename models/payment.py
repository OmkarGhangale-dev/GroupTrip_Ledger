import enum
from sqlalchemy import String, ForeignKey, Numeric, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from models.base import TimestampMixin, new_uuid


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class Payment(Base, TimestampMixin):
    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    trip_id: Mapped[str] = mapped_column(String(36), ForeignKey("trips.id"), nullable=False)
    from_participant_id: Mapped[str] = mapped_column(String(36), ForeignKey("participants.id"), nullable=False)
    to_participant_id: Mapped[str] = mapped_column(String(36), ForeignKey("participants.id"), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)
    note: Mapped[str | None] = mapped_column(Text)
    status: Mapped[PaymentStatus] = mapped_column(
        SAEnum(PaymentStatus), default=PaymentStatus.COMPLETED, nullable=False
    )

    # Relationships
    trip = relationship("Trip", back_populates="payments")
    from_participant = relationship(
        "Participant", back_populates="payments_made", foreign_keys=[from_participant_id]
    )
    to_participant = relationship(
        "Participant", back_populates="payments_received", foreign_keys=[to_participant_id]
    )

    def __repr__(self) -> str:
        return f"<Payment ${self.amount} from={self.from_participant_id} to={self.to_participant_id}>"


class Settlement(Base, TimestampMixin):
    __tablename__ = "settlements"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    trip_id: Mapped[str] = mapped_column(String(36), ForeignKey("trips.id"), nullable=False)
    from_participant_id: Mapped[str] = mapped_column(String(36), ForeignKey("participants.id"), nullable=False)
    to_participant_id: Mapped[str] = mapped_column(String(36), ForeignKey("participants.id"), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)
    note: Mapped[str | None] = mapped_column(Text)

    # Relationships
    trip = relationship("Trip", back_populates="settlements")
    from_participant = relationship(
        "Participant", back_populates="settlements_from", foreign_keys=[from_participant_id]
    )
    to_participant = relationship(
        "Participant", back_populates="settlements_to", foreign_keys=[to_participant_id]
    )

    def __repr__(self) -> str:
        return f"<Settlement ${self.amount}>"


class Refund(Base, TimestampMixin):
    __tablename__ = "refunds"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    booking_id: Mapped[str] = mapped_column(String(36), ForeignKey("bookings.id"), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    reason: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)

    # Relationships
    booking = relationship("Booking", back_populates="refunds")

    def __repr__(self) -> str:
        return f"<Refund ${self.amount} booking={self.booking_id}>"
