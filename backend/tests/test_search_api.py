import uuid
from datetime import date
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from backend.app.core.database import get_db
from backend.app.main import app
from backend.app.models.base import Base
from backend.app.models.enums import MediaStatus, MediaType
from backend.app.models.genre import Genre
from backend.app.models.media import Media


@pytest_asyncio.fixture
async def search_api_client():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_maker = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

    async with session_maker() as session:
        # Seed test data
        scifi = Genre(name="Science Fiction", slug="science-fiction")
        session.add(scifi)
        await session.flush()

        media1 = Media(
            id=uuid.uuid4(),
            media_type=MediaType.MOVIE,
            title="The Matrix",
            original_title="The Matrix",
            overview="Neo discovers reality is a simulation.",
            release_date=date(1999, 3, 31),
            status=MediaStatus.RELEASED,
            popularity=92.5,
            vote_average=8.7,
            vote_count=26000,
        )
        media1.genres.append(scifi)

        media2 = Media(
            id=uuid.uuid4(),
            media_type=MediaType.MOVIE,
            title="The Matrix Reloaded",
            original_title="The Matrix Reloaded",
            overview="Neo and the rebel leaders estimate machine attack.",
            release_date=date(2003, 5, 15),
            status=MediaStatus.RELEASED,
            popularity=65.0,
            vote_average=7.2,
            vote_count=12000,
        )
        media2.genres.append(scifi)

        session.add_all([media1, media2])
        await session.commit()

    async def override_get_db():
        async with session_maker() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

    app.dependency_overrides.clear()
    await engine.dispose()


@pytest.mark.asyncio
async def test_search_endpoint_success(search_api_client: AsyncClient):
    response = await search_api_client.get("/api/v1/search?q=Matrix")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert data["page"] == 1
    assert data["limit"] == 20
    assert len(data["items"]) == 2
    assert data["items"][0]["title"] == "The Matrix"
    assert "Science Fiction" in data["items"][0]["genres"]


@pytest.mark.asyncio
async def test_search_endpoint_with_filters(search_api_client: AsyncClient):
    # Filter with year 1999
    response = await search_api_client.get("/api/v1/search?q=Matrix&year=1999")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["title"] == "The Matrix"

    # Filter with non-matching year
    response_empty = await search_api_client.get("/api/v1/search?q=Matrix&year=2020")
    assert response_empty.status_code == 200
    assert response_empty.json()["total"] == 0


@pytest.mark.asyncio
async def test_search_suggestions_endpoint(search_api_client: AsyncClient):
    response = await search_api_client.get("/api/v1/search/suggestions?q=Matr&limit=5")
    assert response.status_code == 200
    suggestions = response.json()
    assert len(suggestions) == 2
    assert suggestions[0]["title"] == "The Matrix"
    assert suggestions[0]["vote_average"] == 8.7


@pytest.mark.asyncio
async def test_search_endpoint_validation_errors(search_api_client: AsyncClient):
    # Missing required 'q' parameter should fail with 422
    response = await search_api_client.get("/api/v1/search")
    assert response.status_code == 422

    # Missing 'q' for suggestions should also fail with 422
    sugg_response = await search_api_client.get("/api/v1/search/suggestions")
    assert sugg_response.status_code == 422
