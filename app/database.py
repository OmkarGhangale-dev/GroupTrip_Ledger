import ssl as _ssl
import urllib.parse

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    create_async_engine,
    async_sessionmaker,
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from app.config import settings


def _sanitize_db_url(url: str) -> str:
    """
    Ensure the database URL uses the asyncpg driver and does not contain
    query parameters unsupported by asyncpg (such as sslmode or channel_binding).
    """
    if not url:
        return ""
    if url.startswith("postgres://"):
        url = "postgresql+asyncpg://" + url[len("postgres://"):]
    elif url.startswith("postgresql://"):
        url = "postgresql+asyncpg://" + url[len("postgresql://"):]

    try:
        parsed = urllib.parse.urlparse(url)
        query_params = urllib.parse.parse_qs(parsed.query)
        # asyncpg does not take sslmode or channel_binding kwargs
        query_params.pop("sslmode", None)
        query_params.pop("channel_binding", None)
        new_query = urllib.parse.urlencode(query_params, doseq=True)
        return urllib.parse.urlunparse((
            parsed.scheme,
            parsed.netloc,
            parsed.path,
            parsed.params,
            new_query,
            parsed.fragment,
        ))
    except Exception:
        return url


def _build_connect_args(db_url: str) -> dict:
    """
    Build asyncpg connect_args.
    - search_path is always set so SQLAlchemy models (which have no
      explicit schema) resolve to the 'grouptrip' schema.
    - SSL is enabled for any non-localhost database (i.e. Neon in production)
      to satisfy the `sslmode=require` requirement, while keeping local dev
      running without SSL overhead.
    """
    is_local = any(
        host in db_url
        for host in ("localhost", "127.0.0.1", "::1")
    )

    args: dict = {
        "server_settings": {
            "search_path": "grouptrip,public",
        }
    }

    if not is_local:
        try:
            ctx = _ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = _ssl.CERT_NONE
            args["ssl"] = ctx
        except Exception:
            # If SSL context creation fails (e.g. no CA bundle), fall back
            args["ssl"] = True

    return args


class Base(DeclarativeBase):
    pass


# ---------------------------------------------------------------------------
# Lazy engine & session factory — created on first use, not at import time.
# This prevents crashes during Vercel cold-start module loading.
# ---------------------------------------------------------------------------

_engine = None
_session_factory = None


def _get_engine():
    global _engine
    if _engine is None:
        cleaned_url = _sanitize_db_url(settings.effective_database_url)
        _engine = create_async_engine(
            cleaned_url,
            echo=settings.DEBUG,
            future=True,
            poolclass=NullPool,
            connect_args=_build_connect_args(cleaned_url),
        )
    return _engine


def _get_session_factory():
    global _session_factory
    if _session_factory is None:
        _session_factory = async_sessionmaker(
            bind=_get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False,
        )
    return _session_factory


class AsyncSessionLocal:
    """
    Drop-in proxy for async_sessionmaker that creates the factory lazily.
    Usage: async with AsyncSessionLocal() as session: ...
    """
    def __call__(self):
        return _get_session_factory()()

    def __await__(self):
        raise TypeError("Use 'async with AsyncSessionLocal() as session:'")


# Instantiate singleton proxy for backward compatibility
AsyncSessionLocal = AsyncSessionLocal()


async def get_db():
    """FastAPI dependency that yields a database session."""
    factory = _get_session_factory()
    async with factory() as session:
        yield session