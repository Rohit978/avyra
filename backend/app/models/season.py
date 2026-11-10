import uuid
from datetime import date
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import Date, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from backend.app.models.media import Media
    from backend.app.models.episode import Episode


class Season(Base, TimestampMixin, UUIDPrimaryKeyMixin):
    """TV show or anime season entity."""
    __tablename__ = "seasons"
    __table_args__ = (
        UniqueConstraint("media_id", "season_number", name="uq_media_season_number"),
    )

    media_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("media.id", ondelete="CASCADE"),
        nullable=False,
    )
    season_number: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    overview: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    poster_path: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    air_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    episode_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    media: Mapped["Media"] = relationship("Media", back_populates="seasons")
    episodes: Mapped[List["Episode"]] = relationship(
        "Episode",
        back_populates="season",
        cascade="all, delete-orphan",
        order_by="Episode.episode_number",
    )
