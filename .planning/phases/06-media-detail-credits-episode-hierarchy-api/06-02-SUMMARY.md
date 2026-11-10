# Plan 06-02 Summary: Cast, Crew, and Credits Query Endpoints

## Overview
Implemented and verified the media credits endpoint `GET /api/v1/media/{id}/credits` providing grouped cast and crew rosters with character names, jobs, and profile image links.

## Changes Completed
1. **Schemas (`backend/app/schemas/detail.py`)**:
   - Implemented `CastMemberDTO`, `CrewMemberDTO`, and `MediaCreditsDTO`.
2. **Service (`backend/app/services/detail.py`)**:
   - Implemented `MediaDetailService.get_media_credits` joining `Credit` with `Person` and ordering by cast order and crew department.
3. **Endpoint (`backend/app/api/v1/endpoints/media.py`)**:
   - Added `GET /api/v1/media/{media_id}/credits` returning `MediaCreditsDTO` or HTTP 404 when media does not exist.
4. **Verification**:
   - Tested cast and crew credit retrieval in `backend/tests/test_media_detail_api.py`.
