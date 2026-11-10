# Phase 7: User Authentication & Security - Context

## Requirements
- **AUTH-01**: User can register an account with username, email, and password hashed using Argon2id.
- **AUTH-02**: User can securely log in and log out with HttpOnly session cookies / JWT tokens.
- **AUTH-03**: User can view and update their profile details.
- **AUTH-04**: API enforces authentication dependencies and role-based authorization for protected endpoints.

## Design Decisions
1. **Password Hashing**:
   - Direct use of `argon2-cffi` (`PasswordHasher(time_cost=2, memory_cost=102400, parallelism=8)`) or passlib with Argon2id.
   - Raw passwords never saved or logged; verified using constant-time comparison.
2. **Token Strategy**:
   - JWT tokens signed with HS256 using `settings.SECRET_KEY`.
   - Access token lifetime: 24 hours (or configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`).
   - Token payload includes `sub` (User UUID), `email`, `role`, and expiration timestamp `exp`.
   - Both `Authorization: Bearer <token>` and `access_token` cookie supported for flexibility with web frontends.
3. **User Entity**:
   - `User` table:
     - `id`: UUID primary key
     - `username`: String(50), unique, indexed
     - `email`: String(255), unique, indexed
     - `hashed_password`: String(255), nullable=False
     - `role`: Enum (`USER`, `ADMIN`), default `USER`
     - `is_active`: Boolean, default `True`
     - `avatar_url`: Optional[String(1000)]
     - `created_at`, `updated_at`: Timestamps
4. **Auth Endpoints**:
   - `POST /api/v1/auth/register`: Register with username, email, password. Returns user object + token.
   - `POST /api/v1/auth/login`: Login with email or username + password. Returns JWT token + sets HttpOnly cookie.
   - `POST /api/v1/auth/logout`: Clears cookie.
   - `GET /api/v1/auth/me`: Returns current authenticated user.
   - `PATCH /api/v1/auth/profile`: Update username, email, or avatar_url.
