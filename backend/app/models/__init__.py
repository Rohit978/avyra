"""Database models package."""
from backend.app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from backend.app.models.enums import CreditType, MediaStatus, MediaType
from backend.app.models.genre import Genre, media_genres
from backend.app.models.media import Media
from backend.app.models.external_id import ExternalID
from backend.app.models.title import MediaTitle
from backend.app.models.season import Season
from backend.app.models.episode import Episode
from backend.app.models.person import Person
from backend.app.models.credit import Credit

__all__ = [
    "Base",
    "TimestampMixin",
    "UUIDPrimaryKeyMixin",
    "MediaType",
    "MediaStatus",
    "CreditType",
    "Genre",
    "media_genres",
    "Media",
    "ExternalID",
    "MediaTitle",
    "Season",
    "Episode",
    "Person",
    "Credit",
]
