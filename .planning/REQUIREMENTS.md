# Requirements: Cineverse

**Defined:** 2026-11-11
**Core Value:** Unified provider-independent media discovery and tracking that seamlessly aggregates and normalizes multi-source metadata into one high-integrity catalogue with lightning-fast search, robust user libraries, and reliable media playback integration.

## v1 Requirements

Requirements for initial release. Each maps directly to roadmap phases.

### Foundation & Infrastructure (FND)

- [x] **FND-01**: Developer can launch local PostgreSQL 15+ container via Docker Compose with health checks and persistent volume
- [x] **FND-02**: Developer can initialize and run Alembic migrations against PostgreSQL using async SQLAlchemy 2.0
- [x] **FND-03**: Backend service exposes a standard `/health` endpoint returning database and application status
- [x] **FND-04**: Monorepo directory structure established with separate backend (FastAPI) and frontend (Next.js) workspaces and sample `.env.example`

### Data Model & Persistence (DATA)

- [x] **DATA-01**: Database schema persists canonical `media` entity with UUID primary keys and types: MOVIE, TV_SHOW, ANIME, DOCUMENTARY, SHORT_FILM
- [x] **DATA-02**: Database schema enforces unique composite constraint on `external_ids(provider, external_id)` to map third-party IDs (TMDB, AniList, etc.)
- [x] **DATA-03**: Database schema persists localized primary and alternate titles with language tags in `media_titles`
- [x] **DATA-04**: Database schema persists seasons and episodes with hierarchical foreign keys and air dates for episodic media
- [x] **DATA-05**: Database schema persists cast, crew, characters, and department roles in `people` and `credits` tables

### Metadata Provider Adapters (PROV)

- [x] **PROV-01**: TMDB adapter fetches popular, trending, and detailed metadata for movies and TV shows via REST API
- [x] **PROV-02**: AniList adapter fetches anime metadata, formats, seasons, studios, and episode counts via GraphQL API
- [x] **PROV-03**: Provider adapters normalize disparate third-party payloads into standard `NormalizedMediaDTO` objects
- [x] **PROV-04**: Provider adapters enforce rate-limit delays, backoff with jitter, and handle transient network failures

### Ingestion Engine (INGEST)

- [x] **INGEST-01**: Ingestion CLI command imports trending, popular, and seasonal media batches with configurable page limits
- [x] **INGEST-02**: Ingestion pipeline executes idempotent upserts preventing duplicate media creation on repeated runs
- [x] **INGEST-03**: Ingestion resolver links external provider records to existing canonical media without fuzzy auto-merge risks
- [x] **INGEST-04**: Ingestion system records execution status, start/end timestamps, record counts, and failure summaries in `ingestion_runs`

### Discovery & Search (SRCH)

- [ ] **SRCH-01**: User can search media titles and alternate titles with typo-tolerant PostgreSQL trigram (`pg_trgm`) and full-text search
- [ ] **SRCH-02**: User can receive debounced search autocomplete suggestions within 300ms
- [ ] **SRCH-03**: User can filter media by media type, genre, release year, and status with paginated results
- [ ] **SRCH-04**: User can browse curated home page collections (trending, popular, top-rated, upcoming)

### Media Detail & Content (DETL)

- [ ] **DETL-01**: User can view full media detail page including synopsis, release date, genres, ratings, and artwork
- [ ] **DETL-02**: User can browse cast and crew credits with character names and profile images
- [ ] **DETL-03**: User can navigate seasons and view episode listings with episode titles, numbers, and overviews
- [ ] **DETL-04**: User can view provider provenance and attribution for metadata sources

### User Authentication & Accounts (AUTH)

- [ ] **AUTH-01**: User can register an account with username, email, and password hashed using Argon2id
- [ ] **AUTH-02**: User can securely log in and log out with HttpOnly session cookies / JWT tokens
- [ ] **AUTH-03**: User can view and update their profile details
- [ ] **AUTH-04**: API enforces authentication dependencies and role-based authorization for protected endpoints

### Personal Library & Progress Tracking (LIST)

- [ ] **LIST-01**: User can create, rename, and delete custom named watchlists
- [ ] **LIST-02**: User can add and remove titles from their personal watchlists
- [ ] **LIST-03**: User can update viewing status (Plan to Watch, Watching, Completed, Dropped)
- [ ] **LIST-04**: User can track watched episodes and season progress for TV shows and anime

### Streaming & Playback Engine (PLAY)

- [ ] **PLAY-01**: Backend exposes `/api/v1/media/{id}/playback-options` resolving internal UUID to external provider IDs and stream options
- [ ] **PLAY-02**: System routes movie playback requests to allowlisted embed templates (including `vidbolt.xyz/movie/{TMDB_ID}` and `embed.reelsdownload.online/player/{TMDB_ID}`)
- [ ] **PLAY-03**: System routes TV episode playback requests to allowlisted episode templates (`vidbolt.xyz/tv/{id}/{s}/{e}`) with correct season and episode indexing
- [ ] **PLAY-04**: Frontend player component renders embed in a secure, sandboxed `<iframe>` preventing popup hijacks and unauthorized top-level redirects
- [ ] **PLAY-05**: Player displays clear empty/fallback states when no external TMDB ID or valid stream route is available

