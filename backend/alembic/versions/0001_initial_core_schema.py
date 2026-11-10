"""Initial core schema for media, external IDs, titles, genres, seasons, episodes, and credits.

Revision ID: 0001_initial_core_schema
Revises: 
Create Date: 2026-11-11 03:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0001_initial_core_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Media type and status enums
    media_type_enum = sa.Enum(
        "MOVIE", "TV_SHOW", "ANIME", "DOCUMENTARY", "SHORT_FILM",
        name="media_type_enum"
    )
    media_status_enum = sa.Enum(
        "RELEASED", "UPCOMING", "ONGOING", "COMPLETED", "CANCELLED", "UNKNOWN",
        name="media_status_enum"
    )
    credit_type_enum = sa.Enum(
        "CAST", "CREW",
        name="credit_type_enum"
    )

    # 2. Media table
    op.create_table(
        "media",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("media_type", media_type_enum, nullable=False),
        sa.Column("title", sa.String(length=500), nullable=False),
        sa.Column("original_title", sa.String(length=500), nullable=True),
        sa.Column("overview", sa.Text(), nullable=True),
        sa.Column("release_date", sa.Date(), nullable=True),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("original_language", sa.String(length=10), nullable=True),
        sa.Column("country_of_origin", sa.String(length=10), nullable=True),
        sa.Column("runtime", sa.Integer(), nullable=True),
        sa.Column("is_adult", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("status", media_status_enum, server_default="UNKNOWN", nullable=False),
        sa.Column("popularity", sa.Float(), server_default="0.0", nullable=False),
        sa.Column("vote_average", sa.Float(), server_default="0.0", nullable=False),
        sa.Column("vote_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("poster_url", sa.String(length=1000), nullable=True),
        sa.Column("backdrop_url", sa.String(length=1000), nullable=True),
        sa.Column("raw_metadata", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_index("ix_media_media_type", "media", ["media_type"])
    op.create_index("ix_media_title", "media", ["title"])
    op.create_index("ix_media_release_date", "media", ["release_date"])
    op.create_index("ix_media_popularity", "media", ["popularity"])
    op.create_index("ix_media_vote_average", "media", ["vote_average"])
    op.create_index("ix_media_status", "media", ["status"])

    # 3. External IDs table
    op.create_table(
        "external_ids",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("media_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("media.id", ondelete="CASCADE"), nullable=False),
        sa.Column("provider", sa.String(length=50), nullable=False),
        sa.Column("external_id", sa.String(length=100), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("provider", "external_id", name="uq_provider_external_id"),
    )
    op.create_index("ix_external_ids_media_provider", "external_ids", ["media_id", "provider"])

    # 4. Media Titles table
    op.create_table(
        "media_titles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("media_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("media.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(length=500), nullable=False),
        sa.Column("title_type", sa.String(length=50), server_default="alternate", nullable=False),
        sa.Column("language", sa.String(length=10), nullable=True),
        sa.Column("is_primary", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_media_titles_title", "media_titles", ["title"])
    op.create_index("ix_media_titles_media_lang", "media_titles", ["media_id", "language"])

    # 5. Genres table
    op.create_table(
        "genres",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(length=100), unique=True, nullable=False),
        sa.Column("slug", sa.String(length=100), unique=True, nullable=False),
    )
    op.create_index("ix_genres_name", "genres", ["name"])
    op.create_index("ix_genres_slug", "genres", ["slug"])

    # 6. Media Genres association table
    op.create_table(
        "media_genres",
        sa.Column("media_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("media.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("genre_id", sa.Integer(), sa.ForeignKey("genres.id", ondelete="CASCADE"), primary_key=True),
    )

    # 7. Seasons table
    op.create_table(
        "seasons",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("media_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("media.id", ondelete="CASCADE"), nullable=False),
        sa.Column("season_number", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=True),
        sa.Column("overview", sa.Text(), nullable=True),
        sa.Column("poster_path", sa.String(length=1000), nullable=True),
        sa.Column("air_date", sa.Date(), nullable=True),
        sa.Column("episode_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("media_id", "season_number", name="uq_media_season_number"),
    )

    # 8. Episodes table
    op.create_table(
        "episodes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("season_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("seasons.id", ondelete="CASCADE"), nullable=False),
        sa.Column("media_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("media.id", ondelete="CASCADE"), nullable=False),
        sa.Column("episode_number", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=500), nullable=True),
        sa.Column("overview", sa.Text(), nullable=True),
        sa.Column("still_path", sa.String(length=1000), nullable=True),
        sa.Column("air_date", sa.Date(), nullable=True),
        sa.Column("runtime", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("season_id", "episode_number", name="uq_season_episode_number"),
    )

    # 9. People table
    op.create_table(
        "people",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("original_name", sa.String(length=255), nullable=True),
        sa.Column("profile_path", sa.String(length=1000), nullable=True),
        sa.Column("biography", sa.Text(), nullable=True),
        sa.Column("gender", sa.Integer(), nullable=True),
        sa.Column("birth_date", sa.Date(), nullable=True),
        sa.Column("death_date", sa.Date(), nullable=True),
        sa.Column("imdb_id", sa.String(length=50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_people_name", "people", ["name"])
    op.create_index("ix_people_imdb_id", "people", ["imdb_id"])

    # 10. Credits table
    op.create_table(
        "credits",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("media_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("media.id", ondelete="CASCADE"), nullable=False),
        sa.Column("person_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("people.id", ondelete="CASCADE"), nullable=False),
        sa.Column("credit_type", credit_type_enum, nullable=False),
        sa.Column("character_name", sa.String(length=255), nullable=True),
        sa.Column("department", sa.String(length=100), nullable=True),
        sa.Column("job", sa.String(length=100), nullable=True),
        sa.Column("order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_credits_media_type", "credits", ["media_id", "credit_type"])
    op.create_index("ix_credits_person", "credits", ["person_id"])


def downgrade() -> None:
    op.drop_table("credits")
    op.drop_table("people")
    op.drop_table("episodes")
    op.drop_table("seasons")
    op.drop_table("media_genres")
    op.drop_table("genres")
    op.drop_table("media_titles")
    op.drop_table("external_ids")
    op.drop_table("media")

    op.execute("DROP TYPE IF EXISTS credit_type_enum;")
    op.execute("DROP TYPE IF EXISTS media_status_enum;")
    op.execute("DROP TYPE IF EXISTS media_type_enum;")
