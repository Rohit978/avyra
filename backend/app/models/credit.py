import uuid
from typing import Optional, TYPE_CHECKING
from sqlalchemy import ForeignKey, Index, Integer, String, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from backend.app.models.enums import CreditType

if TYPE_CHECKING:
    from backend.app.models.media import Media
    from backend.app.models.person import Person


class Credit(Base, TimestampMixin, UUIDPrimaryKeyMixin):
    """Credit linking a Person to a Media item with cast or crew role."""
    __tablename__ = "credits"
    __table_args__ = (
        Index("ix_credits_media_type", "media_id", "credit_type"),
        Index("ix_credits_person", "person_id"),
    )

    media_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("media.id", ondelete="CASCADE"),
        nullable=False,
    )
    person_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("people.id", ondelete="CASCADE"),
        nullable=False,
    )
    credit_type: Mapped[CreditType] = mapped_column(
        SQLEnum(CreditType, name="credit_type_enum"),
        nullable=False,
    )
    character_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    job: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    media: Mapped["Media"] = relationship("Media", back_populates="credits")
    person: Mapped["Person"] = relationship("Person", back_populates="credits")
