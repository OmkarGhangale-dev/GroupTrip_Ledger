import uuid
from sqlalchemy import ForeignKey, Float, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from models.base import TimestampMixin


class TwinModelState(Base, TimestampMixin):
    """Per-trip calibration learned from feedback (online learning, tiny)."""
    __tablename__ = "twin_model_state"

    trip_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("trips.id"), primary_key=True)
    bias: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    n_feedback: Mapped[int] = mapped_column(Integer, default=0, nullable=False)