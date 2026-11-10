# Phase 9: Playback & Streaming Embed Engine - Context

## Requirements
- **PLAY-01**: Backend exposes `/api/v1/media/{id}/playback-options` resolving internal UUID to external provider IDs and stream options.
- **PLAY-02**: System routes movie playback requests to allowlisted embed templates (`vidbolt.xyz/movie/{TMDB_ID}` and `embed.reelsdownload.online/player/{TMDB_ID}`).
- **PLAY-03**: System routes TV episode playback requests to allowlisted episode templates (`vidbolt.xyz/tv/{id}/{s}/{e}`) with correct season and episode indexing.
- **PLAY-04**: Frontend player component renders embed in a secure, sandboxed `<iframe>` preventing popup hijacks and unauthorized top-level redirects.
- **PLAY-05**: Player displays clear empty/fallback states when no external TMDB ID or valid stream route is available.

## Design Decisions
1. **Allowlist-Enforced URL Templating**:
   - Only configured domains (`vidbolt.xyz`, `embed.reelsdownload.online`) are allowed.
   - Every generated URL is validated with `urllib.parse.urlparse` to ensure the host matches allowlisted domains.
2. **Dynamic Fallback & Selection**:
   - Multiple embed sources are returned in ordered priority so the frontend can offer a stream switcher if one provider encounters temporary issues.
   - If no external TMDB ID is linked to the media record, the API returns a graceful response with `has_stream: false` and explanatory reason rather than a 500 error.
3. **Iframe Security Hardening**:
   - Strict sandbox policy string returned in API payload:
     `allow-scripts allow-same-origin allow-forms allow-presentation`
   - Intentionally excludes `allow-top-navigation` and `allow-popups` to defend against malicious ad injections and unprompted browser redirects.
