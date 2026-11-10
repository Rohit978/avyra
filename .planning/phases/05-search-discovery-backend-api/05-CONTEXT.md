# Phase 5: Search & Discovery Backend API - Context

## Requirements
- **SRCH-01**: User can search media titles and alternate titles with typo-tolerant PostgreSQL trigram (`pg_trgm`) and full-text search.
- **SRCH-02**: User can receive debounced search autocomplete suggestions within 300ms.
- **SRCH-03**: User can filter media by media type, genre, release year, and status with paginated results.
- **SRCH-04**: User can browse curated home page collections (trending, popular, top-rated, upcoming).

## Design Decisions
1. **Search Query Strategy**:
   - Primary matching on `Media.title` and `MediaTitle.title` (canonical and alternate/localized names).
   - PostgreSQL production queries leverage `pg_trgm` GIN index with `similarity()` ranking and `to_tsvector` full-text search.
   - SQLite test fallback gracefully uses case-insensitive `ILIKE` substring and prefix matching so local unit test suites run fast and dependency-free.
2. **Autocomplete Suggestions**:
   - Endpoint: `GET /api/v1/search/suggestions?q=...&limit=8`.
   - Lightweight DTO returning ID, title, original title, media type, release year, and poster URL.
   - Optimized for <300ms latency with minimal joins and index-backed queries.
3. **Full Search Endpoint**:
   - Endpoint: `GET /api/v1/search?q=...&media_type=...&genre=...&year=...&page=1&limit=20`.
   - Returns paginated `SearchResponse` including total count, total pages, current page, and list of normalized media cards.
4. **Catalogue Browsing & Curated Feeds**:
   - Endpoint: `GET /api/v1/media` with filter parameters: `media_type`, `genre_id` or `genre_name`, `release_year` (range or exact), `status`, `sort_by` (`popularity`, `vote_average`, `release_date`, `title`), `sort_order` (`asc`, `desc`), `page`, `limit`.
   - Curated endpoints:
     - `GET /api/v1/media/curated/trending` (sorted by popularity descending, high vote count)
     - `GET /api/v1/media/curated/popular` (sorted by popularity descending)
     - `GET /api/v1/media/curated/top-rated` (minimum vote count threshold, sorted by vote average descending)
     - `GET /api/v1/media/curated/upcoming` (release date > current date, sorted by release date ascending)
