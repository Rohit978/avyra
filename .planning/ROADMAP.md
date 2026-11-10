# Roadmap: Cineverse

## Overview

Cineverse is built incrementally as a modular monolith spanning 11 fine-grained phases. The roadmap transitions systematically from foundational Docker & database migrations, through provider adapters (TMDB, AniList), idempotent ingestion pipelines, fast search and media detail APIs, user authentication, personal watchlists, and secure streaming embeds (`vidbolt.xyz` and `embed.reelsdownload.online`), culminating in a responsive Next.js cinematic web UI and admin diagnostic monitors.

## Phases

- [x] **Phase 1: Foundation & Environment Setup** - Docker Compose PostgreSQL, FastAPI skeleton, Next.js workspace, and health checks.
- [x] **Phase 2: Database Architecture & Core Data Models** - Canonical media entity, external IDs, localized titles, seasons, episodes, and credits schemas with Alembic migrations.
- [x] **Phase 3: Metadata Provider Adapters** - TMDB REST client and AniList GraphQL client with normalized DTOs and rate-limit backoff.
- [x] **Phase 4: Ingestion Engine & Deduplication Pipeline** - Idempotent batch ingestion commands, identity resolution, run logging, and error tracking.
- [ ] **Phase 5: Search & Discovery Backend API** - PostgreSQL trigram & full-text search, autocomplete suggestions, and curated collection endpoints.
- [ ] **Phase 6: Media Detail & Episode Hierarchy API** - Comprehensive detail endpoints with cast/crew, season/episode navigation, and provenance attribution.
- [ ] **Phase 7: User Authentication & Security** - Argon2id password hashing, session tokens in HttpOnly cookies, and role-based route guards.
- [ ] **Phase 8: Personal Watchlists & Viewing Progress** - Custom user watchlists, watch status (Watching, Completed, Plan to Watch), and episode progress tracking.
- [ ] **Phase 9: Playback & Streaming Embed Engine** - Configurable embed player router mapping TMDB IDs to allowlisted templates (`reelsdownload`, `vidbolt`) with secure sandboxing.
- [ ] **Phase 10: Frontend Discovery & Cinematic Web UI** - Next.js App Router cinematic dark UI, responsive home page, browse pages, detail tabs, and player view.
- [ ] **Phase 11: Admin Health, Diagnostics & Operational Hardening** - Ingestion run monitoring UI, retry controls, database backup/recovery scripts, and end-to-end verification.

## Phase Details

### Phase 1: Foundation & Environment Setup
**Goal**: Establish the monorepo structure, reproducible local Docker Compose PostgreSQL environment, FastAPI and Next.js skeletons, and verified health check endpoints.
**Depends on**: Nothing (first phase)
**Requirements**: FND-01, FND-02, FND-03, FND-04
**Success Criteria** (what must be TRUE):
  1. Developer can start PostgreSQL in Docker Compose and connect with persistent storage.
  2. Alembic executes initial database migration cleanly against PostgreSQL via async SQLAlchemy 2.0.
  3. `GET /health` returns HTTP 200 with database connectivity and service status.
  4. Repository is cleanly organized with backend and frontend workspaces and documented `.env.example`.
**Plans**: TBD

Plans:
- [x] 01-01: Docker Compose and monorepo workspace scaffolding
- [x] 01-02: FastAPI service skeleton, configuration, and health check endpoint
- [x] 01-03: Async SQLAlchemy 2.0 database engine and Alembic setup

### Phase 2: Database Architecture & Core Data Models
**Goal**: Design and migrate all relational schema entities including canonical media, provider mappings, localized titles, seasons, episodes, and credits.
**Depends on**: Phase 1
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, DATA-05
**Success Criteria** (what must be TRUE):
  1. `media` table persists records with immutable UUID primary keys and controlled media types.
  2. `external_ids` table enforces unique constraint on `(provider, external_id)` preventing cross-provider duplicate collisions.
  3. `media_titles` records alternate and localized titles with language tags.
  4. `seasons` and `episodes` tables enforce hierarchical foreign keys for episodic media.
  5. `people` and `credits` tables record cast, crew, characters, and department roles.
**Plans**: TBD

Plans:
- [x] 02-01: Core media and external ID relational models with Alembic migrations
- [x] 02-02: Seasons, episodes, and media titles schema
- [x] 02-03: People and credits schema with relationship tests

