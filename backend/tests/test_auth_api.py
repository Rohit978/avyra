import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from backend.app.core.database import get_db
from backend.app.core.deps import require_admin
from backend.app.main import app
from backend.app.models.base import Base
from backend.app.models.enums import UserRole
from backend.app.models.user import User


@pytest_asyncio.fixture
async def auth_test_client():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_maker = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

    async def override_get_db():
        async with session_maker() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    # Test protected admin dummy endpoint for testing require_admin
    @app.get("/api/v1/test-admin-only")
    async def admin_only_endpoint(admin_user: User = pytest.importorskip("fastapi").Depends(require_admin)):
        return {"admin": admin_user.username}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client, session_maker

    app.dependency_overrides.clear()
    await engine.dispose()


@pytest.mark.asyncio
async def test_register_and_login_flow(auth_test_client):
    client, _ = auth_test_client

    # 1. Register
    reg_payload = {
        "username": "cinephile99",
        "email": "cinephile@example.com",
        "password": "Password1234!",
    }
    reg_res = await client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_payload["username"] == reg_res.json()["user"]["username"]
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == "cinephile@example.com"
    assert "access_token" in reg_res.cookies

    # 2. Duplicate registration fails
    dup_res = await client.post("/api/v1/auth/register", json=reg_payload)
    assert dup_res.status_code == 400
    assert "already taken" in dup_res.json()["detail"]

    # 3. Login with username
    login_user_res = await client.post(
        "/api/v1/auth/login",
        json={"login": "cinephile99", "password": "Password1234!"},
    )
    assert login_user_res.status_code == 200
    token = login_user_res.json()["access_token"]

    # 4. Login with email
    login_email_res = await client.post(
        "/api/v1/auth/login",
        json={"login": "cinephile@example.com", "password": "Password1234!"},
    )
    assert login_email_res.status_code == 200

    # 5. Login with invalid password fails
    bad_login_res = await client.post(
        "/api/v1/auth/login",
        json={"login": "cinephile@example.com", "password": "WrongPassword!"},
    )
    assert bad_login_res.status_code == 401


@pytest.mark.asyncio
async def test_auth_me_and_profile_update(auth_test_client):
    client, _ = auth_test_client

    # Register user
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={
            "username": "moviefan",
            "email": "moviefan@example.com",
            "password": "MySecretPass123!",
        },
    )
    assert reg_res.status_code == 201
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # GET /me with Bearer header
    me_res = await client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["username"] == "moviefan"

    # GET /me with cookie authentication (without Authorization header)
    cookie_me_res = await client.get("/api/v1/auth/me")
    assert cookie_me_res.status_code == 200
    assert cookie_me_res.json()["username"] == "moviefan"

    # Clear cookies to simulate unauthenticated request
    client.cookies.clear()

    # GET /me without auth or cookies fails 401
    unauth_res = await client.get("/api/v1/auth/me")
    assert unauth_res.status_code == 401

    # PUT /profile update username and avatar
    update_res = await client.put(
        "/api/v1/auth/profile",
        headers=headers,
        json={"username": "moviefan_updated", "avatar_url": "https://avatar.example.com/pic.jpg"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["username"] == "moviefan_updated"
    assert update_res.json()["avatar_url"] == "https://avatar.example.com/pic.jpg"

    # PUT /profile update password with invalid current_password fails
    pwd_fail_res = await client.put(
        "/api/v1/auth/profile",
        headers=headers,
        json={"current_password": "WrongCurrentPassword", "new_password": "BrandNewPassword99!"},
    )
    assert pwd_fail_res.status_code == 400

    # PUT /profile update password with correct current_password succeeds
    pwd_succ_res = await client.put(
        "/api/v1/auth/profile",
        headers=headers,
        json={"current_password": "MySecretPass123!", "new_password": "BrandNewPassword99!"},
    )
    assert pwd_succ_res.status_code == 200


@pytest.mark.asyncio
async def test_role_based_access_control(auth_test_client):
    client, session_maker = auth_test_client

    # 1. Register regular user
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"username": "regular_joe", "email": "joe@example.com", "password": "RegularJoe123!"},
    )
    token = reg_res.json()["access_token"]

    # Joe attempts admin route -> 403 Forbidden
    joe_res = await client.get("/api/v1/test-admin-only", headers={"Authorization": f"Bearer {token}"})
    assert joe_res.status_code == 403

    # 2. Promote Joe or create an Admin user in DB
    async with session_maker() as session:
        admin = User(
            username="admin_boss",
            email="boss@example.com",
            hashed_password="hashed_placeholder",
            role=UserRole.ADMIN,
            is_active=True,
        )
        session.add(admin)
        await session.commit()
        await session.refresh(admin)
        admin_id = admin.id

    from backend.app.core.security import create_access_token
    admin_token = create_access_token({"sub": str(admin_id), "role": "ADMIN", "email": "boss@example.com"})

    # Admin access -> 200 OK
    admin_res = await client.get("/api/v1/test-admin-only", headers={"Authorization": f"Bearer {admin_token}"})
    assert admin_res.status_code == 200
    assert admin_res.json()["admin"] == "admin_boss"


@pytest.mark.asyncio
async def test_logout_endpoint(auth_test_client):
    client, _ = auth_test_client
    response = await client.post("/api/v1/auth/logout")
    assert response.status_code == 200
    assert response.json()["message"] == "Successfully logged out."
