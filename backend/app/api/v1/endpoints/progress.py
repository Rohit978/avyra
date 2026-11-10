from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_db
from backend.app.core.deps import get_current_active_user
from backend.app.models.user import User
from backend.app.schemas.progress import (
    EpisodeProgressResponseDTO,
    EpisodeProgressUpdateRequest,
    MediaProgressResponseDTO,
    MediaProgressUpdateRequest,
)
from backend.app.services.progress import ProgressService

router = APIRouter()


@router.get("/media/{media_id}", response_model=MediaProgressResponseDTO, summary="Get user progress for media")
async def get_media_progress(
    media_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve current user's viewing status and rating for a media item."""
    progress = await ProgressService.get_media_progress(db, current_user.id, media_id)
    if not progress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No viewing progress record found for this media item.",
        )
    return progress


@router.put("/media/{media_id}", response_model=MediaProgressResponseDTO, summary="Update media viewing status")
async def set_media_progress(
    media_id: UUID,
    req: MediaProgressUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update viewing status (Plan to Watch, Watching, Completed, Dropped) and rating."""
    return await ProgressService.set_media_progress(db, current_user.id, media_id, req)


@router.get(
    "/media/{media_id}/episodes",
    response_model=List[EpisodeProgressResponseDTO],
    summary="Get watched episodes progress for a series",
)
async def get_media_episodes_progress(
    media_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all episode progress records for a user on a given media title."""
    return await ProgressService.get_media_episodes_progress(db, current_user.id, media_id)


@router.put(
    "/episodes/{episode_id}",
    response_model=EpisodeProgressResponseDTO,
    summary="Update episode watched status",
)
async def set_episode_progress(
    episode_id: UUID,
    req: EpisodeProgressUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark an episode watched or unwatched and record playback seconds."""
    return await ProgressService.set_episode_progress(db, current_user.id, episode_id, req)
