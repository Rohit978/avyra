from datetime import date
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import Date, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from backend.app.models.credit import Credit


class Person(Base, TimestampMixin, UUIDPrimaryKeyMixin):
    """Actors, directors, writers, voice actors, and crew."""
    __tablename__ = "people"

    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    original_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    profile_path: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    biography: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    gender: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    birth_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    death_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    imdb_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)

    # Relationships
    credits: Mapped[List["Credit"]] = relationship(
        "Credit",
        back_populates="person",
        cascade="all, delete-orphan",
    )
