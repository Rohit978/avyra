from datetime import date
from typing import Generic, List, Optional, TypeVar
from uuid import UUID
from pydantic import BaseModel, ConfigDict
from backend.app.models.enums import MediaStatus, MediaType

T = TypeVar("T")


class MediaSummaryDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    original_title: Optional[str] = None
    media_type: MediaType
    status: MediaStatus
    overview: Optional[str] = None
    release_date: Optional[date] = None
    poster_url: Optional[str] = None
    backdrop_url: Optional[str] = None
    vote_average: float = 0.0
    vote_count: int = 0
    popularity: float = 0.0
    genres: List[str] = []


class SearchSuggestionDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    media_type: MediaType
    release_date: Optional[date] = None
    poster_url: Optional[str] = None
    vote_average: float = 0.0


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    page: int
    limit: int
    total: int
    total_pages: int
