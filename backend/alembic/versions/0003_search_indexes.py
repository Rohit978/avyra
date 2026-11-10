"""Add PostgreSQL pg_trgm and GIN search indexes.

Revision ID: 0003_search_indexes
Revises: 0002_ingestion_runs
Create Date: 2026-11-11 03:40:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0003_search_indexes"
down_revision: Union[str, None] = "0002_ingestion_runs"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        # 1. Enable pg_trgm extension
        op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm;")

        # 2. GIN trigram indexes for typo-tolerant string matching
        op.execute(
            "CREATE INDEX IF NOT EXISTS idx_media_title_trgm "
            "ON media USING gin (title gin_trgm_ops);"
        )
        op.execute(
            "CREATE INDEX IF NOT EXISTS idx_media_titles_title_trgm "
            "ON media_titles USING gin (title gin_trgm_ops);"
        )

        # 3. Full-text search GIN index on title + overview
        op.execute(
            "CREATE INDEX IF NOT EXISTS idx_media_fts "
            "ON media USING gin (to_tsvector('english', title || ' ' || COALESCE(overview, '')));"
        )


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("DROP INDEX IF EXISTS idx_media_fts;")
        op.execute("DROP INDEX IF EXISTS idx_media_titles_title_trgm;")
        op.execute("DROP INDEX IF EXISTS idx_media_title_trgm;")
