---
phase: 04-ingestion-engine-deduplication-pipeline
plan: 02
subsystem: ingestion
tags: [pipeline, resolver, idempotent, savepoints, deduplication]

requires:
  - phase: 04-01
    provides: "IngestionRun audit model"
  - phase: 03-01
    provides: "NormalizedMediaDTO"
provides:
  - "IdentityResolver mapping external IDs to canonical media"
  - "IngestionPipeline executing idempotent upserts for media, titles, genres, seasons, episodes, and credits"
  - "Fault-tolerant savepoint handling per item"
affects: [04-03, 05-search, 06-detail, 11-admin]

tech-stack:
  added: []
  patterns: [nested transaction savepoints for fault-tolerant batch processing]

key-files:
  created:
    - backend/app/ingestion/resolver.py
    - backend/app/ingestion/pipeline.py
  modified:
    - backend/app/ingestion/__init__.py

key-decisions:
  - "Lookup by (provider, external_id) determines update vs insert"
  - "begin_nested() savepoint isolates each record so bad items don't fail the batch"

patterns-established:
  - "Upsert returns (media, is_created: bool) ensuring accurate metrics tracking"

requirements-completed:
  - INGEST-02
  - INGEST-03

duration: 5min
completed: 2026-11-11
---

# Phase 04 Plan 02: Pipeline & Identity Resolver Summary

**Implemented IdentityResolver and IngestionPipeline with savepoint-isolated idempotent upserts across all media child entities.**