### Frontend UI & Experience (UI)

- [ ] **UI-01**: User can experience a responsive, dark cinematic home page with hero showcase and horizontal scroll carousels
- [ ] **UI-02**: User can browse dedicated listing pages for `/movies`, `/tv`, and `/anime` with responsive card grids
- [ ] **UI-03**: User can search from navigation header with immediate suggestion popover and full results page
- [ ] **UI-04**: User can navigate tabs on detail pages (Overview, Cast, Episodes, Watch/Player) across mobile and desktop
- [ ] **UI-05**: User interface displays skeleton loaders during loading states and graceful error boundaries on network failure

### Administration & Operations (ADMIN)

- [ ] **ADMIN-01**: Admin user can view ingestion run histories, durations, record counts, and error summaries
- [ ] **ADMIN-02**: Admin user can trigger safe retry for failed ingestion records from previous runs
- [ ] **ADMIN-03**: Admin user can review duplicate candidate pairs flagged by conservative resolution
- [ ] **ADMIN-04**: Repository includes documented database backup and restore scripts for zero-budget recovery

## v2 Requirements

Deferred to future releases.

### Advanced Search & Caching

- **V2-SRCH-01**: Dedicated Meilisearch service integration for sub-50ms typo-tolerant search across millions of titles
- **V2-SRCH-02**: Redis caching layer for trending feeds and high-frequency browse routes

### Social & Community

- **V2-SOCL-01**: Public shareable watchlist URLs with custom slug handles
- **V2-SOCL-02**: User reviews, ratings, and activity feeds

### Ecosystem & Mobile

- **V2-APP-01**: Progressive Web App (PWA) offline caching for watchlists
- **V2-APP-02**: Native mobile clients (Android/iOS)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Self-hosting commercial video files | Copyright infringement risk and extreme cloud storage/bandwidth costs |
| Custom web scrapers bypassing DRM/anti-bot gates | Violates anti-bot policies and creates brittle runtime failures |
| Native mobile apps in v1 | Responsive web application satisfies multi-device access with ₹0 budget |
| Distributed microservices / Kubernetes | Premature complexity; modular monolith handles all requirements cleanly |
| Live third-party API proxying on browse routes | Violates rate limits and causes slow page response times |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FND-01 | Phase 1 | Complete |
| FND-02 | Phase 1 | Complete |
| FND-03 | Phase 1 | Complete |
| FND-04 | Phase 1 | Complete |
| DATA-01 | Phase 2 | Complete |
| DATA-02 | Phase 2 | Complete |
| DATA-03 | Phase 2 | Complete |
| DATA-04 | Phase 2 | Complete |
| DATA-05 | Phase 2 | Complete |
| PROV-01 | Phase 3 | Complete |
| PROV-02 | Phase 3 | Complete |
| PROV-03 | Phase 3 | Complete |
| PROV-04 | Phase 3 | Complete |
| INGEST-01 | Phase 4 | Complete |
| INGEST-02 | Phase 4 | Complete |
| INGEST-03 | Phase 4 | Complete |
| INGEST-04 | Phase 4 | Complete |
| SRCH-01 | Phase 5 | Pending |
| SRCH-02 | Phase 5 | Pending |
| SRCH-03 | Phase 5 | Pending |
| SRCH-04 | Phase 5 | Pending |
| DETL-01 | Phase 6 | Pending |
| DETL-02 | Phase 6 | Pending |
| DETL-03 | Phase 6 | Pending |
| DETL-04 | Phase 6 | Pending |
| AUTH-01 | Phase 7 | Pending |
| AUTH-02 | Phase 7 | Pending |
| AUTH-03 | Phase 7 | Pending |
| AUTH-04 | Phase 7 | Pending |
| LIST-01 | Phase 8 | Pending |
| LIST-02 | Phase 8 | Pending |
| LIST-03 | Phase 8 | Pending |
| LIST-04 | Phase 8 | Pending |
| PLAY-01 | Phase 9 | Pending |
| PLAY-02 | Phase 9 | Pending |
| PLAY-03 | Phase 9 | Pending |
| PLAY-04 | Phase 9 | Pending |
| PLAY-05 | Phase 9 | Pending |
| UI-01 | Phase 10 | Pending |
| UI-02 | Phase 10 | Pending |
| UI-03 | Phase 10 | Pending |
| UI-04 | Phase 10 | Pending |
| UI-05 | Phase 10 | Pending |
| ADMIN-01 | Phase 11 | Pending |
| ADMIN-02 | Phase 11 | Pending |
| ADMIN-03 | Phase 11 | Pending |
| ADMIN-04 | Phase 11 | Pending |

**Coverage:**
- v1 requirements: 45 total
- Mapped to phases: 45
- Unmapped: 0 ✓

---
*Requirements defined: 2026-11-11*
*Last updated: 2026-11-11 after initial definition*

