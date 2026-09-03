import enum
from sqlalchemy import String, ForeignKey, Numeric, Text, Enum as SAEnum, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from models.base import TimestampMixin, new_uuid


class SplitMethod(str, enum.Enum):
    EQUAL = "equal"
    CUSTOM = "custom"
    PERCENTAGE = "percentage"
    SHARES = "shares"


class Expense(Base, TimestampMixin):
    __tablename__ = "expenses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    trip_id: Mapped[str] = mapped_column(String(36), ForeignKey("trips.id"), nullable=False)
    paid_by_id: Mapped[str] = mapped_column(String(36), ForeignKey("participants.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)
    category: Mapped[str | None] = mapped_column(String(100))
    split_method: Mapped[SplitMethod] = mapped_column(
        SAEnum(SplitMethod), default=SplitMethod.EQUAL, nullable=False
    )
    receipt_url: Mapped[str | None] = mapped_column(String(500))

    # Relationships
    trip = relationship("Trip", back_populates="expenses")
    paid_by_participant = relationship(
        "Participant", back_populates="expenses_paid", foreign_keys=[paid_by_id]
    )
    splits = relationship("ExpenseSplit", back_populates="expense", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Expense {self.title!r} ${self.amount}>"


class ExpenseSplit(Base, TimestampMixin):
    __tablename__ = "expense_splits"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    expense_id: Mapped[str] = mapped_column(String(36), ForeignKey("expenses.id"), nullable=False)
    participant_id: Mapped[str] = mapped_column(String(36), ForeignKey("participants.id"), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    percentage: Mapped[float | None] = mapped_column(Numeric(5, 2))
    shares: Mapped[int | None] = mapped_column()
    is_settled: Mapped[bool] = mapped_column(default=False, nullable=False)

    # Relationships
    expense = relationship("Expense", back_populates="splits")
    participant = relationship("Participant", back_populates="expense_splits")

    def __repr__(self) -> str:
        return f"<ExpenseSplit participant={self.participant_id} amount=${self.amount}>"
