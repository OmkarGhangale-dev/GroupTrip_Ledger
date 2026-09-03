# GroupTrip Ledger – Backend

A fully async FastAPI backend for managing group trips, splitting expenses, tracking bookings, and settling debts.

## Tech Stack

- **FastAPI** – web framework
- **SQLAlchemy 2.x async** – ORM
- **SQLite + aiosqlite** – dev database (swap to PostgreSQL + asyncpg in prod)
- **Pydantic v2** – schemas and validation
- **Uvicorn** – ASGI server

## Project Structure

```
backend/
├── app/
│   ├── config.py       # Settings via pydantic-settings
│   ├── database.py     # Async engine, session, Base
│   └── main.py         # FastAPI app + lifespan
├── models/
│   ├── __init__.py     # Re-exports all models
│   ├── base.py         # TimestampMixin, new_uuid()
│   ├── trip.py
│   ├── participant.py
│   ├── booking.py
│   ├── expense.py      # Expense + ExpenseSplit
│   ├── payment.py      # Payment + Settlement + Refund
│   └── itinerary.py
├── schemas/            # Pydantic request/response models
│   ├── trip.py
│   ├── participant.py
│   ├── booking.py
│   ├── expense.py
│   ├── payment.py
│   └── itinerary.py
├── services/           # Business logic layer
│   ├── trip_service.py
│   ├── participants_service.py
│   ├── booking_service.py
│   ├── expense_service.py  # Smart split engine
│   ├── payment_service.py  # Balance + settlement engine
│   └── itinerary_service.py
├── routers/            # FastAPI route handlers
│   ├── trips.py
│   ├── participants.py
│   ├── bookings.py
│   ├── expenses.py
│   ├── payments.py
│   └── itinerary.py
├── utils/
│   └── deps.py         # Shared DB dependency
├── .env
└── requiremnets.txt
```

## Quick Start

```bash
# Install dependencies
pip install -r requiremnets.txt

# Run dev server
uvicorn app.main:app --reload

# Open API docs
# http://localhost:8000/docs
```

## API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/v1/trips/` | Create trip |
| GET | `/api/v1/trips/` | List trips |
| GET | `/api/v1/trips/{id}` | Get trip |
| PATCH | `/api/v1/trips/{id}` | Update trip |
| DELETE | `/api/v1/trips/{id}` | Delete trip |
| POST | `/api/v1/participants/` | Add participant |
| GET | `/api/v1/participants/trip/{trip_id}` | List participants |
| PATCH | `/api/v1/participants/{id}` | Update participant |
| DELETE | `/api/v1/participants/{id}` | Remove participant |
| POST | `/api/v1/bookings/` | Create booking |
| GET | `/api/v1/bookings/trip/{trip_id}` | List bookings |
| POST | `/api/v1/expenses/` | Add expense (auto-splits!) |
| GET | `/api/v1/expenses/trip/{trip_id}` | List expenses |
| GET | `/api/v1/trips/{trip_id}/balances` | Get net balances per person |
| GET | `/api/v1/trips/{trip_id}/settlements` | Get minimal settlement suggestions |
| POST | `/api/v1/payments/` | Record a payment |
| POST | `/api/v1/itinerary/` | Add itinerary item |
| GET | `/api/v1/itinerary/trip/{trip_id}` | Get itinerary |

## Split Methods

When creating an expense, set `split_method`:
- `equal` – divide equally among all active participants (default)
- `custom` – specify exact `amount` per participant in `splits[]`
- `percentage` – specify `percentage` per participant in `splits[]`
- `shares` – specify `shares` count per participant in `splits[]`

## Environment Variables

Copy `.env` and configure:
```env
DATABASE_URL=sqlite+aiosqlite:///./grouptrip.db  # or PostgreSQL
GEMINI_API_KEY=...
GOOGLE_MAPS_API_KEY=...
EMAIL_API_KEY=...
```
