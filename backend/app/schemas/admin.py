from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict
from backend.app.models.ingestion import IngestionStatus


class IngestionRunDetailDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    provider: str
    status: IngestionStatus
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None
    records_processed: int
    records_created: int = 0
    records_updated: int = 0
    records_failed: int = 0
    success_count: int = 0
    error_count: int = 0
    error_details: Optional[Dict[str, Any]] = None


class IngestionRetryResponseDTO(BaseModel):
    run_id: UUID
    status: str
    message: str
    retried_records: int


class DuplicateCandidateDTO(BaseModel):
    id: UUID
    canonical_id: UUID
    canonical_title: str
    candidate_title: str
    provider: str
    external_id: str
    match_reason: str
