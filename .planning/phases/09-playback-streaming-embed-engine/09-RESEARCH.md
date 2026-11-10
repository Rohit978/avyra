# Phase 9: Playback & Streaming Embed Engine - Research

## 1. Provider Template Specifications
- **Vidbolt Movies**:
  `https://vidbolt.xyz/movie/{TMDB_ID}`
- **Vidbolt TV Episodes**:
  `https://vidbolt.xyz/tv/{id}/{s}/{e}`
  Where `{id}` is TMDB ID, `{s}` is season number (integer), `{e}` is episode number (integer).
- **ReelsDownload**:
  `https://embed.reelsdownload.online/player/{TMDB_ID}?key=k_5661ac637169a1733857dc50`

## 2. Sandbox Security Directives
- Standard HTML5 `<iframe>` sandbox prevents third-party player ads from navigating the user's top window or launching unrequested popup tabs.
- `allow-scripts`: enables player player controls and video rendering scripts.
- `allow-same-origin`: allows player state and local session cookies within the embed origin.
- `allow-forms`: allows interactive video controls if implemented with form buttons.
- `allow-presentation`: enables native fullscreen presentation mode.
- Omission of `allow-popups` and `allow-top-navigation` strictly shields the host user interface from redirects.

## 3. Empty State & Resilience
- When AniList-only anime has no TMDB ID mapped yet, `has_stream: false` allows the frontend UI to display an informative "Stream unavailable" message rather than a broken player.
