# Plan 09-02 Summary: Parameterized URL Generator and Domain Allowlist Validation

## Overview
Implemented parameterized embed templates with strict domain allowlist checking for both `vidbolt.xyz` and `embed.reelsdownload.online`.

## Changes Completed
1. **Parameterized URL Formatting**:
   - Movie template: `https://vidbolt.xyz/movie/{TMDB_ID}` and `https://embed.reelsdownload.online/player/{TMDB_ID}?key=k_5661ac637169a1733857dc50`.
   - TV episode template: `https://vidbolt.xyz/tv/{id}/{s}/{e}` with season and episode numbers.
2. **Domain Allowlist Validation**:
   - Validated every embed URL against `ALLOWED_EMBED_DOMAINS` (`vidbolt.xyz`, `embed.reelsdownload.online`), rejecting any unverified domains.
3. **Verification**:
   - Verified template output and domain validation in `backend/tests/test_playback_api.py`.
