---
phase: 03-metadata-provider-adapters
plan: 02
subsystem: providers
tags: [tmdb, rest, movies, tv, credits, seasons, httpx]

requires:
  - phase: 03-01
    provides: "BaseAdapter and NormalizedMediaDTO"
provides:
  - "TMDBAdapter REST API client for movies, TV series, popular/trending, and seasons"
  - "Normalization for TMDB movies and TV shows into NormalizedMediaDTO"
  - "TMDB mock fixtures and automated unit tests"
affects: [04-ingestion, 06-detail, 09-playback]

tech-stack:
  added: []
  patterns: [REST API client with append_to_response and image path reconstruction]

key-files:
  created:
    - backend/app/providers/tmdb.py
    - backend/tests/fixtures/tmdb_fixtures.py
    - backend/tests/test_tmdb_adapter.py
  modified:
    - backend/app/providers/__init__.py

key-decisions:
  - "TMDB image paths automatically prefixed with https://image.tmdb.org/t/p/w500"
  - "TV status mapped to COMPLETED for ended series and ONGOING for returning series"

patterns-established:
  - "Provider normalization tested with mocked realistic JSON fixtures"

requirements-completed:
  - PROV-01
  - PROV-03

duration: 5min
completed: 2026-11-11
---

# Phase 03 Plan 02: TMDB REST Adapter Summary

**Implemented TMDBAdapter with movie, TV, trending, and season fetching, comprehensive normalization, and mock unit tests.**
