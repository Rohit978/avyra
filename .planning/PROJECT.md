# Cineverse

## What This Is

Cineverse is a unified media discovery, catalogue, and playback web platform for movies, television series, anime, documentaries, and short films. Backed by FastAPI, PostgreSQL, and Next.js, it normalizes disparate external metadata (from TMDB, AniList, TVmaze, and Jikan) into a single provider-independent catalogue, mapped to canonical internal UUIDs, and delivers a sleek, responsive cinematic frontend with search, personal watchlists, viewing progress, and configurable embed players.

## Core Value

Unified provider-independent media discovery and tracking that seamlessly aggregates and normalizes multi-source metadata into one high-integrity catalogue with lightning-fast search, robust user libraries, and reliable media playback integration.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] **Core Data Model & Database Architecture**: PostgreSQL schema with canonical UUID primary keys, support for MOVIE, TV_SHOW, ANIME, DOCUMENTARY, SHORT_FILM, seasons, episodes, credits, genres, and external ID mappings via SQLAlchemy 2.x & Alembic.
- [ ] **Provider Adapter Layer**: Unified adapter interface and normalization pipeline for TMDB (REST) and AniList (GraphQL), with extensible contracts for Jikan and TVmaze.
- [ ] **Idempotent Ingestion Engine**: Repeatable background ingestion commands, exact-ID deduplication, field-level provenance, run tracking, rate-limiting compliance, and safe retry mechanisms.
- [ ] **Discovery & High-Performance Search**: PostgreSQL full-text and trigram (`pg_trgm`) search across primary and alternate titles, debounced suggestions, multi-facet filtering (genre, year, status, format), and curated collections (trending, popular, top-rated).
- [ ] **Rich Media Detail & Series Navigation**: Detailed media pages with overviews, high-res posters/backdrops, cast/crew credits, season/episode navigation, and provider provenance attribution.
- [ ] **User Authentication & Personal Library**: Argon2id password hashing, secure session management, custom user watchlists, watch status (watching, plan-to-watch, completed), and granular episode progress tracking.
- [ ] **Configurable Embed Playback Engine**: Safe player module with an allowlist of approved embed endpoints supporting parameterized template URLs (including `embed.reelsdownload.online` and `vidbolt.xyz` for movies and TV episodes) with fallback availability states.
- [ ] **Admin & Diagnostics Dashboard**: Role-protected management interface for inspecting ingestion run logs, viewing provider health, reviewing duplicate candidates, and triggering manual imports/retries.
- [ ] **Responsive Cinematic Frontend**: Next.js App Router frontend with Tailwind CSS, dark cinematic theme, responsive layout across mobile/desktop, accessible navigation, and skeleton loading states.
- [ ] **Zero-Budget Local & Containerized Setup**: Docker Compose configuration for PostgreSQL and services, comprehensive pytest/HTTPX test suite, environment templates, and documentation.

### Out of Scope

- Self-hosting or directly distributing copyrighted video streams — playback relies on external embed players / authorized provider links to keep infrastructure cost zero and avoid hosting copyrighted binaries.
- Scraping video hosts with headless browsers or bypassing DRM / paywalls / anti-bot gates.
- Native mobile applications (iOS/Android) for v1 — focus is entirely on a first-class responsive web application.
- Microservices, Kafka, or Kubernetes deployment — modular monolith structure handles all requirements efficiently without premature operational overhead.
- Social feeds, user messaging, or public community reviews in MVP.

## Context

- Detailed specification defined in `PRD.md` (v1.0).
- Monorepo structure (`frontend/`, `backend/`, `infrastructure/`, `docs/`).
- Initial player embed providers configured:
  - `https://embed.reelsdownload.online/player/{TMDB_ID}?key=k_5661ac637169a1733857dc50`
  - `https://vidbolt.xyz/movie/{TMDB_ID}` (Movies)
  - `https://vidbolt.xyz/tv/{id}/{s}/{e}` (TV Episodes)
- Zero initial infrastructure budget (Docker local development, free tier deployment).

## Constraints

- **Tech Stack**: Next.js (TypeScript, Tailwind CSS), Python FastAPI (SQLAlchemy 2.x, Alembic, Pydantic v2), PostgreSQL 15+.
- **Budget**: ₹0 initial spend; local execution and eligible free-tier hosting.
- **Provider Quotas**: Respect TMDB, AniList, and TVmaze rate limits and attribution requirements.
- **Performance Targets**: Home API p95 < 800ms, Detail API p95 < 500ms, Search API p95 < 1s.
- **Security**: Argon2id password hashing, HttpOnly SameSite cookies / JWT, strict player embed allowlist.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Modular Monolith Architecture | Keeps local development and deployment simple with zero infrastructure cost | — Pending |
| Canonical Internal UUID with `external_ids` | Decouples internal data model from any single third-party provider schema | — Pending |
| Anime as First-Class Category | Allows specialized metadata (seasons, format, studios) while preserving original media classification | — Pending |
| Configurable Embed Player Allowlist | Enables clean integration of user-specified embed providers (`reelsdownload`, `vidbolt`) while maintaining security boundaries | — Pending |
| PostgreSQL FTS + `pg_trgm` for MVP | Delivers fast typo-tolerant search without requiring an external search cluster service | — Pending |

---
*Last updated: 2026-11-11 after initialization*

