# Phase 8: Personal Watchlists & Viewing Progress - Research

## 1. Schema Design for User Collections & Progress
- **Watchlist & WatchlistItem**:
  - `watchlists` holds custom lists created by users (e.g., "Favorites", "Summer Anime 2026", "Must Watch Movies").
  - `watchlist_items` maps `watchlist_id` to `media_id` with ordering index and `added_at` timestamp.
  - Cascade deletes: deleting a watchlist automatically cascades to delete all its `watchlist_items`.
- **Viewing Status & Episode Tracking**:
  - Decoupling watchlists from viewing status provides flexibility: a user can set a show to `WATCHING` without putting it in a custom watchlist, or have it in multiple watchlists simultaneously.
  - `user_media_progress`: keyed on `(user_id, media_id)`.
  - `user_episode_progress`: keyed on `(user_id, episode_id)`.

## 2. Security & Account Isolation
- In all database queries for watchlists or progress, filter explicitly by `user_id == current_user.id`.
- If an ID exists in the database but belongs to another user, return HTTP 404 (or 403) to prevent information leakage.
