# Phase 4: Ingestion Engine & Deduplication Pipeline - Context

**Gathered:** 2026-11-11
**Status:** Ready for planning
**Source:** PRD Express Path (PRD.md)

<domain>
## Phase Boundary

Implement the transactional, idempotent ingestion engine, cross-provider identity resolver, run metrics logging model, and CLI execution commands for batch metadata synchronization.

Requirements covered:
- **INGEST-01**: Ingestion CLI command imports trending, popular, and seasonal media batches with configurable page limits.
- **INGEST-02**: Ingestion pipeline executes idempotent upserts preventing duplicate media creation on repeated runs.
- **INGEST-03**: Ingestion resolver links external provider records to existing canonical media without fuzzy auto-merge risks.
- **INGEST-04**: Ingestion system records execution status, start/end timestamps, record counts, and failure summaries in `ingestion_runs`.

</domain>

<decisions>
## Implementation Decisions

### Ingestion Run Model (INGEST-04)
- Table `ingestion_runs`:
  - `id` (UUID)
  - `provider` (String)
  - `job_type` (String, e.g. "popular", "trending", "seasonal", "single")
  - `status` (Enum: `PENDING`, `RUNNING`, `COMPLETED`, `FAILED`, `PARTIAL`)
  - `started_at`, `completed_at` (DateTime timezone-aware)
  - `records_processed`, `records_created`, `records_updated`, `records_failed` (Integers)
  - `error_details` (JSONB)

### Identity Resolver & Idempotent Upsert (INGEST-02, INGEST-03)
- Located in `backend/app/ingestion/resolver.py` and `pipeline.py`:
  1. Check if `external_ids` already contains `(provider, external_id)`.
  2. If found -> Fetch existing `Media` record and execute UPDATE with incoming normalized fields, preserving field provenance.
  3. If not found -> Check secondary provider IDs if available (e.g. AniList provides `idMal`).
  4. If still not found -> Create NEW canonical `Media` record and INSERT `external_ids` row.
  5. Upsert titles in `media_titles` avoiding duplicate strings.
  6. Upsert seasons and episodes with composite constraints `(media_id, season_number)` and `(season_id, episode_number)`.
  7. Upsert people and credits linking talent.
  8. Wrap each record upsert in a nested database transaction or savepoint so one bad record does not abort the entire batch.

### Ingestion CLI (INGEST-01)
- CLI module in `backend/app/ingestion/cli.py` runnable via `python -m backend.app.ingestion.cli`:
  - Subcommands: `popular`, `trending`, `details`
  - Flags: `--provider [tmdb|anilist]`, `--limit <int>`, `--pages <int>`
  - Live progress display and final run summary statistics printed to stdout.

### Testing & Verification
- Unit & integration tests simulating repeated runs of the same batch to verify that running an import twice results in `records_created == 0` and `records_updated > 0` on the second run, with total media row count remaining identical.

</decisions>

<canonical_refs>
## Canonical References

### PRD & Architectural References
- `PRD.md` — Section 8.4 (Catalogue ingestion), Section 12 (Ingestion and Synchronization Design)
- `.planning/phases/02-database-architecture-core-data-models/02-01-SUMMARY.md` — Canonical Media and ExternalID models
- `.planning/phases/03-metadata-provider-adapters/03-01-SUMMARY.md` — NormalizedMediaDTO structure

</canonical_refs>

---

*Phase: 04-ingestion-engine-deduplication-pipeline*
*Context gathered: 2026-11-11 via PRD Express Path*
