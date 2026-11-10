import uuid
from datetime import date
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from backend.app.models.base import Base
from backend.app.models.enums import MediaStatus, MediaType
from backend.app.models.genre import Genre
from backend.app.models.media import Media
from backend.app.models.title import MediaTitle
from backend.app.services.search import SearchService


@pytest_asyncio.fixture
async def search_test_db():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_maker = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    async with session_maker() as session:
        # Populate test data
        action_genre = Genre(name="Action", slug="action")
        scifi_genre = Genre(name="Sci-Fi", slug="sci-fi")
        session.add_all([action_genre, scifi_genre])
        await session.flush()

        # Movie 1: Inception
        inception = Media(
            id=uuid.uuid4(),
            media_type=MediaType.MOVIE,
            title="Inception",
            original_title="Inception",
            overview="A thief who steals corporate secrets through dream-sharing technology.",
            release_date=date(2010, 7, 16),
            status=MediaStatus.RELEASED,
            popularity=85.5,
            vote_average=8.8,
            vote_count=35000,
        )
        inception.genres.extend([action_genre, scifi_genre])

        # Movie 2: Inception The Making Of
        inception_doc = Media(
            id=uuid.uuid4(),
            media_type=MediaType.DOCUMENTARY,
            title="Inception: The Cobol Job",
            original_title="Inception: The Cobol Job",
            overview="Prequel animated short.",
            release_date=date(2010, 12, 1),
            status=MediaStatus.RELEASED,
            popularity=12.0,
            vote_average=7.1,
            vote_count=500,
        )

        # Movie 3: Attack on Titan with Japanese alternate title
        aot = Media(
            id=uuid.uuid4(),
            media_type=MediaType.ANIME,
            title="Attack on Titan",
            original_title="Shingeki no Kyojin",
            overview="Humanity fights giants.",
            release_date=date(2013, 4, 7),
            status=MediaStatus.RELEASED,
            popularity=98.0,
            vote_average=9.0,
            vote_count=20000,
        )
        aot.genres.append(action_genre)

        session.add_all([inception, inception_doc, aot])
        await session.flush()

        # Add alternate title for Attack on Titan
        aot_alt = MediaTitle(
            media_id=aot.id,
            title="Shingeki no Kyojin: The Final Season",
            title_type="alternate",
            language="ja",
        )
        session.add(aot_alt)
        await session.commit()

        yield session

    await engine.dispose()


@pytest.mark.asyncio
async def test_search_canonical_title_exact_ranking(search_test_db: AsyncSession):
    # Searching 'Inception' should return both 'Inception' and 'Inception: The Cobol Job',
    # with exact match 'Inception' ranked first
    results = await SearchService.search_media(search_test_db, query="Inception")
    assert results.total == 2
    assert results.items[0].title == "Inception"
    assert results.items[1].title == "Inception: The Cobol Job"
    assert "Action" in results.items[0].genres


@pytest.mark.asyncio
async def test_search_alternate_title_match(search_test_db: AsyncSession):
    # Searching for Japanese romaji 'Shingeki' should find Attack on Titan
    results = await SearchService.search_media(search_test_db, query="Shingeki")
    assert results.total == 1
    assert results.items[0].title == "Attack on Titan"
    assert results.items[0].media_type == MediaType.ANIME


@pytest.mark.asyncio
async def test_search_filters_media_type_and_year(search_test_db: AsyncSession):
    # Searching 'Inception' with media_type=DOCUMENTARY should return only the doc
    results = await SearchService.search_media(
        search_test_db,
        query="Inception",
        media_type=MediaType.DOCUMENTARY,
    )
    assert results.total == 1
    assert results.items[0].title == "Inception: The Cobol Job"

    # Searching with non-matching year
    no_results = await SearchService.search_media(
        search_test_db,
        query="Inception",
        year=1999,
    )
    assert no_results.total == 0


@pytest.mark.asyncio
async def test_get_search_suggestions(search_test_db: AsyncSession):
    suggestions = await SearchService.get_search_suggestions(search_test_db, query="Incep", limit=5)
    assert len(suggestions) == 2
    # First suggestion should be Inception due to popularity and prefix
    assert suggestions[0].title == "Inception"
    assert suggestions[0].vote_average == 8.8


@pytest.mark.asyncio
async def test_empty_query_returns_empty_response(search_test_db: AsyncSession):
    empty_res = await SearchService.search_media(search_test_db, query="   ")
    assert empty_res.total == 0
    assert len(empty_res.items) == 0

    suggestions = await SearchService.get_search_suggestions(search_test_db, query="")
    assert suggestions == []
