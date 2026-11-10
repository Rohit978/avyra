import uuid
from datetime import date
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from backend.app.core.database import get_db
from backend.app.core.security import create_access_token
from backend.app.main import app
from backend.app.models.base import Base
from backend.app.models.enums import MediaStatus, MediaType, UserRole, ViewingStatus
from backend.app.models.episode import Episode
from backend.app.models.media import Media
from backend.app.models.season import Season
from backend.app.models.user import User


@pytest_asyncio.fixture
async def watchlist_test_env():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_maker = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

    user_a_id = uuid.uuid4()
    user_b_id = uuid.uuid4()
    media_id = uuid.uuid4()
    episode_id = uuid.uuid4()

    async with session_maker() as session:
        # Create User A and User B
        user_a = User(
            id=user_a_id,
            username="alice",
            email="alice@example.com",
            hashed_password="hashed_pwd",
            role=UserRole.USER,
            is_active=True,
        )
        user_b = User(
            id=user_b_id,
            username="bob",
            email="bob@example.com",
            hashed_password="hashed_pwd",
            role=UserRole.USER,
            is_active=True,
        )
        session.add_all([user_a, user_b])
        await session.flush()

        # Create Media
        media = Media(
            id=media_id,
            media_type=MediaType.TV_SHOW,
            title="Arcane",
            overview="Two sisters fight on opposite sides of a war.",
            release_date=date(2021, 11, 6),
            status=MediaStatus.COMPLETED,
            popularity=99.0,
            vote_average=9.1,
            vote_count=25000,
        )
        session.add(media)
        await session.flush()

        # Season & Episode
        season = Season(
            id=uuid.uuid4(),
            media_id=media_id,
            season_number=1,
            title="Season 1",
            episode_count=9,
        )
        session.add(season)
        await session.flush()

        ep = Episode(
            id=episode_id,
            season_id=season.id,
            media_id=media_id,
            episode_number=1,
            title="Welcome to the Playground",
            runtime=40,
        )
        session.add(ep)
        await session.commit()

    async def override_get_db():
        async with session_maker() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    token_a = create_access_token({"sub": str(user_a_id), "email": "alice@example.com", "role": "USER"})
    token_b = create_access_token({"sub": str(user_b_id), "email": "bob@example.com", "role": "USER"})

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield {
            "client": client,
            "headers_a": {"Authorization": f"Bearer {token_a}"},
            "headers_b": {"Authorization": f"Bearer {token_b}"},
            "user_a_id": user_a_id,
            "user_b_id": user_b_id,
            "media_id": media_id,
            "episode_id": episode_id,
        }

    app.dependency_overrides.clear()
    await engine.dispose()


