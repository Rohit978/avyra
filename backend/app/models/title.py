import uuid
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Boolean, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from backend.app.models.media import Media


class MediaTitle(Base, TimestampMixin, UUIDPrimaryKeyMixin):
    """Localized, alternate, and original title variants."""
    __tablename__ = "media_titles"
    __table_args__ = (
        Index("ix_media_titles_title", "title"),
        Index("ix_media_titles_media_lang", "media_id", "language"),
    )

    media_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("media.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    title_type: Mapped[str] = mapped_column(String(50), default="alternate", nullable=False)
    language: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationship
    media: Mapped["Media"] = relationship("Media", back_populates="titles")
