from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from backend.app.core.config import settings

def normalize_async_url(url: str) -> str:
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    url = (
        url.replace("channel_binding=require&", "")
        .replace("&channel_binding=require", "")
        .replace("channel_binding=require", "")
        .replace("sslmode=require", "ssl=require")
    )
    return url

async_db_url = normalize_async_url(settings.DATABASE_URL)

# Create async engine with asyncpg
engine = create_async_engine(
    async_db_url,
    echo=(settings.ENVIRONMENT == "development_debug"),
    future=True,
    pool_pre_ping=True,
)

# Async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that yields an async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

