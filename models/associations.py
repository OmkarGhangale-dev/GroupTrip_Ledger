from sqlalchemy import Table, Column, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


booking_participants = Table(
    "booking_participants",
    Base.metadata,

    Column(
        "booking_id",
        UUID(as_uuid=True),
        ForeignKey("bookings.id", ondelete="CASCADE"),
        primary_key=True,
    ),

    Column(
        "participant_id",
        UUID(as_uuid=True),
        ForeignKey("participants.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


itinerary_participants = Table(
    "itinerary_participants",
    Base.metadata,

    Column(
        "itinerary_item_id",
        UUID(as_uuid=True),
        ForeignKey("itinerary_items.id", ondelete="CASCADE"),
        primary_key=True,
    ),

    Column(
        "participant_id",
        UUID(as_uuid=True),
        ForeignKey("participants.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)