import uuid
from typing import TYPE_CHECKING
from sqlalchemy import ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from backend.app.models.media import Media


class ExternalID(Base, TimestampMixin, UUIDPrimaryKeyMixin):
    """External provider identifier mapped to canonical media."""
    __tablename__ = "external_ids"
    __table_args__ = (
        UniqueConstraint("provider", "external_id", name="uq_provider_external_id"),
        Index("ix_external_ids_media_provider", "media_id", "provider"),
    )

    media_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("media.id", ondelete="CASCADE"),
        nullable=False,
    )
    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    external_id: Mapped[str] = mapped_column(String(100), nullable=False)

    # Relationship
    media: Mapped["Media"] = relationship("Media", back_populates="external_ids")
