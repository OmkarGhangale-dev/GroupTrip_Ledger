import datetime
import enum
from sqlalchemy import String, ForeignKey, Text, Time, Enum as SAEnum, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from models.base import TimestampMixin, new_uuid


class ItineraryItemType(str, enum.Enum):
    ACCOMMODATION = "accommodation"
    TRANSPORT = "transport"
    ACTIVITY = "activity"
    MEAL = "meal"
    FREE_TIME = "free_time"
    OTHER = "other"


class ItineraryItem(Base, TimestampMixin):
    __tablename__ = "itinerary_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    trip_id: Mapped[str] = mapped_column(String(36), ForeignKey("trips.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    item_type: Mapped[ItineraryItemType] = mapped_column(
        SAEnum(ItineraryItemType), default=ItineraryItemType.OTHER, nullable=False
    )
    date: Mapped[datetime.date | None] = mapped_column(Date)
    start_time: Mapped[datetime.time | None] = mapped_column(Time)
    end_time: Mapped[datetime.time | None] = mapped_column(Time)
    location: Mapped[str | None] = mapped_column(String(400))
    notes: Mapped[str | None] = mapped_column(Text)
    order_index: Mapped[int] = mapped_column(default=0, nullable=False)

    # Relationships
    trip = relationship("Trip", back_populates="itinerary_items")

    def __repr__(self) -> str:
        return f"<ItineraryItem {self.title!r} on {self.date}>"
