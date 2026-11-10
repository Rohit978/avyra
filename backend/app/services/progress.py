from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.episode import Episode
from backend.app.models.media import Media
from backend.app.models.progress import UserEpisodeProgress, UserMediaProgress
from backend.app.schemas.progress import (
    EpisodeProgressResponseDTO,
    EpisodeProgressUpdateRequest,
    MediaProgressResponseDTO,
    MediaProgressUpdateRequest,
)


class ProgressService:
    @staticmethod
    async def get_media_progress(
        db: AsyncSession, user_id: UUID, media_id: UUID
    ) -> Optional[MediaProgressResponseDTO]:
        stmt = select(UserMediaProgress).where(
            UserMediaProgress.user_id == user_id,
            UserMediaProgress.media_id == media_id,
        )
        res = await db.execute(stmt)
        record = res.scalar_one_or_none()
        if not record:
            return None

        return MediaProgressResponseDTO(
            user_id=record.user_id,
            media_id=record.media_id,
            status=record.status,
            rating=record.rating,
            updated_at=record.updated_at,
        )

    @staticmethod
    async def set_media_progress(
        db: AsyncSession,
        user_id: UUID,
        media_id: UUID,
        req: MediaProgressUpdateRequest,
    ) -> MediaProgressResponseDTO:
        # Check media exists
        media = await db.scalar(select(Media).where(Media.id == media_id))
        if not media:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media not found.")

        stmt = select(UserMediaProgress).where(
            UserMediaProgress.user_id == user_id,
            UserMediaProgress.media_id == media_id,
        )
        res = await db.execute(stmt)
        record = res.scalar_one_or_none()

        if not record:
            record = UserMediaProgress(
                user_id=user_id,
                media_id=media_id,
                status=req.status,
                rating=req.rating,
            )
            db.add(record)
        else:
            record.status = req.status
            if req.rating is not None:
                record.rating = req.rating

        await db.commit()
        await db.refresh(record)

        return MediaProgressResponseDTO(
            user_id=record.user_id,
            media_id=record.media_id,
            status=record.status,
            rating=record.rating,
            updated_at=record.updated_at,
        )

    @staticmethod
    async def get_media_episodes_progress(
        db: AsyncSession, user_id: UUID, media_id: UUID
    ) -> List[EpisodeProgressResponseDTO]:
        stmt = select(UserEpisodeProgress).where(
            UserEpisodeProgress.user_id == user_id,
            UserEpisodeProgress.media_id == media_id,
        )
        res = await db.execute(stmt)
        records = res.scalars().all()

        return [
            EpisodeProgressResponseDTO(
                user_id=r.user_id,
                media_id=r.media_id,
                episode_id=r.episode_id,
                is_watched=r.is_watched,
                progress_seconds=r.progress_seconds,
                completed_at=r.completed_at,
            )
            for r in records
        ]

    @staticmethod
    async def set_episode_progress(
        db: AsyncSession,
        user_id: UUID,
        episode_id: UUID,
        req: EpisodeProgressUpdateRequest,
    ) -> EpisodeProgressResponseDTO:
        # Check episode exists
        ep = await db.scalar(select(Episode).where(Episode.id == episode_id))
        if not ep:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Episode not found.")

        stmt = select(UserEpisodeProgress).where(
            UserEpisodeProgress.user_id == user_id,
            UserEpisodeProgress.episode_id == episode_id,
        )
        res = await db.execute(stmt)
        record = res.scalar_one_or_none()

        completed_time = datetime.now(timezone.utc) if req.is_watched else None

        if not record:
            record = UserEpisodeProgress(
                user_id=user_id,
                media_id=ep.media_id,
                episode_id=episode_id,
                is_watched=req.is_watched,
                progress_seconds=req.progress_seconds,
                completed_at=completed_time,
            )
            db.add(record)
        else:
            record.is_watched = req.is_watched
            record.progress_seconds = req.progress_seconds
            if req.is_watched and not record.completed_at:
                record.completed_at = completed_time
            elif not req.is_watched:
                record.completed_at = None

        await db.commit()
        await db.refresh(record)

        return EpisodeProgressResponseDTO(
            user_id=record.user_id,
            media_id=record.media_id,
            episode_id=record.episode_id,
            is_watched=record.is_watched,
            progress_seconds=record.progress_seconds,
            completed_at=record.completed_at,
        )
