import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Index, Integer, UniqueConstraint, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from backend.app.models.enums import ViewingStatus

if TYPE_CHECKING:
    from backend.app.models.user import User
    from backend.app.models.media import Media
    from backend.app.models.episode import Episode


class UserMediaProgress(Base, TimestampMixin, UUIDPrimaryKeyMixin):
    """Personal watch status and rating for a media title."""
    __tablename__ = "user_media_progress"
    __table_args__ = (
        UniqueConstraint("user_id", "media_id", name="uq_user_media_progress"),
        Index("ix_user_media_progress_user", "user_id"),
        Index("ix_user_media_progress_status", "user_id", "status"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    media_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("media.id", ondelete="CASCADE"),
        nullable=False,
    )
    status: Mapped[ViewingStatus] = mapped_column(
        SQLEnum(ViewingStatus, name="viewing_status_enum"),
        default=ViewingStatus.PLAN_TO_WATCH,
        nullable=False,
    )
    rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User")
    media: Mapped["Media"] = relationship("Media")


class UserEpisodeProgress(Base, TimestampMixin, UUIDPrimaryKeyMixin):
    """Watched status and playback position for an episode."""
    __tablename__ = "user_episode_progress"
    __table_args__ = (
        UniqueConstraint("user_id", "episode_id", name="uq_user_episode_progress"),
        Index("ix_user_episode_progress_media", "user_id", "media_id"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    media_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("media.id", ondelete="CASCADE"),
        nullable=False,
    )
    episode_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("episodes.id", ondelete="CASCADE"),
        nullable=False,
    )
    is_watched: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    progress_seconds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User")
    media: Mapped["Media"] = relationship("Media")
    episode: Mapped["Episode"] = relationship("Episode")
