"""Add ingestion_runs table for tracking sync metrics and errors.

Revision ID: 0002_ingestion_runs
Revises: 0001_initial_core_schema
Create Date: 2026-11-11 03:32:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0002_ingestion_runs"
down_revision: Union[str, None] = "0001_initial_core_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    ingestion_status_enum = sa.Enum(
        "PENDING", "RUNNING", "COMPLETED", "FAILED", "PARTIAL",
        name="ingestion_status_enum"
    )

    op.create_table(
        "ingestion_runs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("provider", sa.String(length=50), nullable=False),
        sa.Column("job_type", sa.String(length=50), nullable=False),
        sa.Column("status", ingestion_status_enum, server_default="PENDING", nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("records_processed", sa.Integer(), server_default="0", nullable=False),
        sa.Column("records_created", sa.Integer(), server_default="0", nullable=False),
        sa.Column("records_updated", sa.Integer(), server_default="0", nullable=False),
        sa.Column("records_failed", sa.Integer(), server_default="0", nullable=False),
        sa.Column("error_message", sa.String(length=1000), nullable=True),
        sa.Column("error_details", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_ingestion_runs_provider", "ingestion_runs", ["provider"])
    op.create_index("ix_ingestion_runs_status", "ingestion_runs", ["status"])


def downgrade() -> None:
    op.drop_table("ingestion_runs")
    op.execute("DROP TYPE IF EXISTS ingestion_status_enum;")
