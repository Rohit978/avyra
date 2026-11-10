# Phase 2: Database Architecture & Core Data Models - Context

**Gathered:** 2026-11-11
**Status:** Ready for planning
**Source:** PRD Express Path (PRD.md)

<domain>
## Phase Boundary

Design and migrate all relational schema entities including canonical media, external provider IDs, localized titles, genres, seasons, episodes, people, and credits using SQLAlchemy 2.0 async and Alembic.

Requirements covered:
- **DATA-01**: Database schema persists canonical `media` entity with UUID primary keys and types: MOVIE, TV_SHOW, ANIME, DOCUMENTARY, SHORT_FILM.
- **DATA-02**: Database schema enforces unique composite constraint on `external_ids(provider, external_id)` to map third-party IDs (TMDB, AniList, etc.).
- **DATA-03**: Database schema persists localized primary and alternate titles with language tags in `media_titles`.
- **DATA-04**: Database schema persists seasons and episodes with hierarchical foreign keys and air dates for episodic media.
- **DATA-05**: Database schema persists cast, crew, characters, and department roles in `people` and `credits` tables.

</domain>

<decisions>
## Implementation Decisions

### Controlled Media Types (DATA-01)
- Enum `MediaType`: `MOVIE`, `TV_SHOW`, `ANIME`, `DOCUMENTARY`, `SHORT_FILM`.
- Media status enum: `RELEASED`, `UPCOMING`, `ONGOING`, `COMPLETED`, `CANCELLED`, `UNKNOWN`.
- Columns: UUID pk, `media_type`, `title`, `original_title`, `overview`, `release_date`, `end_date`, `original_language`, `country_of_origin`, `runtime`, `is_adult`, `status`, `popularity`, `vote_average`, `vote_count`, `poster_url`, `backdrop_url`, `raw_metadata` (JSONB), timestamps.

### External ID Mapping & Deduplication (DATA-02)
- Table `external_ids`:
  - `id` (UUID)
  - `media_id` (UUID foreign key -> `media.id` with CASCADE delete)
  - `provider` (String, e.g. 'tmdb', 'anilist', 'tvmaze', 'jikan')
  - `external_id` (String)
  - Unique composite constraint: `uq_provider_external_id (provider, external_id)`.
  - Index on `(media_id, provider)`.

### Localized & Alternate Titles (DATA-03)
- Table `media_titles`:
  - `id` (UUID)
  - `media_id` (UUID foreign key -> `media.id` CASCADE)
  - `title` (String, indexed)
  - `title_type` (String: 'primary', 'alternate', 'romanized', 'native', 'short')
  - `language` (String, e.g. 'en', 'ja', 'hi')
  - `is_primary` (Boolean)

### Hierarchical Seasons & Episodes (DATA-04)
- Table `seasons`:
  - `id` (UUID)
  - `media_id` (UUID foreign key -> `media.id` CASCADE)
  - `season_number` (Integer)
  - `title` (String)
  - `overview` (Text)
  - `poster_path` (String)
  - `air_date` (Date)
  - `episode_count` (Integer)
  - Unique constraint on `(media_id, season_number)`.
- Table `episodes`:
  - `id` (UUID)
  - `season_id` (UUID foreign key -> `seasons.id` CASCADE)
  - `media_id` (UUID foreign key -> `media.id` CASCADE)
  - `episode_number` (Integer)
  - `title` (String)
  - `overview` (Text)
  - `still_path` (String)
  - `air_date` (Date)
  - `runtime` (Integer)
  - Unique constraint on `(season_id, episode_number)`.

### People & Credits (DATA-05)
- Table `people`:
  - `id` (UUID)
  - `name` (String, indexed)
  - `original_name` (String)
  - `profile_path` (String)
  - `biography` (Text)
- Table `credits`:
  - `id` (UUID)
  - `media_id` (UUID foreign key -> `media.id` CASCADE)
  - `person_id` (UUID foreign key -> `people.id` CASCADE)
  - `credit_type` (Enum: `CAST`, `CREW`)
  - `character_name` (String, nullable)
  - `department` (String, nullable)
  - `job` (String, nullable)
  - `order` (Integer, default 0)

### Genres & Categorization
- Table `genres`: `(id, name, slug)`
- Table `media_genres`: `(media_id, genre_id)` composite primary key.

</decisions>

<canonical_refs>
## Canonical References

### PRD & Architectural References
- `PRD.md` — Section 6 (Supported Content Model), Section 11 (Database Design)
- `.planning/research/ARCHITECTURE.md` — Relational schema relationships
- `.planning/phases/01-foundation-environment-setup/01-03-SUMMARY.md` — Async SQLAlchemy engine & Base model setup

</canonical_refs>

<specifics>
## Specific Ideas
- Generate a comprehensive initial Alembic migration (`0001_initial_schema.py`) to create all tables cleanly in PostgreSQL.
- Add unit tests verifying table constraints (unique composite on external IDs, cascading deletes, enums).

</specifics>

<deferred>
## Deferred Ideas
- User watchlists, viewing progress, and ingestion runs belong to subsequent phases (Phase 4, Phase 7, Phase 8).

</deferred>

---

*Phase: 02-database-architecture-core-data-models*
*Context gathered: 2026-11-11 via PRD Express Path*
