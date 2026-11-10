# Phase 5: Search & Discovery Backend API - Research

## 1. PostgreSQL Trigram & Full-Text Search
- PostgreSQL extension `pg_trgm` provides `similarity(column, query)` and trigram distance operators (`<->`, `%>`).
- GIN indexes with `gin_trgm_ops` allow fast indexed lookups even for substring and fuzzy matches:
  `CREATE INDEX idx_media_title_trgm ON media USING gin (title gin_trgm_ops);`
  `CREATE INDEX idx_media_titles_title_trgm ON media_titles USING gin (title gin_trgm_ops);`
- In Alembic, creating `pg_trgm` can be safely wrapped in `CREATE EXTENSION IF NOT EXISTS pg_trgm;`.
- Because unit tests use SQLite in-memory (`sqlite+aiosqlite`), SQLAlchemy expressions should dynamically branch:
  ```python
  dialect = session.bind.dialect.name
  if dialect == "postgresql":
      # use func.similarity, func.to_tsvector, or pg_trgm operators
  else:
      # use ilike for test assertions
  ```

## 2. Autocomplete Latency Optimization
- Autocomplete queries must return in < 300ms.
- Limit suggestions to top 8 items.
- Avoid large joins: select only necessary presentation columns (`id`, `title`, `original_title`, `media_type`, `release_date`, `poster_path`, `vote_average`).
- Order by exact match / prefix match first, then similarity, then popularity descending.

## 3. Filtered Browsing & Pagination Architecture
- Standard pagination format:
  ```json
  {
    "items": [...],
    "page": 1,
    "limit": 20,
    "total": 142,
    "total_pages": 8
  }
  ```
- Filtering criteria:
  - `media_type`: Enum (`MOVIE`, `TV_SHOW`, `ANIME`, etc.)
  - `genre`: UUID or slug/name
  - `year`: integer release year `extract('year', Media.release_date) == year`
  - `status`: Enum (`RELEASED`, `PLANNED`, `IN_PRODUCTION`, etc.)
  - `sort_by`: `popularity`, `vote_average`, `release_date`, `created_at`
  - `order`: `desc` (default) or `asc`
