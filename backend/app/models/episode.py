import uuid
from datetime import date
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Date, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from backend.app.models.media import Media
    from backend.app.models.season import Season


class Episode(Base, TimestampMixin, UUIDPrimaryKeyMixin):
    """TV or anime episode entity."""
    __tablename__ = "episodes"
    __table_args__ = (
        UniqueConstraint("season_id", "episode_number", name="uq_season_episode_number"),
    )

    season_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("seasons.id", ondelete="CASCADE"),
        nullable=False,
    )
    media_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("media.id", ondelete="CASCADE"),
        nullable=False,
    )
    episode_number: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    overview: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    still_path: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    air_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    runtime: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Relationships
    season: Mapped["Season"] = relationship("Season", back_populates="episodes")
    media: Mapped["Media"] = relationship("Media", back_populates="episodes")
