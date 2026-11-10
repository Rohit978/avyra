# Phase 3: Metadata Provider Adapters - Research

**Phase:** 03-metadata-provider-adapters
**Researched:** 2026-11-11
**Confidence:** HIGH

## External Provider Specifications

### 1. TMDB (The Movie Database) API v3
- **Base URL:** `https://api.themoviedb.org/3`
- **Authentication:** Query param `api_key` or `Authorization: Bearer <read_access_token>`.
- **Image CDN Base:** `https://image.tmdb.org/t/p/w500` (posters) or `original` (backdrops).
- **Rate Limits:** ~40-50 requests per 10 seconds. Return HTTP 429 when throttled.
- **Key Methods:**
  - `GET /trending/{media_type}/{time_window}`
  - `GET /movie/{movie_id}?append_to_response=credits,alternative_titles,external_ids`
  - `GET /tv/{series_id}?append_to_response=credits,alternative_titles,external_ids`
  - `GET /tv/{series_id}/season/{season_number}`

### 2. AniList GraphQL API v2
- **Endpoint:** `https://graphql.anilist.co`
- **Method:** `POST` with JSON `{ "query": "...", "variables": { ... } }`.
- **Rate Limits:** 90 requests per minute with `X-RateLimit-Remaining` header.
- **Key Query:**
```graphql
query ($page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    media(type: ANIME, sort: POPULARITY_DESC) {
      id
      title { romaji english native }
      format
      status
      description
      startDate { year month day }
      endDate { year month day }
      episodes
      duration
      countryOfOrigin
      isAdult
      genres
      averageScore
      popularity
      coverImage { extraLarge large }
      bannerImage
      studios(isMain: true) { nodes { name } }
      characters { edges { node { name { full } } role } }
    }
  }
}
```

### 3. Normalization Mapping
- TMDB `media_type == "movie"` -> `MediaType.MOVIE`
- TMDB `media_type == "tv"` -> `MediaType.TV_SHOW`
- AniList `media(type: ANIME)` -> `MediaType.ANIME`
- TMDB `vote_average` is 0-10 scale. AniList `averageScore` is 0-100 scale (normalize to 0-10 by dividing by 10.0).

---
*Research for Phase 03 completed.*
