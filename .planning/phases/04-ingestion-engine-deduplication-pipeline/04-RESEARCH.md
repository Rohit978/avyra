# Phase 4: Ingestion Engine & Deduplication Pipeline - Research

**Phase:** 04-ingestion-engine-deduplication-pipeline
**Researched:** 2026-11-11
**Confidence:** HIGH

## Technical Patterns for Ingestion

### 1. Ingestion Runs Entity
```python
class IngestionStatus(str, enum.Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    PARTIAL = "PARTIAL"

class IngestionRun(Base, TimestampMixin, UUIDPrimaryKeyMixin):
    __tablename__ = "ingestion_runs"
    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    job_type: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[IngestionStatus] = mapped_column(SQLEnum(IngestionStatus), default=IngestionStatus.PENDING)
    records_processed: Mapped[int] = mapped_column(Integer, default=0)
    records_created: Mapped[int] = mapped_column(Integer, default=0)
    records_updated: Mapped[int] = mapped_column(Integer, default=0)
    records_failed: Mapped[int] = mapped_column(Integer, default=0)
    error_details: Mapped[Dict[str, Any]] = mapped_column(JSONB, default=dict)
```

### 2. Idempotent Upsert Strategy
To ensure re-running the same feed never produces duplicate records or crashes with integrity errors:
1. Query `select(ExternalID).where(ExternalID.provider == dto.provider, ExternalID.external_id == dto.external_id)`
2. If exists:
   - Load `Media` by `ext_id.media_id`
   - Update mutable fields (popularity, vote_average, status, backdrop_url, poster_url)
   - Do NOT overwrite non-empty trusted fields with null values
3. If does not exist:
   - Create new `Media` instance
   - Flush to assign `media.id`
   - Create `ExternalID(media_id=media.id, provider=dto.provider, external_id=dto.external_id)`
4. For genres:
   - Ensure genre rows exist by name/slug, then link in `media.genres`
5. For titles:
   - Check if title already exists in `media.titles`, insert if new

### 3. Savepoints for Fault-Tolerant Batching
Use `async with session.begin_nested():` for each item. If one record raises an unhandled error, rollback the savepoint, increment `records_failed`, record error trace, and proceed to the next record without rolling back the entire run.

---
*Research for Phase 04 completed.*
