import enum
from sqlalchemy import String, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from models.base import TimestampMixin, new_uuid


class ParticipantRole(str, enum.Enum):
    ORGANIZER = "organizer"
    MEMBER = "member"


class ParticipantStatus(str, enum.Enum):
    ACTIVE = "active"
    REMOVED = "removed"


class Participant(Base, TimestampMixin):
    __tablename__ = "participants"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    trip_id: Mapped[str] = mapped_column(String(36), ForeignKey("trips.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(254), nullable=False)
    role: Mapped[ParticipantRole] = mapped_column(
        SAEnum(ParticipantRole), default=ParticipantRole.MEMBER, nullable=False
    )
    status: Mapped[ParticipantStatus] = mapped_column(
        SAEnum(ParticipantStatus), default=ParticipantStatus.ACTIVE, nullable=False
    )

    # Relationships
    trip = relationship("Trip", back_populates="participants")
    expenses_paid = relationship("Expense", back_populates="paid_by_participant",
                                  foreign_keys="Expense.paid_by_id")
    expense_splits = relationship("ExpenseSplit", back_populates="participant")
    payments_made = relationship("Payment", back_populates="from_participant",
                                  foreign_keys="Payment.from_participant_id")
    payments_received = relationship("Payment", back_populates="to_participant",
                                      foreign_keys="Payment.to_participant_id")
    settlements_from = relationship("Settlement", back_populates="from_participant",
                                     foreign_keys="Settlement.from_participant_id")
    settlements_to = relationship("Settlement", back_populates="to_participant",
                                   foreign_keys="Settlement.to_participant_id")
    bookings = relationship("Booking", back_populates="participant")

    def __repr__(self) -> str:
        return f"<Participant {self.name!r} ({self.role})>"
