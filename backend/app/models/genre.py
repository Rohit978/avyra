import uuid
from typing import List, TYPE_CHECKING
from sqlalchemy import Column, ForeignKey, Integer, String, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base

if TYPE_CHECKING:
    from backend.app.models.media import Media

# Association table for Media and Genre
media_genres = Table(
    "media_genres",
    Base.metadata,
    Column("media_id", UUID(as_uuid=True), ForeignKey("media.id", ondelete="CASCADE"), primary_key=True),
    Column("genre_id", Integer, ForeignKey("genres.id", ondelete="CASCADE"), primary_key=True),
)


class Genre(Base):
    """Media genre entity (e.g. Action, Comedy, Cyberpunk)."""
    __tablename__ = "genres"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)

    # Relationship back to Media
    media: Mapped[List["Media"]] = relationship(
        "Media",
        secondary=media_genres,
        back_populates="genres",
    )
