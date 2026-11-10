from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_db
from backend.app.models.enums import MediaType
from backend.app.schemas.search import MediaSummaryDTO, PaginatedResponse, SearchSuggestionDTO
from backend.app.services.search import SearchService

router = APIRouter()


@router.get("", response_model=PaginatedResponse[MediaSummaryDTO], summary="Search media catalogue")
async def search_media(
    q: str = Query(..., min_length=1, max_length=200, description="Search keyword or title"),
    media_type: Optional[MediaType] = Query(None, description="Optional media type filter"),
    genre: Optional[str] = Query(None, description="Optional genre name or slug filter"),
    year: Optional[int] = Query(None, ge=1880, le=2100, description="Optional release year filter"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
):
    """
    Search media catalogue with typo tolerance, alternate titles, and ranked relevance.
    """
    return await SearchService.search_media(
        db=db,
        query=q,
        media_type=media_type,
        genre=genre,
        year=year,
        page=page,
        limit=limit,
    )


@router.get(
    "/suggestions",
    response_model=List[SearchSuggestionDTO],
    summary="Debounced autocomplete suggestions",
)
async def search_suggestions(
    q: str = Query(..., min_length=1, max_length=100, description="Autocomplete prefix or partial keyword"),
    limit: int = Query(8, ge=1, le=20, description="Max suggestions to return"),
    db: AsyncSession = Depends(get_db),
):
    """
    Fast debounced autocomplete endpoint returning compact media summaries for instant search popovers.
    """
    return await SearchService.get_search_suggestions(
        db=db,
        query=q,
        limit=limit,
    )
