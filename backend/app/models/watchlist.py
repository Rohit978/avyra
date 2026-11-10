import uuid
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import Boolean, ForeignKey, Index, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from backend.app.models.user import User
    from backend.app.models.media import Media


class Watchlist(Base, TimestampMixin, UUIDPrimaryKeyMixin):
    """User-created custom media watchlist."""
    __tablename__ = "watchlists"
    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_user_watchlist_name"),
        Index("ix_watchlists_user_id", "user_id"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User")
    items: Mapped[List["WatchlistItem"]] = relationship(
        "WatchlistItem",
        back_populates="watchlist",
        cascade="all, delete-orphan",
        order_by="WatchlistItem.created_at.desc()",
    )


class WatchlistItem(Base, TimestampMixin, UUIDPrimaryKeyMixin):
    """Media entry within a user's watchlist."""
    __tablename__ = "watchlist_items"
    __table_args__ = (
        UniqueConstraint("watchlist_id", "media_id", name="uq_watchlist_media"),
        Index("ix_watchlist_items_media", "media_id"),
    )

    watchlist_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("watchlists.id", ondelete="CASCADE"),
        nullable=False,
    )
    media_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("media.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Relationships
    watchlist: Mapped["Watchlist"] = relationship("Watchlist", back_populates="items")
    media: Mapped["Media"] = relationship("Media")
