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
from backend.app.models.external_id import ExternalID
from backend.app.models.media import Media


@pytest_asyncio.fixture
async def playback_test_client():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_maker = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

    movie_id = uuid.uuid4()
    tv_id = uuid.uuid4()
    no_tmdb_id = uuid.uuid4()

    async with session_maker() as session:
        # 1. Movie with TMDB ID 550 (Fight Club)
        movie = Media(
            id=movie_id,
            media_type=MediaType.MOVIE,
            title="Fight Club",
            release_date=date(1999, 10, 15),
            status=MediaStatus.RELEASED,
        )
        movie_ext = ExternalID(
            media_id=movie_id,
            provider="tmdb",
            external_id="550",
        )

        # 2. TV Show with TMDB ID 1399 (Game of Thrones)
        tv = Media(
            id=tv_id,
            media_type=MediaType.TV_SHOW,
            title="Game of Thrones",
            release_date=date(2011, 4, 17),
            status=MediaStatus.COMPLETED,
        )
        tv_ext = ExternalID(
            media_id=tv_id,
            provider="tmdb",
            external_id="1399",
        )

        # 3. Media with only AniList ID (no TMDB ID)
        anime = Media(
            id=no_tmdb_id,
            media_type=MediaType.ANIME,
            title="Niche Anime Short",
            release_date=date(2022, 1, 1),
            status=MediaStatus.RELEASED,
        )
        anime_ext = ExternalID(
            media_id=no_tmdb_id,
            provider="anilist",
            external_id="99999",
        )

        session.add_all([movie, movie_ext, tv, tv_ext, anime, anime_ext])
        await session.commit()

    async def override_get_db():
        async with session_maker() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield {
            "client": client,
            "movie_id": movie_id,
            "tv_id": tv_id,
            "no_tmdb_id": no_tmdb_id,
        }

    app.dependency_overrides.clear()
    await engine.dispose()


@pytest.mark.asyncio
async def test_movie_playback_options(playback_test_client):
    client = playback_test_client["client"]
    movie_id = playback_test_client["movie_id"]

    res = await client.get(f"/api/v1/media/{movie_id}/playback-options")
    assert res.status_code == 200
    data = res.json()
    assert data["has_stream"] is True
    assert data["tmdb_id"] == "550"
    assert len(data["embed_sources"]) == 2

    # Check Vidbolt movie template
    vidbolt = next(s for s in data["embed_sources"] if "vidbolt" in s["id"])
    assert vidbolt["embed_url"] == "https://vidbolt.xyz/movie/550"
    assert vidbolt["domain"] == "vidbolt.xyz"
    assert vidbolt["is_primary"] is True

    # Check ReelsDownload template
    reels = next(s for s in data["embed_sources"] if "reelsdownload" in s["id"])
    assert "https://embed.reelsdownload.online/player/550" in reels["embed_url"]
    assert "key=k_5661ac637169a1733857dc50" in reels["embed_url"]

    # Security: sandbox policy must protect user
    assert "allow-scripts" in data["sandbox_policy"]
    assert "allow-top-navigation" not in data["sandbox_policy"]
    assert "allow-popups" not in data["sandbox_policy"]


@pytest.mark.asyncio
async def test_tv_episode_playback_options(playback_test_client):
    client = playback_test_client["client"]
    tv_id = playback_test_client["tv_id"]

    res = await client.get(f"/api/v1/media/{tv_id}/playback-options?season=2&episode=9")
    assert res.status_code == 200
    data = res.json()
    assert data["has_stream"] is True
    assert data["tmdb_id"] == "1399"
    assert data["season_number"] == 2
    assert data["episode_number"] == 9

    # Check Vidbolt TV template with season and episode numbers
    vidbolt = next(s for s in data["embed_sources"] if "vidbolt-tv" in s["id"])
    assert vidbolt["embed_url"] == "https://vidbolt.xyz/tv/1399/2/9"
    assert vidbolt["domain"] == "vidbolt.xyz"


@pytest.mark.asyncio
async def test_media_without_tmdb_id_fallback(playback_test_client):
    client = playback_test_client["client"]
    no_tmdb_id = playback_test_client["no_tmdb_id"]

    res = await client.get(f"/api/v1/media/{no_tmdb_id}/playback-options")
    assert res.status_code == 200
    data = res.json()
    assert data["has_stream"] is False
    assert len(data["embed_sources"]) == 0
    assert "No TMDB provider mapping available" in data["reason"]


@pytest.mark.asyncio
async def test_nonexistent_media_returns_404(playback_test_client):
    client = playback_test_client["client"]
    res = await client.get(f"/api/v1/media/{uuid.uuid4()}/playback-options")
    assert res.status_code == 404
