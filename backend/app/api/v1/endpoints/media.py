from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_db
from backend.app.models.enums import MediaStatus, MediaType
from backend.app.schemas.detail import (
    EpisodeDTO,
    MediaCreditsDTO,
    MediaDetailDTO,
    SeasonDetailDTO,
    SeasonSummaryDTO,
)
from backend.app.schemas.playback import PlaybackOptionsResponseDTO
from backend.app.schemas.search import MediaSummaryDTO, PaginatedResponse
from backend.app.services.detail import MediaDetailService
from backend.app.services.discovery import DiscoveryService
from backend.app.services.playback import PlaybackService

router = APIRouter()

VALID_COLLECTIONS = {"trending", "popular", "top-rated", "upcoming"}


@router.get("", response_model=PaginatedResponse[MediaSummaryDTO], summary="Browse media catalogue")
async def browse_media(
    media_type: Optional[MediaType] = Query(None, description="Filter by media type"),
    genre: Optional[str] = Query(None, description="Filter by genre name or slug"),
    year: Optional[int] = Query(None, ge=1880, le=2100, description="Filter by release year"),
    status: Optional[MediaStatus] = Query(None, description="Filter by production/release status"),
    sort_by: str = Query("popularity", pattern="^(popularity|vote_average|release_date|title|created_at)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
):
    """
    Browse media catalogue with multi-attribute filtering, dynamic sorting, and pagination.
    """
    return await DiscoveryService.browse_catalogue(
        db=db,
        media_type=media_type,
        genre=genre,
        year=year,
        status=status,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        limit=limit,
    )


@router.get(
    "/curated/{collection}",
    response_model=PaginatedResponse[MediaSummaryDTO],
    summary="Get curated media collection",
)
async def get_curated_collection(
    collection: str,
    media_type: Optional[MediaType] = Query(None, description="Optional media type filter"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve curated collections for home feeds and discovery shelves.
    Supported collections: trending, popular, top-rated, upcoming.
    """
    clean_collection = collection.lower().replace("_", "-")
    if clean_collection not in VALID_COLLECTIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid collection '{collection}'. Must be one of: {', '.join(sorted(VALID_COLLECTIONS))}",
        )

    return await DiscoveryService.get_curated_collection(
        db=db,
        collection=clean_collection,
        media_type=media_type,
        page=page,
        limit=limit,
    )


@router.get("/{media_id}", response_model=MediaDetailDTO, summary="Get full media detail")
async def get_media_detail(
    media_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve comprehensive media metadata including genres, alternate titles, provenance external IDs, and season counts.
    """
    detail = await MediaDetailService.get_media_detail(db=db, media_id=media_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Media item not found")
    return detail


@router.get("/{media_id}/credits", response_model=MediaCreditsDTO, summary="Get cast and crew credits")
async def get_media_credits(
    media_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve cast and crew credits with character roles, departments, jobs, and profile pictures.
    """
    credits = await MediaDetailService.get_media_credits(db=db, media_id=media_id)
    if credits is None:
        raise HTTPException(status_code=404, detail="Media item not found")
    return credits


@router.get("/{media_id}/seasons", response_model=List[SeasonSummaryDTO], summary="Get seasons listing")
async def get_media_seasons(
    media_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve season listing for episodic media.
    """
    seasons = await MediaDetailService.get_media_seasons(db=db, media_id=media_id)
    if seasons is None:
        raise HTTPException(status_code=404, detail="Media item not found")
    return seasons


@router.get(
    "/{media_id}/seasons/{season_number}",
    response_model=SeasonDetailDTO,
    summary="Get season detail with episodes",
)
async def get_season_detail(
    media_id: UUID,
    season_number: int,
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve full season information including its nested episode listings.
    """
    season = await MediaDetailService.get_season_detail(
        db=db, media_id=media_id, season_number=season_number
    )
    if not season:
        raise HTTPException(status_code=404, detail=f"Season {season_number} not found for this media item")
    return season


@router.get(
    "/{media_id}/seasons/{season_number}/episodes/{episode_number}",
    response_model=EpisodeDTO,
    summary="Get specific episode detail",
)
async def get_episode_detail(
    media_id: UUID,
    season_number: int,
    episode_number: int,
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve specific episode detail with runtime, still image, and overview.
    """
    episode = await MediaDetailService.get_episode_detail(
        db=db,
        media_id=media_id,
        season_number=season_number,
        episode_number=episode_number,
    )
    if not episode:
        raise HTTPException(
            status_code=404,
            detail=f"Episode S{season_number}E{episode_number} not found for this media item",
        )
    return episode


@router.get(
    "/{media_id}/playback-options",
    response_model=PlaybackOptionsResponseDTO,
    summary="Get video playback embed options",
)
async def get_playback_options(
    media_id: UUID,
    season: Optional[int] = Query(None, description="Optional season number for episodic content"),
    episode: Optional[int] = Query(None, description="Optional episode number for episodic content"),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve configured and allowlisted streaming embed sources for a media title or specific episode.
    """
    playback_options = await PlaybackService.resolve_playback(
        db=db,
        media_id=media_id,
        season_number=season,
        episode_number=episode,
    )
    if not playback_options:
        raise HTTPException(status_code=404, detail="Media item not found")
    return playback_options
