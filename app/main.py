
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

from fastapi import  Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
# Import all models so metadata is populated before create_all_tables
import models  # noqa: F401

from routers import trips, participants, bookings, expenses, payments, itinerary, auth


# ---------------------------------------------------------------------------
# Lifespan – startup / shutdown
# ---------------------------------------------------------------------------

# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     # Startup: create tables (use Alembic in production)
#     await create_all_tables()
#     yield
#     # Shutdown: nothing to do


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
    # lifespan=lifespan,
)

# CORS — origins driven by ALLOWED_ORIGINS env var.
# Local dev defaults to "*"; production should be set to your Vercel domain.
_raw_origins = settings.ALLOWED_ORIGINS.strip()
_allowed_origins = (
    [o.strip() for o in _raw_origins.split(",") if o.strip()]
    if _raw_origins != "*"
    else ["*"]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(auth.router, prefix="/api/v1")
app.include_router(trips.router, prefix="/api/v1")
app.include_router(participants.router, prefix="/api/v1")
app.include_router(bookings.router, prefix="/api/v1")
app.include_router(expenses.router, prefix="/api/v1")
app.include_router(payments.router, prefix="/api/v1")
app.include_router(itinerary.router, prefix="/api/v1")


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/health/db", tags=["Health"])
async def database_health(
    db: AsyncSession = Depends(get_db)
):
    try:

        result = await db.execute(
            text("SELECT 1")
        )

        return {
            "status": "ok",
            "database": "PostgreSQL",
            "result": result.scalar(),
        }

    except Exception as e:

        return {
            "status": "error",
            "database": "PostgreSQL",
            "error": str(e),
        }