import enum


class MediaType(str, enum.Enum):
    """Supported canonical media types."""
    MOVIE = "MOVIE"
    TV_SHOW = "TV_SHOW"
    ANIME = "ANIME"
    DOCUMENTARY = "DOCUMENTARY"
    SHORT_FILM = "SHORT_FILM"


class MediaStatus(str, enum.Enum):
    """Release status for media items."""
    RELEASED = "RELEASED"
    UPCOMING = "UPCOMING"
    ONGOING = "ONGOING"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    UNKNOWN = "UNKNOWN"


class CreditType(str, enum.Enum):
    """Type of talent participation in a title."""
    CAST = "CAST"
    CREW = "CREW"