### Phase 3: Metadata Provider Adapters
**Goal**: Implement resilient, rate-limited adapters for TMDB and AniList that fetch raw payloads and normalize them into standard internal DTOs.
**Depends on**: Phase 2
**Requirements**: PROV-01, PROV-02, PROV-03, PROV-04
**Success Criteria** (what must be TRUE):
  1. TMDB adapter retrieves movies, TV series, popular feeds, and season/episode details via REST API.
  2. AniList adapter retrieves anime formats, seasonal releases, studios, and episode counts via GraphQL.
  3. Adapters normalize external responses into standard `NormalizedMediaDTO` objects without losing provenance.
  4. Adapters handle provider rate limits, HTTP 429 backoff, and transient connection drops gracefully.
**Plans**: TBD

Plans:
- [x] 03-01: Base adapter contract, common DTOs, and HTTPX client with retry/backoff
- [x] 03-02: TMDB REST API adapter implementation and mock fixture tests
- [x] 03-03: AniList GraphQL API adapter implementation and mock fixture tests

### Phase 4: Ingestion Engine & Deduplication Pipeline
**Goal**: Build a transactional, idempotent ingestion engine with identity resolution and execution run tracking.
**Depends on**: Phase 3
**Requirements**: INGEST-01, INGEST-02, INGEST-03, INGEST-04
**Success Criteria** (what must be TRUE):
  1. CLI command imports trending, popular, and seasonal titles with configurable page limits.
  2. Running the ingestion command repeatedly produces zero duplicate media records or external ID collisions.
  3. External IDs resolve accurately to existing canonical media without destructive auto-merges.
  4. Ingestion runs record duration, item counts, status, and failure traces in `ingestion_runs`.
**Plans**: TBD

Plans:
- [x] 04-01: Ingestion pipeline coordinator and transactional upsert engine
- [x] 04-02: Identity resolver and conservative deduplication candidate logic
- [x] 04-03: Ingestion CLI command and run metrics logging

### Phase 5: Search & Discovery Backend API
**Goal**: Deliver high-performance search and discovery endpoints using PostgreSQL full-text and trigram indexing.
**Depends on**: Phase 4
**Requirements**: SRCH-01, SRCH-02, SRCH-03, SRCH-04
**Success Criteria** (what must be TRUE):
  1. Full-text search endpoint returns ranked results matching primary and alternate titles with typo tolerance.
  2. Autocomplete suggestions endpoint responds with matching titles in under 300ms.
  3. Browse endpoints filter accurately by media type, genre, release year, and status with pagination.
  4. Curated endpoints return trending, popular, top-rated, and upcoming titles.
**Plans**: 3 plans

Plans:
- [x] 05-01: PostgreSQL GIN trigram and full-text search indexes and query builders
- [x] 05-02: Search API endpoints with autocomplete suggestions and pagination
- [x] 05-03: Filtered catalogue browsing and curated collection endpoints

### Phase 6: Media Detail, Credits & Episode Hierarchy API
**Goal**: Provide rich media detail endpoints delivering complete metadata, cast/crew credits, season/episode trees, and provider attribution.
**Depends on**: Phase 5
**Requirements**: DETL-01, DETL-02, DETL-03, DETL-04
**Success Criteria** (what must be TRUE):
  1. Detail endpoint returns complete synopsis, release date, runtime, ratings, and artwork URLs for a media UUID.
  2. Credits endpoint returns cast and crew members with characters, roles, and profile image links.
  3. Seasons and episodes endpoints deliver structured hierarchical episode listings.
  4. Detail payload clearly includes provider provenance and attribution tags.

Plans:
- [x] 06-01: Media detail REST endpoints and response schemas
- [x] 06-02: Cast, crew, and credits query endpoints
- [x] 06-03: Season and episode navigation endpoints with provenance metadata

### Phase 7: User Authentication & Security
**Goal**: Build a secure account system with Argon2id password hashing, session tokens, and route protection.
**Depends on**: Phase 6
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04
**Success Criteria** (what must be TRUE):
  1. User can register with username, email, and password hashed using Argon2id.
  2. User can log in and receive HttpOnly session cookie or JWT token.
  3. User can view and update profile information.
  4. Protected endpoints reject unauthenticated requests with HTTP 401 and enforce role authorization.

Plans:
- [x] 07-01: User model, security utilities, and Argon2id password hashing
- [x] 07-02: Registration, login, refresh, and logout endpoints
- [x] 07-03: Profile management and FastAPI authentication dependencies

### Phase 8: Personal Watchlists & Viewing Progress
**Goal**: Implement personal user watchlists, viewing status states, and episode progress tracking.
**Depends on**: Phase 7
**Requirements**: LIST-01, LIST-02, LIST-03, LIST-04
**Success Criteria** (what must be TRUE):
  1. User can create, rename, and delete custom named watchlists.
  2. User can add and remove canonical media titles from their watchlists.
  3. User can toggle watch status between Plan to Watch, Watching, Completed, and Dropped.
  4. User can track watched episodes and season progress for TV shows and anime.

