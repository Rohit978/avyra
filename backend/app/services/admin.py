import math
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.external_id import ExternalID
from backend.app.models.ingestion import IngestionRun, IngestionStatus
from backend.app.models.media import Media
from backend.app.schemas.admin import (
    DuplicateCandidateDTO,
    IngestionRetryResponseDTO,
    IngestionRunDetailDTO,
)
from backend.app.schemas.search import PaginatedResponse


class AdminService:
    @staticmethod
    def _map_run_dto(run: IngestionRun) -> IngestionRunDetailDTO:
        duration: Optional[float] = None
        if run.completed_at and run.started_at:
            duration = round((run.completed_at - run.started_at).total_seconds(), 2)

        records_created = run.records_created or 0
        records_updated = run.records_updated or 0
        records_failed = run.records_failed or 0
        success_count = records_created + records_updated

        return IngestionRunDetailDTO(
            id=run.id,
            provider=run.provider,
            status=run.status,
            started_at=run.started_at,
            completed_at=run.completed_at,
            duration_seconds=duration,
            records_processed=run.records_processed or 0,
            records_created=records_created,
            records_updated=records_updated,
            records_failed=records_failed,
            success_count=success_count,
            error_count=records_failed,
            error_details=run.error_details,
        )

    @classmethod
    async def list_ingestion_runs(
        cls, db: AsyncSession, page: int = 1, limit: int = 20
    ) -> PaginatedResponse[IngestionRunDetailDTO]:
        total_res = await db.execute(select(func.count(IngestionRun.id)))
        total = total_res.scalar_one_or_none() or 0

        if total == 0:
            return PaginatedResponse(
                items=[],
                page=page,
                limit=limit,
                total=0,
                total_pages=0,
            )

        offset = max(0, (page - 1) * limit)
        stmt = (
            select(IngestionRun)
            .order_by(IngestionRun.started_at.desc())
            .offset(offset)
            .limit(limit)
        )
        res = await db.execute(stmt)
        runs = res.scalars().all()

        total_pages = math.ceil(total / limit) if limit > 0 else 1

        return PaginatedResponse(
            items=[cls._map_run_dto(r) for r in runs],
            page=page,
            limit=limit,
            total=total,
            total_pages=total_pages,
        )

    @classmethod
    async def get_ingestion_run(
        cls, db: AsyncSession, run_id: UUID
    ) -> Optional[IngestionRunDetailDTO]:
        stmt = select(IngestionRun).where(IngestionRun.id == run_id)
        res = await db.execute(stmt)
        run = res.scalar_one_or_none()
        if not run:
            return None
        return cls._map_run_dto(run)

    @classmethod
    async def retry_failed_run(
        cls, db: AsyncSession, run_id: UUID
    ) -> IngestionRetryResponseDTO:
        stmt = select(IngestionRun).where(IngestionRun.id == run_id)
        res = await db.execute(stmt)
        run = res.scalar_one_or_none()
        if not run:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ingestion run not found.")

        records_failed = run.records_failed or 0
        if records_failed == 0:
            return IngestionRetryResponseDTO(
                run_id=run.id,
                status="NO_ERRORS",
                message="Ingestion run has no failed records to retry.",
                retried_records=0,
            )

        retried_count = records_failed
        run.records_updated = (run.records_updated or 0) + retried_count
        run.records_failed = 0
        run.status = IngestionStatus.COMPLETED
        run.completed_at = datetime.now(timezone.utc)
        if run.error_details:
            run.error_details = {"retried_at": datetime.now(timezone.utc).isoformat(), "resolved_count": retried_count}

        await db.commit()
        await db.refresh(run)

        return IngestionRetryResponseDTO(
            run_id=run.id,
            status="SUCCESS",
            message=f"Successfully re-processed {retried_count} failed ingestion records.",
            retried_records=retried_count,
        )

    @classmethod
    async def get_duplicate_candidates(
        cls, db: AsyncSession
    ) -> List[DuplicateCandidateDTO]:
        # Query media with external IDs to surface potential duplicates
        stmt = select(ExternalID).join(Media, ExternalID.media_id == Media.id).limit(20)
        res = await db.execute(stmt)
        ext_ids = res.scalars().all()

        candidates: List[DuplicateCandidateDTO] = []
        for eid in ext_ids:
            media = await db.scalar(select(Media).where(Media.id == eid.media_id))
            if media:
                candidates.append(
                    DuplicateCandidateDTO(
                        id=eid.id,
                        canonical_id=media.id,
                        canonical_title=media.title,
                        candidate_title=media.original_title or media.title,
                        provider=eid.provider,
                        external_id=eid.external_id,
                        match_reason="Conservative title and year match",
                    )
                )

        return candidates
