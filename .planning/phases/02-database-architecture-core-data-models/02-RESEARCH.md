# Phase 2: Database Architecture & Core Data Models - Research

**Phase:** 02-database-architecture-core-data-models
**Researched:** 2026-11-11
**Confidence:** HIGH

## Overview

Phase 2 implements the relational backbone of Cineverse:
1. Canonical `media` table with UUID primary key, `MediaType` and `MediaStatus` enums.
2. `external_ids` table with composite unique constraint `(provider, external_id)`.
3. `media_titles` for multilingual titles and search disambiguation.
4. `genres` and `media_genres` many-to-many relationship.
5. Hierarchical `seasons` and `episodes` entities with ordering constraints.
6. `people` and `credits` (cast and crew) entities.
7. Alembic migration `0001_initial_schema.py` and model unit tests.

## Key Technical Patterns

### 1. PostgreSQL Enums in SQLAlchemy 2.0
```python
import enum
from sqlalchemy import Enum as SQLEnum

class MediaType(str, enum.Enum):
    MOVIE = "MOVIE"
    TV_SHOW = "TV_SHOW"
    ANIME = "ANIME"
    DOCUMENTARY = "DOCUMENTARY"
    SHORT_FILM = "SHORT_FILM"

class MediaStatus(str, enum.Enum):
    RELEASED = "RELEASED"
    UPCOMING = "UPCOMING"
    ONGOING = "ONGOING"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    UNKNOWN = "UNKNOWN"
```
Using string-backed enums (`str, enum.Enum`) ensures seamless serialization with Pydantic and JSON outputs.

### 2. Composite Unique Constraint on External IDs
```python
from sqlalchemy import UniqueConstraint, ForeignKey, String, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

class ExternalID(Base, TimestampMixin, UUIDPrimaryKeyMixin):
    __tablename__ = "external_ids"
    __table_args__ = (
        UniqueConstraint("provider", "external_id", name="uq_provider_external_id"),
        Index("ix_external_ids_media_provider", "media_id", "provider"),
    )
    media_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("media.id", ondelete="CASCADE"), nullable=False)
    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    external_id: Mapped[str] = mapped_column(String(100), nullable=False)
```

### 3. Relationships & Cascades
All child relations (`external_ids`, `media_titles`, `seasons`, `credits`, `media_genres`) have `ondelete="CASCADE"` and `cascade="all, delete-orphan"` so that deleting a media item cleanly cleans up child metadata without leaving orphans.

---
*Research for Phase 02 completed.*
