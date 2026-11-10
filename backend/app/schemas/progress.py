from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from backend.app.models.enums import ViewingStatus


class MediaProgressUpdateRequest(BaseModel):
    status: ViewingStatus
    rating: Optional[float] = Field(None, ge=0.0, le=10.0)


class MediaProgressResponseDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: UUID
    media_id: UUID
    status: ViewingStatus
    rating: Optional[float] = None
    updated_at: datetime


class EpisodeProgressUpdateRequest(BaseModel):
    is_watched: bool = True
    progress_seconds: int = Field(0, ge=0)


class EpisodeProgressResponseDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: UUID
    media_id: UUID
    episode_id: UUID
    is_watched: bool
    progress_seconds: int
    completed_at: Optional[datetime] = None
