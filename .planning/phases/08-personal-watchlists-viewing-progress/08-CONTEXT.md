# Phase 8: Personal Watchlists & Viewing Progress - Context

## Requirements
- **LIST-01**: User can create, rename, and delete custom named watchlists.
- **LIST-02**: User can add and remove titles from their personal watchlists.
- **LIST-03**: User can update viewing status (Plan to Watch, Watching, Completed, Dropped).
- **LIST-04**: User can track watched episodes and season progress for TV shows and anime.

## Design Decisions
1. **Watchlists & Isolation**:
   - Every watchlist belongs strictly to a `user_id`.
   - Users can only view, edit, add items to, or delete their own watchlists. Any attempt to access another user's watchlist returns HTTP 404 (preventing existence probing) or 403.
   - Enforce composite uniqueness on `(user_id, name)` so duplicate list names are rejected cleanly with HTTP 400.
2. **Viewing Status**:
   - `ViewingStatus` enum: `PLAN_TO_WATCH`, `WATCHING`, `COMPLETED`, `DROPPED`.
   - Stored in `user_media_progress(user_id, media_id)` along with an optional user rating (0-10) and personal notes.
3. **Episode Progress**:
   - Stored in `user_episode_progress(user_id, media_id, episode_id, is_watched, progress_seconds, completed_at)`.
   - Enables tracking season-by-season and series completion percentages (e.g., 18/24 episodes watched).
4. **API Endpoints**:
   - `/api/v1/watchlists` (List, Create)
   - `/api/v1/watchlists/{id}` (Get, Update, Delete)
   - `/api/v1/watchlists/{id}/items` (Add Media, Remove Media)
   - `/api/v1/progress/media/{media_id}` (Get/Set Media Viewing Status & Rating)
   - `/api/v1/progress/episodes/{episode_id}` (Mark Episode Watched/Unwatched)
   - `/api/v1/progress/media/{media_id}/episodes` (Get Watched Episodes for a Media item)
