# Phase 6: Media Detail, Credits & Episode Hierarchy API - Context

## Requirements
- **DETL-01**: User can view full media detail page including synopsis, release date, genres, ratings, and artwork.
- **DETL-02**: User can browse cast and crew credits with character names and profile images.
- **DETL-03**: User can navigate seasons and view episode listings with episode titles, numbers, and overviews.
- **DETL-04**: User can view provider provenance and attribution for metadata sources.

## Design Decisions
1. **Media Detail Representation**:
   - Endpoint: `GET /api/v1/media/{id}` (where `{id}` is canonical UUID).
   - Returns complete `MediaDetailDTO`:
     - Core fields: ID, title, original_title, overview, media_type, status, release_date, end_date, runtime, country_of_origin, original_language.
     - Metrics: popularity, vote_average, vote_count.
     - Visuals: poster_url, backdrop_url.
     - Genres: list of genre objects or names.
     - Alternate titles: list of `MediaTitleDTO` (language, title, title_type).
     - External IDs / Provenance: list of `ExternalIDDTO` (provider, external_id) indicating metadata provenance (TMDB, AniList).
     - Season count and episode count summaries for episodic media.
2. **Credits & People**:
   - Endpoint: `GET /api/v1/media/{id}/credits`.
   - Returns `MediaCreditsDTO`:
     - `cast`: list of `CastCreditDTO` (person_id, name, character_name, profile_path, order).
     - `crew`: list of `CrewCreditDTO` (person_id, name, department, job, profile_path).
3. **Seasons & Episodes**:
   - `GET /api/v1/media/{id}/seasons`: List of seasons with season_number, title, overview, poster_path, air_date, episode_count.
   - `GET /api/v1/media/{id}/seasons/{season_number}`: Detailed season info including list of episodes.
   - `GET /api/v1/media/{id}/seasons/{season_number}/episodes/{episode_number}`: Specific episode details including still_path, runtime, overview, air_date.
4. **Error Handling**:
   - Return HTTP 404 with structured detail when media, season, or episode is not found.
   - Return HTTP 400 when invalid UUID is passed.
