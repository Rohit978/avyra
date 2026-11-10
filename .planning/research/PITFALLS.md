# Pitfalls Research

**Domain:** Media Catalogue, Ingestion, and Streaming Web Platform
**Researched:** 2026-11-11
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Fragile Video Player Iframe Security & Sandbox Breaks

**What goes wrong:**
Third-party embed player iframes frequently contain intrusive popups, redirects, or malicious ad scripts that hijack user navigation away from the site.

**Why it happens:**
Free streaming embed providers monetize via popunder and redirect ad networks.

**How to avoid:**
Use strict HTML `<iframe>` sandbox attributes: `sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"`. Explicitly omit `allow-top-navigation` and `allow-popups-to-escape-sandbox`. Enforce backend validation of embed domains against an allowlist (`embed.reelsdownload.online`, `vidbolt.xyz`).

**Warning signs:**
Clicking on the player causes the main website window to navigate away or open spam tabs.

**Phase to address:**
Phase addressing Playback & Embed Integration.

---

### Pitfall 2: Duplicate Title Ingestion and Split Seasons

**What goes wrong:**
Same show or movie ingested from multiple sources (e.g. TMDB and AniList) creates separate disconnected records in the database, or multiple seasons get imported as separate top-level TV series.

**Why it happens:**
Titles vary across English, Romaji, and native script (e.g. "Attack on Titan" vs "Shingeki no Kyojin"); providers structure sequels differently.

**How to avoid:**
Map external IDs explicitly in `external_ids(provider, external_id)`. Never auto-merge records solely based on title similarity. Maintain `media_titles` table storing alternate names and languages linked to one canonical media UUID.

**Warning signs:**
Searching for popular anime or movies returns 2-3 duplicate cards with identical artwork.

**Phase to address:**
Phase addressing Data Models & Ingestion Pipeline.

---

### Pitfall 3: Blocking External API Calls in User-Facing Endpoints

**What goes wrong:**
When a user visits `/movies` or `/title/123`, the server tries to make live requests to TMDB or AniList to fetch poster images or cast lists. If the external API is slow or rate-limited, user page loads take 5-10 seconds or crash with 504 Gateway Timeout.

**Why it happens:**
Developers treat third-party APIs as a live backend rather than an ingestion source.

**How to avoid:**
User-facing API endpoints must ONLY query the local PostgreSQL database. All external API calls occur in background ingestion tasks or explicit asynchronous sync jobs.

**Warning signs:**
Home page latency spikes above 2 seconds; rate-limit errors in application logs during peak browsing.

**Phase to address:**
Phase addressing Media API & Ingestion Architecture.

---

### Pitfall 4: Database Performance Degradation on Full-Text Search

**What goes wrong:**
Search queries (`ILIKE '%query%'`) perform full table scans across tens of thousands of media records and crash response times.

**Why it happens:**
Using naive SQL wildcard string matching instead of indexed text search.

**How to avoid:**
Use PostgreSQL `pg_trgm` extension with GIN indexes on primary and alternate titles, and a dedicated `tsvector` column with language-aware stemming.

**Warning signs:**
Search queries taking > 1.5 seconds once catalogue grows beyond 5,000 items.

**Phase to address:**
Phase addressing Search & Discovery.

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Storing TMDB ID as primary key | Quick setup, eliminates mapping table | Impossible to link AniList or other providers without schema overhaul | NEVER — use internal UUID |
| Hardcoding embed URLs in frontend | Fast UI prototyping | Can't change embed parameters, rotate keys, or switch providers without frontend deploy | NEVER — configure in backend |
| Polling third-party APIs without caching | Always up-to-date data | Hits rate limits, gets IP banned by TMDB/AniList | NEVER — ingest into DB |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| TMDB | Forgetting that TV episode counting varies by season format (specials vs S01) | Store explicit `season_number` and `episode_number` alongside `air_date`. |
| AniList | Using unauthenticated GraphQL queries with huge payloads hitting complexity limit | Request only required fields (`id, title, format, episodes, coverImage, status`). |
| VidBolt / ReelsDownload Embeds | Passing unpadded or wrong parameter format for season/episode | Verify if provider expects `{s}/{e}` as integers (`1/1`) or zero-padded (`01/01`). |

## "Looks Done But Isn't" Checklist

- [ ] **Embed Player:** Plays video on desktop, but verify mobile touch response, fullscreen toggle, and popup blocking.
- [ ] **Watchlists:** Allows adding items, but verify cross-user isolation (User A cannot view/edit User B's private list).
- [ ] **Search Autocomplete:** Suggests items as you type, but verify debounce prevents 20 queries from firing for a 20-letter word.
- [ ] **Ingestion:** Successfully ingests 20 items, but verify running the script twice does not create 40 items.

---
*Pitfalls research for: Media Catalogue & Discovery Platform*
*Researched: 2026-11-11*

