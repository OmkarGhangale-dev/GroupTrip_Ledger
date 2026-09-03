from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal


async def get_db() -> AsyncSession:
    """Shared FastAPI dependency that yields an async DB session."""
    async with AsyncSessionLocal() as session:
        yield session
