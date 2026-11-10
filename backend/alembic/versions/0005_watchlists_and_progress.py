"""Add watchlists, watchlist_items, user_media_progress, and user_episode_progress.

Revision ID: 0005_watchlists_and_progress
Revises: 0004_user_authentication
Create Date: 2026-11-11 03:55:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0005_watchlists_and_progress"
down_revision: Union[str, None] = "0004_user_authentication"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    viewing_status_enum = sa.Enum(
        "PLAN_TO_WATCH", "WATCHING", "COMPLETED", "DROPPED",
        name="viewing_status_enum"
    )

    # 1. Watchlists
    op.create_table(
        "watchlists",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_default", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.UniqueConstraint("user_id", "name", name="uq_user_watchlist_name"),
    )
    op.create_index("ix_watchlists_user_id", "watchlists", ["user_id"])

    # 2. Watchlist Items
    op.create_table(
        "watchlist_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("watchlist_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("watchlists.id", ondelete="CASCADE"), nullable=False),
        sa.Column("media_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("media.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.UniqueConstraint("watchlist_id", "media_id", name="uq_watchlist_media"),
    )
    op.create_index("ix_watchlist_items_media", "watchlist_items", ["media_id"])

    # 3. User Media Progress
    op.create_table(
        "user_media_progress",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("media_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("media.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", viewing_status_enum, server_default="PLAN_TO_WATCH", nullable=False),
        sa.Column("rating", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.UniqueConstraint("user_id", "media_id", name="uq_user_media_progress"),
    )
    op.create_index("ix_user_media_progress_user", "user_media_progress", ["user_id"])
    op.create_index("ix_user_media_progress_status", "user_media_progress", ["user_id", "status"])

    # 4. User Episode Progress
    op.create_table(
        "user_episode_progress",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("media_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("media.id", ondelete="CASCADE"), nullable=False),
        sa.Column("episode_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("episodes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("is_watched", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("progress_seconds", sa.Integer(), server_default="0", nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.UniqueConstraint("user_id", "episode_id", name="uq_user_episode_progress"),
    )
    op.create_index("ix_user_episode_progress_media", "user_episode_progress", ["user_id", "media_id"])


def downgrade() -> None:
    op.drop_table("user_episode_progress")
    op.drop_table("user_media_progress")
    op.drop_table("watchlist_items")
    op.drop_table("watchlists")
    op.execute("DROP TYPE IF EXISTS viewing_status_enum;")
