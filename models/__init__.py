# Import all models so SQLAlchemy can discover them for metadata
from models.base import TimestampMixin, new_uuid  # noqa: F401
from models.trip import Trip, TripStatus  # noqa: F401
from models.participant import Participant, ParticipantRole, ParticipantStatus  # noqa: F401
from models.booking import Booking, BookingType, BookingStatus  # noqa: F401
from models.expense import Expense, ExpenseSplit, SplitMethod  # noqa: F401
from models.payment import Payment, Settlement, Refund, PaymentStatus  # noqa: F401
from models.itinerary import ItineraryItem, ItineraryItemType  # noqa: F401
from models.associations import (
    booking_participants,
    itinerary_participants,
)
