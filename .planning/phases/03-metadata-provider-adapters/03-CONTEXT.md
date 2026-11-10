# Phase 3: Metadata Provider Adapters - Context

**Gathered:** 2026-11-11
**Status:** Ready for planning
**Source:** PRD Express Path (PRD.md)

<domain>
## Phase Boundary

Implement the metadata provider adapter layer providing resilient, rate-limited HTTP clients for TMDB (REST) and AniList (GraphQL) that fetch external data and normalize payloads into standard internal Pydantic DTOs.

Requirements covered:
- **PROV-01**: TMDB adapter fetches popular, trending, and detailed metadata for movies and TV shows via REST API.
- **PROV-02**: AniList adapter fetches anime metadata, formats, seasons, studios, and episode counts via GraphQL API.
- **PROV-03**: Provider adapters normalize disparate third-party payloads into standard `NormalizedMediaDTO` objects.
- **PROV-04**: Provider adapters enforce rate-limit delays, backoff with jitter, and handle transient network failures.

</domain>

<decisions>
## Implementation Decisions

### Common Normalized DTOs (PROV-03)
- Located in `backend/app/schemas/normalized.py`:
  - `NormalizedTitleDTO`: title, title_type, language, is_primary
  - `NormalizedEpisodeDTO`: episode_number, title, overview, still_path, air_date, runtime
  - `NormalizedSeasonDTO`: season_number, title, overview, poster_path, air_date, episodes
  - `NormalizedCreditDTO`: person_name, original_name, credit_type (CAST/CREW), character_name, department, job, order, profile_path, external_person_id
  - `NormalizedMediaDTO`: provider, external_id, media_type, title, original_title, overview, release_date, original_language, country_of_origin, runtime, is_adult, status, popularity, vote_average, vote_count, poster_url, backdrop_url, genres, titles, seasons, credits, raw_metadata

### Abstract Adapter Contract (PROV-03, PROV-04)
- Abstract base class `BaseAdapter` in `backend/app/providers/base.py`:
  - `search(query, page)`
  - `get_details(external_id)`
  - `get_popular(page)`
  - `get_trending(time_window)`
  - `normalize(raw_record) -> NormalizedMediaDTO`
  - `health_check() -> bool`
- Built-in rate limiting with token bucket or asyncio sleep delays, and bounded exponential backoff on HTTP 429 / 5xx responses.

### TMDB Adapter (PROV-01)
- REST client using HTTPX in `backend/app/providers/tmdb.py`.
- Endpoints:
  - `/trending/{media_type}/{time_window}`
  - `/movie/popular`, `/tv/popular`
  - `/movie/{id}`, `/tv/{id}` with `append_to_response=credits,keywords,alternative_titles,external_ids`
  - `/tv/{id}/season/{season_number}`

### AniList Adapter (PROV-02)
- GraphQL client in `backend/app/providers/anilist.py`.
- Queries `Page { media(type: ANIME, sort: POPULARITY_DESC) { ... } }` and detail query requesting titles (romaji, english, native), format, episodes, duration, studios, characters, staff.

### Mock Fixtures & Testing
- Mock responses for TMDB movie/TV and AniList anime in `backend/tests/fixtures/`.
- Unit tests asserting normalization into `NormalizedMediaDTO` with 100% field fidelity.

</decisions>

<canonical_refs>
## Canonical References

### PRD & Architectural References
- `PRD.md` — Section 7 (Data Providers and Licensing), Section 12 (Ingestion and Synchronization Design)
- `.planning/research/STACK.md` — HTTPX client and Pydantic v2
- `.planning/phases/02-database-architecture-core-data-models/02-01-SUMMARY.md` — MediaType & MediaStatus enums

</canonical_refs>

---

*Phase: 03-metadata-provider-adapters*
*Context gathered: 2026-11-11 via PRD Express Path*
