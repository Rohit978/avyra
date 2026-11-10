# Feature Research

**Domain:** Media Catalogue, Discovery & Streaming Platform
**Researched:** 2026-11-11
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Unified Media Discovery (Home/Browse) | Core reason to visit: browsing movies, TV, anime with posters, ratings, and synopses | MEDIUM | High-quality media cards, trending/popular rows, carousels. |
| Global Search & Instant Suggestions | Users search directly for titles, alternate names, or people | MEDIUM | PostgreSQL trigram + full-text indexing, debounced input. |
| Media Detail Pages | Users need overviews, cast, genres, seasons, episodes, and release info | MEDIUM | Responsive layouts, tabbed navigation for seasons/episodes. |
| Multi-Attribute Filtering & Sorting | Discovery requires narrowing by genre, release year, media type, and rating | LOW | Allowlist-validated query parameters. |
| User Accounts & Watchlists | Saving content for later viewing across devices | MEDIUM | Email/password auth (Argon2id), multiple named watchlists. |
| Episode & Progress Tracking | Tracking watched episodes for TV shows and anime | MEDIUM | Tracking status (Watching, Completed, Plan to Watch) and episode index. |
| Streaming / Playback Embeds | Finding how and where to watch, with an instant responsive player | MEDIUM | Configurable embed player iframe with fullscreen & error state. |

### Differentiators (Competitive Advantage)

Features that set the product apart.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Multi-Provider ID Mapping & Deduplication | Canonical media records link TMDB, AniList, TVmaze, and Jikan IDs together without duplicates | HIGH | Deterministic UUID + `external_ids` table with unique constraint per provider. |
| First-Class Anime Support | Anime treated with equal care as mainstream Hollywood (romaji/kanji titles, seasonal sorting, studios, episode counts) | MEDIUM | Enriched via AniList GraphQL adapter alongside TMDB. |
| Dual Configurable Player Engine | Immediate support for user-specified embed providers (`reelsdownload` and `vidbolt`) with movie & TV episode routing | MEDIUM | Dynamic template resolution: `{TMDB_ID}`, `{season}`, `{episode}` with security allowlisting. |
| Transparent Provider Provenance & Diagnostics | Admin dashboard showing sync health, raw payload snapshots, error traces, and retry queues | MEDIUM | Ingestion run tracking table and administrative endpoints. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| In-browser Video Scraping / Bypassing Controls | Free immediate streaming without embeds | Violates anti-bot policies, breaks frequently, incurs legal and operational risks | Configurable, allowlisted player embed iframes (`vidbolt`, `reelsdownload`). |
| Direct Video File Hosting & Transcoding | Full control over playback pipeline | Massive bandwidth and cloud storage costs (unfeasible at ₹0 budget) | Third-party authorized embeds and licensed stream redirects. |
| Auto-merging titles solely on fuzzy title match | Reduces duplicate entries automatically | Causes disastrous false merges (e.g. remakes, sequels, anime reboots) | Conservative exact external ID matching + human review flag for fuzzy candidates. |
| Full-Catalogue Provider Crawling on User Request | "Always fresh" data on every page load | Exceeds provider rate limits instantly; slows page response to several seconds | Scheduled background/CLI ingestion jobs + cached database reads. |

## Feature Dependencies

```
[Provider Adapters (TMDB, AniList)]
    └──feeds──> [Normalization & Deduplication Engine]
                    └──populates──> [Canonical Media Database (PostgreSQL)]
                                        ├──serves──> [Discovery & Search API]
                                        │               └──renders──> [Cinematic Frontend UI]
                                        ├──links──> [Player Embed Service (TMDB ID / s / e)]
                                        └──stores──> [User Watchlists & Progress Tracking]
```

### Dependency Notes

- **Normalization & Deduplication Engine requires Provider Adapters**: External JSON/GraphQL must be normalized to standard DTOs before database insertion.
- **Player Embed Service requires Canonical Media with TMDB ID**: Embed providers depend on resolved TMDB IDs and season/episode indices.
- **User Watchlists require User Authentication & Canonical Media**: Watchlist items link foreign keys `user_id` and canonical `media_id`.

## MVP Definition

### Launch With (v1)

- [ ] Core database schema with UUIDs, media types, external IDs, seasons, and episodes.
- [ ] TMDB and AniList ingestion adapters with repeatable CLI runner.
- [ ] Responsive cinematic frontend (Home, Movies, TV, Anime, Detail pages).
- [ ] Fast search with debounced suggestions.
- [ ] Secure user authentication and custom watchlists.
- [ ] Watching progress tracking for TV and anime episodes.
- [ ] Configurable player embed integrating `embed.reelsdownload.online` and `vidbolt.xyz`.
- [ ] Admin ingestion status & retry monitor.

### Add After Validation (v1.x)

- [ ] TVmaze and Jikan enrichment adapters for additional anime/TV metadata.
- [ ] Public shareable user watchlists.
- [ ] Advanced recommendation algorithms based on watchlist tags.

### Future Consideration (v2+)

- [ ] Meilisearch integration if PostgreSQL search hits latency thresholds.
- [ ] Distributed Celery/Redis worker cluster for massive multi-million title ingestion.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Canonical Media Schema & Database | HIGH | MEDIUM | P1 |
| TMDB / AniList Adapters & Ingestion | HIGH | MEDIUM | P1 |
| Responsive Frontend (Home/Browse/Detail) | HIGH | MEDIUM | P1 |
| Search & Filtering | HIGH | MEDIUM | P1 |
| Embed Player Integration (ReelsDownload + VidBolt) | HIGH | LOW | P1 |
| Auth & Personal Watchlists / Progress | HIGH | MEDIUM | P1 |
| Admin Health & Ingestion Retry API | MEDIUM | LOW | P1 |
| Secondary Provider Enrichment (Jikan, TVmaze) | MEDIUM | MEDIUM | P2 |
| Meilisearch Migration | LOW | HIGH | P3 |

---
*Feature research for: Media Catalogue & Discovery Platform*
*Researched: 2026-11-11*

