from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_db
from backend.app.core.deps import require_admin
from backend.app.models.user import User
from backend.app.schemas.admin import (
    DuplicateCandidateDTO,
    IngestionRetryResponseDTO,
    IngestionRunDetailDTO,
)
from backend.app.schemas.search import PaginatedResponse
from backend.app.services.admin import AdminService

router = APIRouter()


@router.get(
    "/ingestion/runs",
    response_model=PaginatedResponse[IngestionRunDetailDTO],
    summary="List ingestion run history",
)
async def list_ingestion_runs(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin dashboard endpoint to inspect historical ingestion runs, metrics, and durations."""
    return await AdminService.list_ingestion_runs(db, page=page, limit=limit)


@router.get(
    "/ingestion/runs/{run_id}",
    response_model=IngestionRunDetailDTO,
    summary="Get ingestion run details",
)
async def get_ingestion_run(
    run_id: UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve full execution metadata and error details for a specific ingestion run."""
    run = await AdminService.get_ingestion_run(db, run_id=run_id)
    if not run:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ingestion run not found.")
    return run


@router.post(
    "/ingestion/runs/{run_id}/retry",
    response_model=IngestionRetryResponseDTO,
    summary="Retry failed records from an ingestion run",
)
async def retry_failed_run(
    run_id: UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Safely trigger retry execution for failed records in a previous ingestion run."""
    return await AdminService.retry_failed_run(db, run_id=run_id)


@router.get(
    "/ingestion/duplicates",
    response_model=List[DuplicateCandidateDTO],
    summary="Review flagged duplicate candidate pairs",
)
async def get_duplicate_candidates(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Review duplicate candidate pairs flagged by conservative identity resolution."""
    return await AdminService.get_duplicate_candidates(db)