@pytest.mark.asyncio
async def test_watchlist_crud_lifecycle(watchlist_test_env):
    env = watchlist_test_env
    client = env["client"]
    headers = env["headers_a"]
    media_id = str(env["media_id"])

    # 1. Create Watchlist
    create_res = await client.post(
        "/api/v1/watchlists",
        headers=headers,
        json={"name": "Must Watch", "description": "Top priority queue", "is_default": True},
    )
    assert create_res.status_code == 201
    wl_data = create_res.json()
    wl_id = wl_data["id"]
    assert wl_data["name"] == "Must Watch"
    assert wl_data["item_count"] == 0

    # 2. Duplicate name under same user fails with 400
    dup_res = await client.post(
        "/api/v1/watchlists",
        headers=headers,
        json={"name": "Must Watch"},
    )
    assert dup_res.status_code == 400

    # 3. List watchlists
    list_res = await client.get("/api/v1/watchlists", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1

    # 4. Add item to watchlist
    add_item_res = await client.post(
        f"/api/v1/watchlists/{wl_id}/items",
        headers=headers,
        json={"media_id": media_id},
    )
    assert add_item_res.status_code == 201
    assert add_item_res.json()["media"]["title"] == "Arcane"

    # 5. Get detail with items
    detail_res = await client.get(f"/api/v1/watchlists/{wl_id}", headers=headers)
    assert detail_res.status_code == 200
    assert len(detail_res.json()["items"]) == 1

    # 6. Update watchlist name
    update_res = await client.put(
        f"/api/v1/watchlists/{wl_id}",
        headers=headers,
        json={"name": "Must Watch Immediately"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Must Watch Immediately"

    # 7. Remove item from watchlist
    del_item_res = await client.delete(f"/api/v1/watchlists/{wl_id}/items/{media_id}", headers=headers)
    assert del_item_res.status_code == 200

    # 8. Delete watchlist
    del_wl_res = await client.delete(f"/api/v1/watchlists/{wl_id}", headers=headers)
    assert del_wl_res.status_code == 200


@pytest.mark.asyncio
async def test_watchlist_strict_user_isolation(watchlist_test_env):
    env = watchlist_test_env
    client = env["client"]
    headers_a = env["headers_a"]
    headers_b = env["headers_b"]

    # Alice creates a list
    res_a = await client.post(
        "/api/v1/watchlists",
        headers=headers_a,
        json={"name": "Alice Private Queue"},
    )
    alice_wl_id = res_a.json()["id"]

    # Bob attempts to get Alice's list -> 404
    bob_get_res = await client.get(f"/api/v1/watchlists/{alice_wl_id}", headers=headers_b)
    assert bob_get_res.status_code == 404

    # Bob attempts to update Alice's list -> 404
    bob_put_res = await client.put(
        f"/api/v1/watchlists/{alice_wl_id}",
        headers=headers_b,
        json={"name": "Hacked List"},
    )
    assert bob_put_res.status_code == 404

    # Bob attempts to delete Alice's list -> 404
    bob_del_res = await client.delete(f"/api/v1/watchlists/{alice_wl_id}", headers=headers_b)
    assert bob_del_res.status_code == 404

    # Bob can create a list with the exact same name without conflict
    bob_create_res = await client.post(
        "/api/v1/watchlists",
        headers=headers_b,
        json={"name": "Alice Private Queue"},
    )
    assert bob_create_res.status_code == 201


@pytest.mark.asyncio
async def test_viewing_progress_and_episode_tracking(watchlist_test_env):
    env = watchlist_test_env
    client = env["client"]
    headers = env["headers_a"]
    media_id = str(env["media_id"])
    episode_id = str(env["episode_id"])

    # 1. Update media status to WATCHING with personal rating 9.5
    set_prog_res = await client.put(
        f"/api/v1/progress/media/{media_id}",
        headers=headers,
        json={"status": "WATCHING", "rating": 9.5},
    )
    assert set_prog_res.status_code == 200
    assert set_prog_res.json()["status"] == "WATCHING"
    assert set_prog_res.json()["rating"] == 9.5

    # 2. Get media status
    get_prog_res = await client.get(f"/api/v1/progress/media/{media_id}", headers=headers)
    assert get_prog_res.status_code == 200
    assert get_prog_res.json()["status"] == "WATCHING"

    # 3. Mark episode 1 as watched
    ep_prog_res = await client.put(
        f"/api/v1/progress/episodes/{episode_id}",
        headers=headers,
        json={"is_watched": True, "progress_seconds": 2400},
    )
    assert ep_prog_res.status_code == 200
    assert ep_prog_res.json()["is_watched"] is True
    assert ep_prog_res.json()["progress_seconds"] == 2400
    assert ep_prog_res.json()["completed_at"] is not None

    # 4. List watched episodes for media
    eps_list_res = await client.get(f"/api/v1/progress/media/{media_id}/episodes", headers=headers)
    assert eps_list_res.status_code == 200
    assert len(eps_list_res.json()) == 1
    assert eps_list_res.json()[0]["episode_id"] == episode_id
