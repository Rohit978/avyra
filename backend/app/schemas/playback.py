from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict
from backend.app.models.enums import MediaType


class EmbedSourceDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    embed_url: str
    domain: str
    is_primary: bool = False


class PlaybackOptionsResponseDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    media_id: UUID
    media_type: MediaType
    title: str
    has_stream: bool
    tmdb_id: Optional[str] = None
    season_number: Optional[int] = None
    episode_number: Optional[int] = None
    embed_sources: List[EmbedSourceDTO] = []
    sandbox_policy: str = "allow-scripts allow-same-origin allow-forms allow-presentation"
    referrer_policy: str = "no-referrer"
    reason: Optional[str] = None
