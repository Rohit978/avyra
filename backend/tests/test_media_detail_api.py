import uuid
from datetime import date
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from backend.app.core.database import get_db
from backend.app.main import app
from backend.app.models.base import Base
from backend.app.models.credit import Credit
from backend.app.models.enums import CreditType, MediaStatus, MediaType
from backend.app.models.episode import Episode
from backend.app.models.external_id import ExternalID
from backend.app.models.genre import Genre
from backend.app.models.media import Media
from backend.app.models.person import Person
from backend.app.models.season import Season
from backend.app.models.title import MediaTitle


@pytest_asyncio.fixture
async def media_detail_client():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_maker = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

    media_id = uuid.uuid4()
    person_id = uuid.uuid4()
    director_id = uuid.uuid4()

    async with session_maker() as session:
        # Genre
        sci_fi = Genre(name="Sci-Fi", slug="sci-fi")
        session.add(sci_fi)
        await session.flush()

        # Canonical Media
        media = Media(
            id=media_id,
            media_type=MediaType.TV_SHOW,
            title="Dark",
            original_title="Dark",
            overview="A missing child sets four families on a frantic hunt for answers.",
            release_date=date(2017, 12, 1),
            runtime=60,
            original_language="de",
            country_of_origin="DE",
            status=MediaStatus.COMPLETED,
            popularity=88.0,
            vote_average=8.8,
            vote_count=18000,
            poster_url="https://image.tmdb.org/t/p/w500/dark_poster.jpg",
            backdrop_url="https://image.tmdb.org/t/p/original/dark_backdrop.jpg",
        )
        media.genres.append(sci_fi)
        session.add(media)
        await session.flush()

        # External ID / Provenance
        ext_tmdb = ExternalID(
            media_id=media_id,
            provider="tmdb",
            external_id="70523",
        )
        session.add(ext_tmdb)

        # Alternate Title
        alt_title = MediaTitle(
            media_id=media_id,
            title="Dark - Winden",
            title_type="alternate",
            language="de",
        )
        session.add(alt_title)

        # People & Credits
        actor = Person(
            id=person_id,
            name="Louis Hofmann",
            original_name="Louis Hofmann",
            profile_path="/louis.jpg",
        )
        director = Person(
            id=director_id,
            name="Baran bo Odar",
            original_name="Baran bo Odar",
            profile_path="/baran.jpg",
        )
        session.add_all([actor, director])
        await session.flush()

        credit_cast = Credit(
            media_id=media_id,
            person_id=person_id,
            credit_type=CreditType.CAST,
            character_name="Jonas Kahnwald",
            order=0,
        )
        credit_crew = Credit(
            media_id=media_id,
            person_id=director_id,
            credit_type=CreditType.CREW,
            department="Directing",
            job="Director",
            order=0,
        )
        session.add_all([credit_cast, credit_crew])

        # Season and Episode
        season1 = Season(
            id=uuid.uuid4(),
            media_id=media_id,
            season_number=1,
            title="Season 1",
            overview="Secrets of Winden unravel.",
            episode_count=1,
            air_date=date(2017, 12, 1),
        )
        session.add(season1)
        await session.flush()

        ep1 = Episode(
            id=uuid.uuid4(),
            season_id=season1.id,
            media_id=media_id,
            episode_number=1,
            title="Secrets",
            overview="In 2019, a local boy's disappearance stokes fear in Winden.",
            still_path="/secrets.jpg",
            air_date=date(2017, 12, 1),
            runtime=52,
        )
        session.add(ep1)

        await session.commit()

    async def override_get_db():
        async with session_maker() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client, media_id

    app.dependency_overrides.clear()
    await engine.dispose()


@pytest.mark.asyncio
async def test_get_media_detail_success(media_detail_client):
    client, media_id = media_detail_client
    response = await client.get(f"/api/v1/media/{media_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(media_id)
    assert data["title"] == "Dark"
    assert data["original_language"] == "de"
    assert "Sci-Fi" in data["genres"]
    assert len(data["titles"]) == 1
    assert data["titles"][0]["title"] == "Dark - Winden"
    assert len(data["provenance"]) == 1
    assert data["provenance"][0]["provider"] == "tmdb"
    assert data["provenance"][0]["external_id"] == "70523"
    assert data["season_count"] == 1
    assert data["episode_count"] == 1


@pytest.mark.asyncio
async def test_get_media_detail_not_found(media_detail_client):
    client, _ = media_detail_client
    random_id = uuid.uuid4()
    response = await client.get(f"/api/v1/media/{random_id}")
    assert response.status_code == 404
    assert response.json()["detail"] == "Media item not found"


@pytest.mark.asyncio
async def test_get_media_credits_success(media_detail_client):
    client, media_id = media_detail_client
    response = await client.get(f"/api/v1/media/{media_id}/credits")
    assert response.status_code == 200
    data = response.json()
    assert len(data["cast"]) == 1
    assert data["cast"][0]["name"] == "Louis Hofmann"
    assert data["cast"][0]["character_name"] == "Jonas Kahnwald"
    assert len(data["crew"]) == 1
    assert data["crew"][0]["name"] == "Baran bo Odar"
    assert data["crew"][0]["job"] == "Director"


@pytest.mark.asyncio
async def test_get_media_seasons_and_episodes(media_detail_client):
    client, media_id = media_detail_client

    # 1. Seasons list
    res_seasons = await client.get(f"/api/v1/media/{media_id}/seasons")
    assert res_seasons.status_code == 200
    seasons = res_seasons.json()
    assert len(seasons) == 1
    assert seasons[0]["season_number"] == 1

    # 2. Season detail with episodes
    res_s1 = await client.get(f"/api/v1/media/{media_id}/seasons/1")
    assert res_s1.status_code == 200
    s1_data = res_s1.json()
    assert s1_data["season_number"] == 1
    assert len(s1_data["episodes"]) == 1
    assert s1_data["episodes"][0]["title"] == "Secrets"

    # 3. Episode detail
    res_ep1 = await client.get(f"/api/v1/media/{media_id}/seasons/1/episodes/1")
    assert res_ep1.status_code == 200
    ep1_data = res_ep1.json()
    assert ep1_data["episode_number"] == 1
    assert ep1_data["title"] == "Secrets"
    assert ep1_data["runtime"] == 52

    # 4. Nonexistent season & episode 404s
    res_s99 = await client.get(f"/api/v1/media/{media_id}/seasons/99")
    assert res_s99.status_code == 404

    res_ep99 = await client.get(f"/api/v1/media/{media_id}/seasons/1/episodes/99")
    assert res_ep99.status_code == 404
