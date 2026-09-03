from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import create_all_tables

# Import all models so metadata is populated before create_all_tables
import models  # noqa: F401

from routers import trips, participants, bookings, expenses, payments, itinerary


# ---------------------------------------------------------------------------
# Lifespan – startup / shutdown
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables (use Alembic in production)
    await create_all_tables()
    yield
    # Shutdown: nothing to do


# ---------------------------------------------------------------------------
# Application
# ---------------------------------------------------------------------------

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "GroupTrip Ledger – manage group trips, split expenses, "
        "track bookings, and settle debts automatically."
    ),
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(trips.router, prefix="/api/v1")
app.include_router(participants.router, prefix="/api/v1")
app.include_router(bookings.router, prefix="/api/v1")
app.include_router(expenses.router, prefix="/api/v1")
app.include_router(payments.router, prefix="/api/v1")
app.include_router(itinerary.router, prefix="/api/v1")


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy"}