Plans:
- [x] 08-01: Watchlist and watchlist item models and CRUD API endpoints
- [x] 08-02: Viewing status and episode progress tracking models and endpoints
- [x] 08-03: Ownership security tests ensuring strict isolation between user accounts

### Phase 9: Playback & Streaming Embed Engine
**Goal**: Implement a safe, configurable playback service mapping media to allowlisted embed templates (`reelsdownload`, `vidbolt`) with strict iframe sandboxing.
**Depends on**: Phase 8
**Requirements**: PLAY-01, PLAY-02, PLAY-03, PLAY-04, PLAY-05
**Success Criteria** (what must be TRUE):
  1. `GET /api/v1/media/{id}/playback-options` resolves internal UUID to active player configurations.
  2. System resolves movies to allowlisted embed URLs (`vidbolt.xyz/movie/{TMDB_ID}` and `embed.reelsdownload.online/player/{TMDB_ID}`).
  3. System resolves TV episodes to allowlisted episode URLs (`vidbolt.xyz/tv/{id}/{s}/{e}`) with exact season/episode numbers.
  4. Frontend player module enforces sandbox attributes preventing top-level redirects and popups.
  5. Player displays clear fallback state when external TMDB ID is missing.

Plans:
- [x] 09-01: Playback options service and TMDB ID resolution
- [x] 09-02: Parameterized URL generator and domain allowlist validation
- [x] 09-03: Secure iframe sandbox helper and playback API endpoints

### Phase 10: Frontend Discovery & Cinematic Web UI
**Goal**: Build a responsive Next.js web application with a dark cinematic aesthetic, discovery carousels, search popover, detail tabs, and player view.
**Depends on**: Phase 9
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05
**Success Criteria** (what must be TRUE):
  1. Home page renders hero showcase, trending carousels, and media cards across mobile and desktop.
  2. Browse pages for `/movies`, `/tv`, and `/anime` provide responsive grid listings and filters.
  3. Global search bar in header provides immediate debounced suggestions and full results page.
  4. Detail page renders overview, cast, season/episode selector, watchlist toggle, and player view.
  5. UI displays skeleton loaders during data fetch and graceful error boundaries on network failure.
Plans:
- [x] 10-01: Global navigation header, search popover with debounced suggestions, and footer
- [x] 10-02: Home page with hero showcase, trending carousels, and media cards with skeleton loaders
- [x] 10-03: Browse pages, search results, and media detail view with tabs and player embed

### Phase 11: Admin Health, Diagnostics & Operational Hardening
**Goal**: Deliver an admin diagnostic interface, error retry mechanisms, backup/restore scripts, and end-to-end integration verification.
**Depends on**: Phase 10
**Requirements**: ADMIN-01, ADMIN-02, ADMIN-03, ADMIN-04
**Success Criteria** (what must be TRUE):
  1. Admin user can view ingestion run histories, timestamps, record counts, and failure traces.
  2. Admin user can trigger safe retries for failed ingestion records.
  3. Admin user can inspect duplicate candidate pairs flagged during ingestion.
  4. Repository includes verified database backup and restore scripts.
**Plans**: TBD

Plans:
- [ ] 11-01: Admin dashboard API endpoints and run inspection views
- [ ] 11-02: Ingestion retry and duplicate candidate review workflows
- [ ] 11-03: PostgreSQL backup/restore automation scripts and documentation
- [ ] 11-04: End-to-end integration test suite and final verification audit

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Environment Setup | 3/3 | Complete | 2026-11-11 |
| 2. Database Architecture & Core Data Models | 3/3 | Complete | 2026-11-11 |
| 3. Metadata Provider Adapters | 3/3 | Complete | 2026-11-11 |
| 4. Ingestion Engine & Deduplication Pipeline | 3/3 | Complete | 2026-11-11 |
| 5. Search & Discovery Backend API | 0/3 | Not started | - |
| 6. Media Detail & Episode Hierarchy API | 0/3 | Not started | - |
| 7. User Authentication & Security | 0/3 | Not started | - |
| 8. Personal Watchlists & Viewing Progress | 0/3 | Not started | - |
| 9. Playback & Streaming Embed Engine | 0/3 | Not started | - |
| 10. Frontend Discovery & Cinematic Web UI | 0/5 | Not started | - |
| 11. Admin Health, Diagnostics & Operational Hardening | 0/4 | Not started | - |

