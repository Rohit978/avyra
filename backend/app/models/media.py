import uuid
from datetime import date
from typing import Any, Dict, List, Optional, TYPE_CHECKING
from sqlalchemy import Boolean, Date, Float, Integer, String, Text, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from backend.app.models.enums import MediaStatus, MediaType
from backend.app.models.genre import media_genres

if TYPE_CHECKING:
    from backend.app.models.external_id import ExternalID
    from backend.app.models.genre import Genre
    from backend.app.models.title import MediaTitle
    from backend.app.models.season import Season
    from backend.app.models.episode import Episode
    from backend.app.models.credit import Credit


class Media(Base, TimestampMixin, UUIDPrimaryKeyMixin):
    """Canonical provider-independent media entity."""
    __tablename__ = "media"

    media_type: Mapped[MediaType] = mapped_column(
        SQLEnum(MediaType, name="media_type_enum"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    original_title: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    overview: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    release_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True, index=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    original_language: Mapped[Optional[str]] = mapped_column(String(10), nullable=True, index=True)
    country_of_origin: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    runtime: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_adult: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    status: Mapped[MediaStatus] = mapped_column(
        SQLEnum(MediaStatus, name="media_status_enum"),
        default=MediaStatus.UNKNOWN,
        nullable=False,
        index=True,
    )
    popularity: Mapped[float] = mapped_column(Float, default=0.0, nullable=False, index=True)
    vote_average: Mapped[float] = mapped_column(Float, default=0.0, nullable=False, index=True)
    vote_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    poster_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    backdrop_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    raw_metadata: Mapped[Dict[str, Any]] = mapped_column(JSONB, default=dict, nullable=False)

    # Relationships
    external_ids: Mapped[List["ExternalID"]] = relationship(
        "ExternalID",
        back_populates="media",
        cascade="all, delete-orphan",
    )
    genres: Mapped[List["Genre"]] = relationship(
        "Genre",
        secondary=media_genres,
        back_populates="media",
    )
    titles: Mapped[List["MediaTitle"]] = relationship(
        "MediaTitle",
        back_populates="media",
        cascade="all, delete-orphan",
    )
    seasons: Mapped[List["Season"]] = relationship(
        "Season",
        back_populates="media",
        cascade="all, delete-orphan",
        order_by="Season.season_number",
    )
    episodes: Mapped[List["Episode"]] = relationship(
        "Episode",
        back_populates="media",
        cascade="all, delete-orphan",
    )
    credits: Mapped[List["Credit"]] = relationship(
        "Credit",
        back_populates="media",
        cascade="all, delete-orphan",
    )
