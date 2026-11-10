# Architecture Research

**Domain:** Media Catalogue, Ingestion, and Streaming Web Platform
**Researched:** 2026-11-11
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                 Frontend Layer (Next.js 15)                 │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐ │
│  │ Home/Hero │  │ Browse/UI │  │ Detail/Ep │  │ Player UI │ │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘ │
│        │              │              │              │       │
├────────┴──────────────┴──────────────┴──────────────┴───────┤
│            Backend API Layer (FastAPI Modular Monolith)     │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────────────┐ ┌────────────────────┐ ┌──────────┐ │
│  │ Media/Search API   │ │ Auth & User Lists  │ │ Admin UI │ │
│  └─────────┬──────────┘ └─────────┬──────────┘ └────┬─────┘ │
│            │                      │                 │       │
│  ┌─────────┴──────────────────────┴─────────────────┴─────┐ │
│  │        Service & Repository Layer (SQLAlchemy 2.0)     │ │
│  └────────────────────────┬───────────────────────────────┘ │
├───────────────────────────┼─────────────────────────────────┤
│    Ingestion Engine       │    Playback Routing Engine      │
│  ┌──────────────────────┐ │  ┌────────────────────────────┐ │
│  │ Adapters (TMDB,AniL) │ │  │ URL Template Engine        │ │
│  │ Normalizer & Dedup   │ │  │ Allowlisted Embed Providers│ │
│  └──────────┬───────────┘ │  └─────────────┬──────────────┘ │
├─────────────┴─────────────┴────────────────┴────────────────┤
│                    Persistence Layer                        │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐  │
│  │          PostgreSQL 15+ (Relational + FTS + JSONB)     │  │
│  │  media, external_ids, titles, credits, watchlists     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Next.js Frontend | SSR for media details & SEO, client components for interactive search, filters, watchlist toggles, and embed player modal/view. | Next.js App Router, React 19/18, Tailwind CSS, Lucide icons. |
| FastAPI Backend | Type-safe REST endpoints for media browsing, search, user management, watchlist mutation, and admin diagnostic feeds. | FastAPI, Pydantic v2 schemas, Dependency Injection (`Depends(get_db)`). |
| Ingestion Adapters | Fetching raw provider data, complying with rate limits, validating shapes, normalizing into common DTOs. | Async HTTPX clients, abstract `BaseAdapter` class, provider-specific parsing. |
| Identity Resolver & Dedup | Linking external IDs (e.g. TMDB 550, AniList 1) to internal canonical UUIDs without duplicate insertions. | Transactional database upsert, `external_ids` mapping table. |
| Playback Service | Generating verified, allowlisted embed URLs for movies and TV episodes with fallbacks. | Template interpolation (`{TMDB_ID}`, `{season}`, `{episode}`) with strict domain allowlist. |
| PostgreSQL Store | Source of truth for all catalogue metadata, user accounts, lists, viewing progress, and search indices. | Asyncpg connection pool, GIN indices on `tsvector` and `trgm` columns. |

## Recommended Project Structure

```
CineVines/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── endpoints/
│   │   │       │   ├── media.py
│   │   │       │   ├── search.py
│   │   │       │   ├── auth.py
│   │   │       │   ├── watchlists.py
│   │   │       │   ├── playback.py
│   │   │       │   └── admin.py
│   │   │       └── router.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── database.py
│   │   ├── models/
│   │   │   ├── media.py
│   │   │   ├── user.py
│   │   │   ├── watchlist.py
│   │   │   └── ingestion.py
│   │   ├── schemas/
│   │   │   ├── media.py
│   │   │   ├── user.py
│   │   │   ├── watchlist.py
│   │   │   └── playback.py
│   │   ├── providers/
│   │   │   ├── base.py
│   │   │   ├── tmDB.py
│   │   │   ├── anilist.py
│   │   │   └── tvmaze.py
│   │   ├── ingestion/
│   │   │   ├── pipeline.py
│   │   │   ├── normalizer.py
│   │   │   └── resolver.py
│   │   └── main.py
│   ├── alembic/
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (main)/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── movies/page.tsx
│   │   │   │   ├── tv/page.tsx
│   │   │   │   ├── anime/page.tsx
│   │   │   │   └── search/page.tsx
│   │   │   ├── title/[id]/page.tsx
│   │   │   ├── watch/[id]/page.tsx
│   │   │   ├── my-list/page.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   ├── media/
│   │   │   ├── player/
│   │   │   └── ui/
│   │   └── lib/
│   │       └── api.ts
│   ├── package.json
│   └── tailwind.config.js
├── infrastructure/
│   ├── docker-compose.yml
│   └── scripts/
└── .planning/
```

## Architectural Patterns

### Pattern 1: Provider-Agnostic Adapter Pattern

**What:** Encapsulate provider API queries (TMDB, AniList) behind a standard contract returning a unified `NormalizedMediaDTO`.
**When to use:** All data ingestion.
**Trade-offs:** Adds a normalization layer, but shields database and business logic from third-party API breaking changes.

### Pattern 2: Canonical Entity with Provider Identity Table

**What:** Every piece of media has an immutable internal UUID. Third-party provider IDs (`tmdb`, `anilist`, `tvmaze`) are stored in `external_ids` with a composite unique constraint `(provider, external_id)`.
**When to use:** Ingestion upsert and cross-provider matching.
**Trade-offs:** Requires an extra join or pre-lookup query, but completely prevents duplicate records across multiple ingest runs.

### Pattern 3: Allowlisted Embed Template Engine

**What:** Safe URL generation using verified host patterns and parameters (`{TMDB_ID}`, `{season}`, `{episode}`).
**When to use:** Serving player endpoints to the frontend.
**Trade-offs:** Frontend never handles raw unvalidated iframe URLs; domain validation is enforced on the server.

## Data Flow

### Ingestion Flow

```
[CLI / Scheduler]
       ↓
[TMDB / AniList Client] (Rate-limited HTTPX)
       ↓
[Raw JSON/GraphQL]
       ↓
[Normalizer] → NormalizedMediaDTO
       ↓
[Identity Resolver] (Check external_ids table)
       ↓
[PostgreSQL Transaction] (Upsert media + external_ids + seasons/episodes)
```

### Playback Flow

```
[User clicks Watch on Title [UUID]]
       ↓
[Frontend calls GET /api/v1/media/{UUID}/playback-options]
       ↓
[Backend resolves internal UUID -> TMDB ID]
       ↓
[Backend injects TMDB ID & (s,e) into active provider template]
(e.g. vidbolt.xyz or reelsdownload.online)
       ↓
[Backend returns validated embed URL + sandbox permissions]
       ↓
[Frontend renders responsive 16:9 Iframe player with controls]
```

---
*Architecture research for: Media Catalogue & Discovery Platform*
*Researched: 2026-11-11*

