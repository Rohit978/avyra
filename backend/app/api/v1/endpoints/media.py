from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_db
from backend.app.models.enums import MediaStatus, MediaType
from backend.app.schemas.search import MediaSummaryDTO, PaginatedResponse
from backend.app.services.discovery import DiscoveryService

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
