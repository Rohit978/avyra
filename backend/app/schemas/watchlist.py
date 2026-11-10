from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from backend.app.schemas.search import MediaSummaryDTO


class WatchlistCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)
    is_default: bool = False


class WatchlistUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)
    is_default: Optional[bool] = None


class WatchlistItemAddRequest(BaseModel):
    media_id: UUID


class WatchlistItemResponseDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    watchlist_id: UUID
    media_id: UUID
    media: Optional[MediaSummaryDTO] = None
    created_at: datetime


class WatchlistResponseDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    name: str
    description: Optional[str] = None
    is_default: bool = False
    item_count: int = 0
    created_at: datetime


class WatchlistDetailResponseDTO(WatchlistResponseDTO):
    items: List[WatchlistItemResponseDTO] = []
