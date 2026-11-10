# Phase 6: Media Detail, Credits & Episode Hierarchy API - Research

## 1. Efficient Eager Loading in Async SQLAlchemy
- Detail views require fetching `genres`, `external_ids`, and `titles` in a single query to avoid lazy load `MissingGreenlet` exceptions in async sessions.
- Using `selectinload(Media.genres)`, `selectinload(Media.external_ids)`, `selectinload(Media.titles)` ensures optimized batch queries with low latency.
- For credits: separate endpoint `GET /api/v1/media/{id}/credits` loads `Credit` joined with `Person`, ordered by `Credit.order` for cast, preventing bloat in the main detail endpoint.
- For seasons: `GET /api/v1/media/{id}/seasons` fetches seasons ordered by `season_number`. Fetching episodes on demand per season prevents loading hundreds of episodes when viewing series metadata.

## 2. Provenance & Attribution (DETL-04)
- `Media.external_ids` stores third-party references (e.g. `{"provider": "tmdb", "external_id": "157336"}`).
- The response explicitly maps these into `provenance: List[ExternalIDDTO]` so frontends and consumers know the provenance and attribution links of each item.
- Fallback or multi-source aggregation is clearly indicated.

## 3. Schema Definitions
- `MediaDetailDTO`: Full canonical media record with genres, titles, external IDs, and season summary.
- `MediaCreditsDTO`: Grouped cast and crew.
- `SeasonSummaryDTO` and `SeasonDetailDTO`: Season information and child episodes.
- `EpisodeDetailDTO`: Episode metadata.
