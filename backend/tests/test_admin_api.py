import uuid
from datetime import datetime, timezone
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from backend.app.core.database import get_db
from backend.app.core.security import create_access_token
from backend.app.main import app
from backend.app.models.base import Base
from backend.app.models.enums import MediaStatus, MediaType, UserRole
from backend.app.models.external_id import ExternalID
from backend.app.models.ingestion import IngestionRun, IngestionStatus
from backend.app.models.media import Media
from backend.app.models.user import User


@pytest_asyncio.fixture
async def admin_test_env():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_maker = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

    admin_id = uuid.uuid4()
    regular_id = uuid.uuid4()
    run_id = uuid.uuid4()
    media_id = uuid.uuid4()

    async with session_maker() as session:
        # 1. Admin user
        admin = User(
            id=admin_id,
            username="superadmin",
            email="admin@example.com",
            hashed_password="hashed_pwd",
            role=UserRole.ADMIN,
            is_active=True,
        )
        # 2. Regular user
        regular = User(
            id=regular_id,
            username="regularuser",
            email="user@example.com",
            hashed_password="hashed_pwd",
            role=UserRole.USER,
            is_active=True,
        )
        # 3. Ingestion run with 2 errors
        failed_run = IngestionRun(
            id=run_id,
            provider="tmdb",
            job_type="metadata_sync",
            status=IngestionStatus.FAILED,
            started_at=datetime.now(timezone.utc),
            completed_at=datetime.now(timezone.utc),
            records_processed=10,
            records_created=8,
            records_updated=0,
            records_failed=2,
            error_details={"errors": ["Rate limit 429 on page 2", "Timeout"]},
        )
        # 4. Media & External ID for duplicate review
        media = Media(
            id=media_id,
            media_type=MediaType.MOVIE,
            title="Interstellar",
            original_title="Interstellar",
            status=MediaStatus.RELEASED,
        )
        ext = ExternalID(
            media_id=media_id,
            provider="tmdb",
            external_id="157336",
        )

        session.add_all([admin, regular, failed_run, media, ext])
        await session.commit()

    async def override_get_db():
        async with session_maker() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    admin_token = create_access_token({"sub": str(admin_id), "email": "admin@example.com", "role": "ADMIN"})
    user_token = create_access_token({"sub": str(regular_id), "email": "user@example.com", "role": "USER"})

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield {
            "client": client,
            "admin_headers": {"Authorization": f"Bearer {admin_token}"},
            "user_headers": {"Authorization": f"Bearer {user_token}"},
            "run_id": run_id,
        }

    app.dependency_overrides.clear()
    await engine.dispose()


@pytest.mark.asyncio
async def test_admin_route_authorization_enforcement(admin_test_env):
    client = admin_test_env["client"]
    user_headers = admin_test_env["user_headers"]
    admin_headers = admin_test_env["admin_headers"]

    # 1. Unauthenticated request -> 401
    unauth_res = await client.get("/api/v1/admin/ingestion/runs")
    assert unauth_res.status_code == 401

    # 2. Regular user request -> 403 Forbidden
    forbidden_res = await client.get("/api/v1/admin/ingestion/runs", headers=user_headers)
    assert forbidden_res.status_code == 403
    assert "Administrator privileges required" in forbidden_res.json()["detail"]

    # 3. Admin request -> 200 OK
    admin_res = await client.get("/api/v1/admin/ingestion/runs", headers=admin_headers)
    assert admin_res.status_code == 200
    assert admin_res.json()["total"] == 1


@pytest.mark.asyncio
async def test_admin_ingestion_run_details(admin_test_env):
    client = admin_test_env["client"]
    admin_headers = admin_test_env["admin_headers"]
    run_id = str(admin_test_env["run_id"])

    res = await client.get(f"/api/v1/admin/ingestion/runs/{run_id}", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == run_id
    assert data["provider"] == "tmdb"
    assert data["status"] == "FAILED"
    assert data["error_count"] == 2
    assert "Rate limit 429" in data["error_details"]["errors"][0]


@pytest.mark.asyncio
async def test_admin_safe_ingestion_retry(admin_test_env):
    client = admin_test_env["client"]
    admin_headers = admin_test_env["admin_headers"]
    run_id = str(admin_test_env["run_id"])

    # Trigger safe retry for failed run
    retry_res = await client.post(f"/api/v1/admin/ingestion/runs/{run_id}/retry", headers=admin_headers)
    assert retry_res.status_code == 200
    data = retry_res.json()
    assert data["status"] == "SUCCESS"
    assert data["retried_records"] == 2

    # Verify run is now updated in DB
    updated_run_res = await client.get(f"/api/v1/admin/ingestion/runs/{run_id}", headers=admin_headers)
    assert updated_run_res.status_code == 200
    assert updated_run_res.json()["status"] == "COMPLETED"
    assert updated_run_res.json()["error_count"] == 0
    assert updated_run_res.json()["success_count"] == 10


@pytest.mark.asyncio
async def test_admin_duplicate_candidates_review(admin_test_env):
    client = admin_test_env["client"]
    admin_headers = admin_test_env["admin_headers"]

    res = await client.get("/api/v1/admin/ingestion/duplicates", headers=admin_headers)
    assert res.status_code == 200
    candidates = res.json()
    assert len(candidates) >= 1
    assert candidates[0]["canonical_title"] == "Interstellar"
    assert candidates[0]["provider"] == "tmdb"
