# Stack Research

**Domain:** Media Catalogue, Metadata Ingestion, and Streaming Discovery Web Platform
**Researched:** 2026-11-11
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Python / FastAPI | 0.115+ | High-performance async REST backend | Native Pydantic v2 data validation, OpenAPI autodoc generation, high throughput for media catalogue endpoints, Python ecosystem compatibility for multi-provider API clients. |
| PostgreSQL | 15+ | Primary relational storage & full-text search | First-class JSONB, transactional integrity across external ID mapping, and built-in full-text search (`tsvector` + `pg_trgm`) eliminating need for external search cluster in MVP. |
| SQLAlchemy | 2.0+ (async) | Relational ORM & query builder | Modern async 2.0 syntax, strict typing with Mapped types, robust transaction management for deduplication & upserts. |
| Alembic | 1.13+ | Database schema migrations | Standard, robust migration tool for SQLAlchemy with versioned autogeneration and rollback support. |
| Next.js (App Router) | 15+ | Fullstack React web frontend | Server Components (RSC) for SEO-optimized metadata detail pages, client components for interactive carousels and player modals, fast routing. |
| Tailwind CSS | 3.4+ / 4+ | Frontend styling | Utility-first, responsive grid/flexbox primitives ideal for cinematic dark mode media UI. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Pydantic | 2.8+ | Data schemas and normalization | Ingestion payload validation, provider API mapping, API request/response typing. |
| HTTPX | 0.27+ | Async HTTP client | Calling external REST and GraphQL APIs (TMDB, AniList, TVmaze, Jikan) with connection pooling and timeouts. |
| passlib[argon2] | 1.7.4+ (or argon2-cffi) | Password hashing | Industry-standard Argon2id password security for user authentication. |
| python-jose / PyJWT | 2.8+ | Session / Token management | Secure stateless or refresh-rotated authentication tokens stored in HttpOnly cookies. |
| Lucide React | 0.400+ | UI iconography | Clean, lightweight cinematic UI icons (play, bookmark, search, filters, ratings). |
| Docker & Docker Compose | 2.20+ | Local development orchestration | Reproducible zero-cost local environment bundling PostgreSQL, backend API, and frontend. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| ruff | Python linter and formatter | Sub-millisecond formatting and linting replacing flake8, isort, and black. |
| pytest & pytest-asyncio | Backend test framework | Fast async test runners with HTTPX test clients and mocked provider fixtures. |
| TypeScript | Type safety for Next.js frontend | End-to-end interface safety matching FastAPI OpenAPI schemas. |

## Installation

```bash
# Backend (Python virtualenv)
pip install fastapi uvicorn[standard] sqlalchemy[asyncio] asyncpg alembic pydantic pydantic-settings httpx argon2-cffi pyjwt python-multipart

# Frontend (Node.js)
npm install lucide-react clsx tailwind-merge
npm install -D typescript @types/node @types/react tailwindcss postcss autoprefixer
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| PostgreSQL FTS + pg_trgm | Meilisearch / Elasticsearch | When catalogue exceeds 100k+ records and complex typo-tolerant ranking latency exceeds 1s on PostgreSQL. |
| FastAPI | Django REST Framework | If built-in Django Admin was preferred over custom React admin and async performance was non-critical. |
| Next.js App Router | Vite SPA + React | If SEO and SSR metadata cards (OpenGraph/Twitter previews) were not required. |
| In-Process Background Tasks / CLI | Celery + Redis | When ingestion tasks require multi-worker distributed queueing across cluster nodes. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| MongoDB / Pure NoSQL | Destroys referential integrity for provider cross-mapping (`external_ids`), watchlists, and episodes; causes orphan records. | PostgreSQL with relational tables + JSONB for raw payloads. |
| Unsafe Client-Side API Keys | Exposes TMDB or service API keys to browser devtools; risks quota hijacking. | Backend proxy endpoints with server-side secrets. |
| Heavy Video Transcoding / Self-Hosting | Exorbitant cloud storage/bandwidth costs, legal copyright liability. | Configurable iframe embed players with allowlisted templates. |

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| FastAPI 0.115+ | Pydantic 2.8+ | Ensure `pydantic-settings` is used for BaseSettings in v2. |
| SQLAlchemy 2.0+ | asyncpg 0.29+ | Requires `postgresql+asyncpg://` connection URL scheme. |
| Next.js 15+ | React 19+ / React 18 | Use stable App Router patterns with React 18/19. |

## Sources

- [FastAPI Official Docs](https://fastapi.tiangolo.com/) — Async patterns, Pydantic v2 integrations
- [TMDB Developer Documentation](https://developer.themoviedb.org/docs) — REST endpoints, rate limiting, attribution
- [AniList API v2](https://docs.anilist.co/) — GraphQL query structures
- [PRD.md](file:///c:/Users/01roh/Downloads/CineVines/PRD.md) — Architectural guidelines & stack decisions

---
*Stack research for: Media Catalogue & Discovery Platform*
*Researched: 2026-11-11*

