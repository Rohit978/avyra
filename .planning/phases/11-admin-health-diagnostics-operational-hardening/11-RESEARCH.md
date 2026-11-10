# Phase 11: Admin Health, Diagnostics & Operational Hardening - Research

## 1. Ingestion Diagnostics Architecture
- Table `ingestion_runs` stores:
  - `started_at`, `completed_at`
  - `total_processed`, `success_count`, `error_count`
  - `error_details` (JSONB)
- Duration computation: `(completed_at - started_at).total_seconds()`
- Failed record retry relies on the idempotency guarantees established in Phase 4 (`IngestionPipeline`). Because upserts check `(provider, external_id)` and rollback via savepoint on failure, retrying only processes previously failed payloads.

## 2. Zero-Budget Backup & Restore (ADMIN-04)
- PostgreSQL running in Docker Compose (`cineverse_postgres`):
  - Backup: `docker exec -t cineverse_postgres pg_dump -U postgres cineverse | gzip > backups/cineverse_$(date +%Y%m%d_%H%M%S).sql.gz`
  - Restore: `gunzip -c backup_file.sql.gz | docker exec -i cineverse_postgres psql -U postgres -d cineverse`
- Windows PowerShell equivalents provided via `backup.ps1` and `restore.ps1`.
- Fully documented in `docs/backup_restore.md`.
