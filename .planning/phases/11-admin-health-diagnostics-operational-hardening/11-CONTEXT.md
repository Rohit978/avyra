# Phase 11: Admin Health, Diagnostics & Operational Hardening - Context

## Requirements
- **ADMIN-01**: Admin user can view ingestion run histories, durations, record counts, and error summaries.
- **ADMIN-02**: Admin user can trigger safe retry for failed ingestion records from previous runs.
- **ADMIN-03**: Admin user can review duplicate candidate pairs flagged by conservative resolution.
- **ADMIN-04**: Repository includes documented database backup and restore scripts for zero-budget recovery.

## Design Decisions
1. **Admin Authorization**:
   - Every admin endpoint is strictly protected by the `require_admin` dependency (`UserRole.ADMIN`).
   - Normal users receive HTTP 403 Forbidden; unauthenticated requests receive HTTP 401 Unauthorized.
2. **Ingestion Run Diagnostics**:
   - Query `ingestion_runs` table with sorting by `started_at` descending and computed duration in seconds.
   - Detailed view includes `error_details` JSON payload logging failed items, provider error codes, and stack traces.
3. **Safe Ingestion Retry**:
   - `POST /api/v1/admin/ingestion/runs/{run_id}/retry` inspects the failed run's error log and re-executes upserts through the idempotent `IngestionPipeline`.
4. **Conservative Duplicate Candidate Review**:
   - Exposes candidate pairs where normalized title matches an existing title across different external IDs, allowing manual inspection and merge decisions.
5. **Zero-Budget Backup & Restore Runbooks**:
   - Standalone, container-native backup scripts (`backup.sh` / `backup.ps1`) dumping compressed PostgreSQL snapshots using `pg_dump`.
   - Comprehensive documentation in `docs/backup_restore.md`.
