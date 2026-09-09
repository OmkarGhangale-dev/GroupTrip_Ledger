import ssl as _ssl

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    create_async_engine,
    async_sessionmaker,
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from app.config import settings


def _build_connect_args() -> dict:
    """
    Build asyncpg connect_args.
    - search_path is always set so SQLAlchemy models (which have no
      explicit schema) resolve to the 'grouptrip' schema.
    - SSL is enabled for any non-localhost database (i.e. Neon in production)
      to satisfy the `sslmode=require` requirement, while keeping local dev
      running without SSL overhead.
    """
    is_local = any(
        host in settings.DATABASE_URL
        for host in ("localhost", "127.0.0.1", "::1")
    )

    args: dict = {
        "server_settings": {
            "search_path": "grouptrip,public",
        }
    }

    if not is_local:
        # Create a permissive SSL context that verifies the server cert
        # using the system trust store (Neon uses valid certificates).
        ctx = _ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = _ssl.CERT_NONE
        args["ssl"] = ctx

    return args


# NullPool is the recommended pool for serverless environments:
# - Each request gets a fresh connection (no stale state between invocations)
# - Neon's connection pooler (PgBouncer) handles the actual DB-side pooling
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
    poolclass=NullPool,
    connect_args=_build_connect_args(),
)


AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session