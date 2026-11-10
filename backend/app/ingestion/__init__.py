"""Metadata ingestion and synchronization package."""
from backend.app.ingestion.resolver import IdentityResolver
from backend.app.ingestion.pipeline import IngestionPipeline

__all__ = ["IdentityResolver", "IngestionPipeline"]
