# Project Research Summary

**Project:** Cineverse
**Domain:** Media Discovery, Catalogue Aggregation & Streaming Embed Platform
**Researched:** 2026-11-11
**Confidence:** HIGH

## Executive Summary

Cineverse is a unified media discovery and streaming platform aggregating metadata from TMDB, AniList, and TV enrichment providers into a single PostgreSQL catalogue with canonical internal UUIDs. It provides a polished Next.js cinematic web frontend with fast discovery, multi-provider search, personalized user watchlists, episode viewing progress, and a secure embed player engine supporting user-configured streaming templates (`vidbolt.xyz` and `embed.reelsdownload.online`).

The recommended architecture is a clean, modular monolith comprising a Python FastAPI backend and a Next.js 15 App Router frontend. This approach completely satisfies the ₹0 initial infrastructure budget constraint while providing high reliability, strong typing, and simple local Docker Compose development.

Key risks identified include rate-limiting during metadata ingestion, duplicate records across differing provider naming schemes, search latency on large catalogues, and browser redirect/popup intrusion from third-party embed iframes. All risks have concrete architectural mitigations designed upfront.

## Key Findings

### Recommended Stack

- **Backend:** Python FastAPI with SQLAlchemy 2.0 (async), Pydantic v2 schemas, Alembic migrations, HTTPX for external provider ingestion.
- **Database:** PostgreSQL 15+ leveraging relational foreign keys for external IDs and watchlists, plus `pg_trgm` and `tsvector` for fast, zero-dependency search.
- **Frontend:** Next.js 15 (App Router, React 19/18, TypeScript) with Tailwind CSS for dark cinematic UI and Lucide icons.
- **Security & Playback:** Argon2id password hashing, HttpOnly session cookies, and strict iframe sandboxing for embed players.

### Expected Features

**Must have (table stakes):**
- Responsive home page with trending/popular carousels and genre browsing.
- Unified catalogue across movies, TV series, anime, and documentaries.
- Fast full-text and alternate title search with debounced suggestions.
- Media detail pages with cast, genres, overview, seasons, and episodes.
- User registration, authentication, custom watchlists, and episode progress tracking.
- Video playback integration with configurable embed providers.
- Admin dashboard for monitoring ingestion runs and retrying failed records.

**Should have (competitive):**
- Multi-provider ID linking (TMDB, AniList, TVmaze).
- Dedicated anime discovery mode with Romaji/English title support and seasonal filtering.
- Multi-source embed player routing with fallback options.

**Defer (v2+):**
- Meilisearch / Elasticsearch cluster.
- Distributed Celery/Redis cluster.
- Social community features and public user review feeds.

### Architecture Approach

A modular monolith structured into `backend/` and `frontend/` workspaces within a single repository:
1. **Core Relational Storage:** PostgreSQL handles canonical media, external provider IDs, user libraries, and search indices.
2. **Ingestion & Adapter Pipeline:** Modular Python adapters fetch and normalize external provider data into standard DTOs; transactional upsert ensures complete idempotency.
3. **Playback Router:** Server-side parameterized URL generator mapping canonical media TMDB IDs to allowlisted embed templates.
4. **Cinematic Web UI:** Server-rendered discovery pages with responsive interactive client components for smooth media browsing.

### Critical Pitfalls

1. **Third-Party Embed Popups/Hijacks:** Prevented by enforcing strict iframe sandbox attributes (`allow-scripts allow-same-origin allow-presentation allow-forms` without top navigation) and server-side domain allowlisting.
2. **Duplicate Ingestion & Split Titles:** Prevented by enforcing composite unique constraints on `(provider, external_id)` and avoiding fuzzy auto-merges.
3. **Slow Page Loads via Live Third-Party Calls:** Prevented by strictly isolating user-facing API endpoints to local PostgreSQL queries; all external API calls are confined to background ingestion jobs.
4. **Full-Text Search Latency:** Prevented by indexing titles with PostgreSQL `pg_trgm` and `tsvector` GIN indexes.

## Implications for Roadmap

Given the user's choice of **Fine** granularity (8-12 focused phases) and **Sequential** execution, the roadmap decomposes into 10 structured, progressive phases:

1. **Phase 1: Project Foundation & Environment Setup** — Repository structure, Docker Compose PostgreSQL, FastAPI skeleton, Next.js skeleton, CI and health checks.
2. **Phase 2: Database Architecture & Core Data Models** — Canonical media schema, external IDs, titles, genres, seasons, episodes, and Alembic migrations.
3. **Phase 3: Provider Adapter Layer** — Abstract adapter contracts and concrete implementations for TMDB (REST) and AniList (GraphQL) with unit test fixtures.
4. **Phase 4: Ingestion Engine & Deduplication Pipeline** — Idempotent batch ingestion commands, identity resolution, provenance tracking, and error retry logging.
5. **Phase 5: Search & Discovery Backend API** — PostgreSQL trigram/full-text search, debounced suggestions, multi-attribute filtering, and curated collection endpoints.
6. **Phase 6: User Authentication & Personal Library API** — Argon2id authentication, JWT/session handling, custom watchlists, and episode viewing progress.
7. **Phase 7: Playback & Streaming Embed Engine** — Configurable embed provider routing (`reelsdownload`, `vidbolt`), parameterized template resolution, and fallback handling.
8. **Phase 8: Frontend Core & Media Discovery UI** — Next.js layout, dark cinematic theme, responsive home page, browsing grids, and filter drawers.
9. **Phase 9: Frontend Detail, Library & Player Integration** — Detail view with season/episode selector, watchlist management UI, and sandboxed embed player.
10. **Phase 10: Admin Diagnostics, Hardening & End-to-End Verification** — Ingestion run monitoring UI, retry controls, performance tuning, security review, and full user journey verification.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Battle-tested FastAPI + PostgreSQL + Next.js stack aligned with modern best practices. |
| Features | HIGH | Detailed PRD provided by user with clear P0/P1 boundaries and explicit embed requirements. |
| Architecture | HIGH | Clean modular monolith with clear provider isolation and canonical data model. |
| Pitfalls | HIGH | Known edge cases in streaming embeds, ingestion deduplication, and search identified with fixes. |

**Overall confidence:** HIGH

---
*Research completed: 2026-11-11*
*Ready for roadmap: yes*
