import enum
import uuid
import datetime
from sqlalchemy import (
    ForeignKey,
    Numeric,
    String,
    Text,
    Enum as SAEnum,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from models.base import TimestampMixin


# =========================================================
# Split Method
# =========================================================

class SplitMethod(str, enum.Enum):
    EQUAL = "equal"
    CUSTOM = "custom"
    PERCENTAGE = "percentage"
    SHARES = "shares"


# =========================================================
# Expense
# =========================================================

class Expense(Base, TimestampMixin):

    __tablename__ = "expenses"

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

    paid_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("participants.id"),
        nullable=False,
    )

    title: Mapped[str] = mapped_column(
        String(300),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    amount: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    currency: Mapped[str] = mapped_column(
        String(10),
        default="INR",
        nullable=False,
    )

    category: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    split_method: Mapped[SplitMethod] = mapped_column(
    SAEnum(
        SplitMethod,
        name="split_method",
        values_callable=lambda enum_cls: [e.value for e in enum_cls],
    ),
    default=SplitMethod.EQUAL,
    nullable=False,
    )
    receipt_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    expense_date: Mapped[datetime.date | None] = mapped_column(
    nullable=True,
    )

    # =====================================================
    # Relationships
    # =====================================================

    trip = relationship(
        "Trip",
        back_populates="expenses",
    )

    paid_by_participant = relationship(
        "Participant",
        back_populates="expenses_paid",
        foreign_keys=[paid_by_id],
    )

    booking = relationship(
        "Booking",
        foreign_keys=[booking_id],
    )

    splits = relationship(
        "ExpenseSplit",
        back_populates="expense",
        cascade="all, delete-orphan",
    )


# =========================================================
# Expense Split
# =========================================================

class ExpenseSplit(Base, TimestampMixin):

    __tablename__ = "expense_splits"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    expense_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("expenses.id"),
        nullable=False,
    )

    participant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("participants.id"),
        nullable=False,
    )

    amount: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    percentage: Mapped[float | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
    )

    shares: Mapped[int | None] = mapped_column(
        nullable=True,
    )

    is_settled: Mapped[bool] = mapped_column(
        default=False,
        nullable=False,
    )

    # =====================================================
    # Relationships
    # =====================================================

    expense = relationship(
        "Expense",
        back_populates="splits",
    )

    participant = relationship(
        "Participant",
        back_populates="expense_splits",
    )