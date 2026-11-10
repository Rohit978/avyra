from datetime import date
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from backend.app.models.enums import CreditType, MediaStatus, MediaType


class NormalizedTitleDTO(BaseModel):
    """Normalized title variant."""
    title: str
    title_type: str = "alternate"
    language: Optional[str] = None
    is_primary: bool = False


class NormalizedEpisodeDTO(BaseModel):
    """Normalized episode metadata."""
    episode_number: int
    title: Optional[str] = None
    overview: Optional[str] = None
    still_path: Optional[str] = None
    air_date: Optional[date] = None
    runtime: Optional[int] = None


class NormalizedSeasonDTO(BaseModel):
    """Normalized season metadata with episodes."""
    season_number: int
    title: Optional[str] = None
    overview: Optional[str] = None
    poster_path: Optional[str] = None
    air_date: Optional[date] = None
    episode_count: int = 0
    episodes: List[NormalizedEpisodeDTO] = Field(default_factory=list)


class NormalizedCreditDTO(BaseModel):
    """Normalized talent and crew credit."""
    person_name: str
    original_name: Optional[str] = None
    credit_type: CreditType
    character_name: Optional[str] = None
    department: Optional[str] = None
    job: Optional[str] = None
    order: int = 0
    profile_path: Optional[str] = None
    external_person_id: Optional[str] = None


class NormalizedMediaDTO(BaseModel):
    """Canonical data transfer object for unified media metadata."""
    provider: str
    external_id: str
    media_type: MediaType
    title: str
    original_title: Optional[str] = None
    overview: Optional[str] = None
    release_date: Optional[date] = None
    end_date: Optional[date] = None
    original_language: Optional[str] = None
    country_of_origin: Optional[str] = None
    runtime: Optional[int] = None
    is_adult: bool = False
    status: MediaStatus = MediaStatus.UNKNOWN
    popularity: float = 0.0
    vote_average: float = 0.0
    vote_count: int = 0
    poster_url: Optional[str] = None
    backdrop_url: Optional[str] = None
    genres: List[str] = Field(default_factory=list)
    titles: List[NormalizedTitleDTO] = Field(default_factory=list)
    seasons: List[NormalizedSeasonDTO] = Field(default_factory=list)
    credits: List[NormalizedCreditDTO] = Field(default_factory=list)
    raw_metadata: Dict[str, Any] = Field(default_factory=dict)
