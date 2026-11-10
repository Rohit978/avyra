import uuid
from datetime import date, timedelta
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
async def discovery_api_client():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_maker = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

    async with session_maker() as session:
        sci_fi = Genre(name="Sci-Fi", slug="sci-fi")
        animation = Genre(name="Animation", slug="animation")
        session.add_all([sci_fi, animation])
        await session.flush()

        today = date.today()

        # Item 1: High popularity released movie
        dune = Media(
            id=uuid.uuid4(),
            media_type=MediaType.MOVIE,
            title="Dune: Part Two",
            overview="Paul Atreides unites with the Fremen.",
            release_date=date(2024, 3, 1),
            status=MediaStatus.RELEASED,
            popularity=120.0,
            vote_average=8.5,
            vote_count=9000,
        )
        dune.genres.append(sci_fi)

        # Item 2: High rated anime
        frieren = Media(
            id=uuid.uuid4(),
            media_type=MediaType.ANIME,
            title="Frieren: Beyond Journey's End",
            overview="An elf mage embarks on a journey.",
            release_date=date(2023, 9, 29),
            status=MediaStatus.COMPLETED,
            popularity=95.0,
            vote_average=9.3,
            vote_count=4500,
        )
        frieren.genres.extend([sci_fi, animation])

        # Item 3: Upcoming TV Show
        upcoming_show = Media(
            id=uuid.uuid4(),
            media_type=MediaType.TV_SHOW,
            title="Future Odyssey",
            overview="Humanity's next voyage into the unknown.",
            release_date=today + timedelta(days=90),
            status=MediaStatus.UPCOMING,
            popularity=40.0,
            vote_average=0.0,
            vote_count=0,
        )

        session.add_all([dune, frieren, upcoming_show])
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
async def test_browse_media_catalogue(discovery_api_client: AsyncClient):
    response = await discovery_api_client.get("/api/v1/media")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 3
    # Sorted by popularity desc by default: Dune (120) > Frieren (95) > Future Odyssey (40)
    assert data["items"][0]["title"] == "Dune: Part Two"
    assert data["items"][1]["title"] == "Frieren: Beyond Journey's End"


@pytest.mark.asyncio
async def test_browse_media_filters(discovery_api_client: AsyncClient):
    # Filter by media_type=ANIME
    anime_res = await discovery_api_client.get("/api/v1/media?media_type=ANIME")
    assert anime_res.status_code == 200
    anime_data = anime_res.json()
    assert anime_data["total"] == 1
    assert anime_data["items"][0]["title"] == "Frieren: Beyond Journey's End"

    # Filter by genre=Animation
    genre_res = await discovery_api_client.get("/api/v1/media?genre=Animation")
    assert genre_res.status_code == 200
    assert genre_res.json()["total"] == 1

    # Filter by year=2024
    year_res = await discovery_api_client.get("/api/v1/media?year=2024")
    assert year_res.status_code == 200
    assert year_res.json()["total"] == 1
    assert year_res.json()["items"][0]["title"] == "Dune: Part Two"


@pytest.mark.asyncio
async def test_browse_media_sorting(discovery_api_client: AsyncClient):
    # Sort by vote_average descending
    response = await discovery_api_client.get("/api/v1/media?sort_by=vote_average&sort_order=desc")
    assert response.status_code == 200
    data = response.json()
    assert data["items"][0]["title"] == "Frieren: Beyond Journey's End"  # 9.3 rating


@pytest.mark.asyncio
async def test_curated_trending_and_popular(discovery_api_client: AsyncClient):
    res_trending = await discovery_api_client.get("/api/v1/media/curated/trending")
    assert res_trending.status_code == 200
    assert res_trending.json()["items"][0]["title"] == "Dune: Part Two"

    res_popular = await discovery_api_client.get("/api/v1/media/curated/popular")
    assert res_popular.status_code == 200
    assert res_popular.json()["items"][0]["title"] == "Dune: Part Two"


@pytest.mark.asyncio
async def test_curated_top_rated(discovery_api_client: AsyncClient):
    response = await discovery_api_client.get("/api/v1/media/curated/top-rated")
    assert response.status_code == 200
    data = response.json()
    # Frieren has vote_average=9.3 and vote_count > 0
    assert data["items"][0]["title"] == "Frieren: Beyond Journey's End"


@pytest.mark.asyncio
async def test_curated_upcoming(discovery_api_client: AsyncClient):
    response = await discovery_api_client.get("/api/v1/media/curated/upcoming")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["title"] == "Future Odyssey"


@pytest.mark.asyncio
async def test_curated_invalid_collection_error(discovery_api_client: AsyncClient):
    response = await discovery_api_client.get("/api/v1/media/curated/nonexistent")
    assert response.status_code == 400
    assert "Invalid collection" in response.json()["detail"]
