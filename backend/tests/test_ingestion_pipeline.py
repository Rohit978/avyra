import pytest
import pytest_asyncio
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from backend.app.models.base import Base
from backend.app.models.enums import CreditType, MediaStatus, MediaType
from backend.app.models.external_id import ExternalID
from backend.app.models.media import Media
from backend.app.schemas.normalized import (
    NormalizedCreditDTO,
    NormalizedEpisodeDTO,
    NormalizedMediaDTO,
    NormalizedSeasonDTO,
    NormalizedTitleDTO,
)
from backend.app.ingestion.pipeline import IngestionPipeline


@pytest_asyncio.fixture
async def test_session():
    # SQLite async engine for fast in-memory unit tests
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_maker = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    async with session_maker() as session:
        yield session

    await engine.dispose()


@pytest.mark.asyncio
async def test_idempotent_media_upsert(test_session):
    pipeline = IngestionPipeline(test_session)

    dto = NormalizedMediaDTO(
        provider="tmdb",
        external_id="101",
        media_type=MediaType.MOVIE,
        title="Interstellar",
        original_title="Interstellar",
        overview="A team of explorers travel through a wormhole in space.",
        release_date=date(2014, 11, 7),
        status=MediaStatus.RELEASED,
        popularity=95.0,
        vote_average=8.7,
        vote_count=32000,
        genres=["Sci-Fi", "Drama"],
        titles=[
            NormalizedTitleDTO(title="Interstellar", title_type="primary", is_primary=True),
            NormalizedTitleDTO(title="インターステラー", title_type="native", language="ja"),
        ],
        seasons=[],
        credits=[
            NormalizedCreditDTO(
                person_name="Matthew McConaughey",
                credit_type=CreditType.CAST,
                character_name="Cooper",
            ),
            NormalizedCreditDTO(
                person_name="Christopher Nolan",
                credit_type=CreditType.CREW,
                job="Director",
            ),
        ],
    )

    # First upsert: creates record
    media1, created1 = await pipeline.upsert_media(dto)
    assert created1 is True
    assert media1.title == "Interstellar"
    assert media1.popularity == 95.0

    # Second upsert with updated popularity: updates existing record, creates NO new Media
    dto_updated = dto.model_copy(update={"popularity": 99.5, "overview": "Updated plot summary."})
    media2, created2 = await pipeline.upsert_media(dto_updated)
    assert created2 is False
    assert media2.id == media1.id
    assert media2.popularity == 99.5
    assert media2.overview == "Updated plot summary."


@pytest.mark.asyncio
async def test_batch_ingest_metrics(test_session):
    pipeline = IngestionPipeline(test_session)

    dtos = [
        NormalizedMediaDTO(
            provider="tmdb",
            external_id=f"item_{i}",
            media_type=MediaType.MOVIE,
            title=f"Movie {i}",
            popularity=10.0 + i,
        )
        for i in range(5)
    ]

    # Ingest 5 new items
    run1 = await pipeline.ingest_batch("tmdb", "test_popular", dtos)
    assert run1.records_processed == 5
    assert run1.records_created == 5
    assert run1.records_updated == 0
    assert run1.records_failed == 0
    assert run1.status.value == "COMPLETED"

    # Re-ingest the exact same 5 items: all should be updated, 0 created
    run2 = await pipeline.ingest_batch("tmdb", "test_popular", dtos)
    assert run2.records_processed == 5
    assert run2.records_created == 0
    assert run2.records_updated == 5
    assert run2.records_failed == 0
    assert run2.status.value == "COMPLETED"
