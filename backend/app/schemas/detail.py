from datetime import date
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict
from backend.app.models.enums import MediaStatus, MediaType


class ExternalIDDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    provider: str
    external_id: str


class MediaTitleDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    title: str
    title_type: str = "alternate"
    language: Optional[str] = None
    is_primary: bool = False


class MediaDetailDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    original_title: Optional[str] = None
    overview: Optional[str] = None
    media_type: MediaType
    status: MediaStatus
    release_date: Optional[date] = None
    end_date: Optional[date] = None
    runtime: Optional[int] = None
    original_language: Optional[str] = None
    country_of_origin: Optional[str] = None
    is_adult: bool = False
    popularity: float = 0.0
    vote_average: float = 0.0
    vote_count: int = 0
    poster_url: Optional[str] = None
    backdrop_url: Optional[str] = None
    genres: List[str] = []
    titles: List[MediaTitleDTO] = []
    provenance: List[ExternalIDDTO] = []
    season_count: int = 0
    episode_count: int = 0


class CastMemberDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    person_id: UUID
    name: str
    original_name: Optional[str] = None
    character_name: Optional[str] = None
    profile_path: Optional[str] = None
    order: int = 0


class CrewMemberDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    person_id: UUID
    name: str
    original_name: Optional[str] = None
    department: Optional[str] = None
    job: Optional[str] = None
    profile_path: Optional[str] = None


class MediaCreditsDTO(BaseModel):
    cast: List[CastMemberDTO] = []
    crew: List[CrewMemberDTO] = []


class EpisodeDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    season_id: UUID
    media_id: UUID
    episode_number: int
    title: Optional[str] = None
    overview: Optional[str] = None
    still_path: Optional[str] = None
    air_date: Optional[date] = None
    runtime: Optional[int] = None


class SeasonSummaryDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    season_number: int
    title: Optional[str] = None
    overview: Optional[str] = None
    poster_path: Optional[str] = None
    air_date: Optional[date] = None
    episode_count: int = 0


class SeasonDetailDTO(SeasonSummaryDTO):
    episodes: List[EpisodeDTO] = []
