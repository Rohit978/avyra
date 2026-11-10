from typing import List, Optional
from uuid import UUID
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.models.credit import Credit
from backend.app.models.enums import CreditType
from backend.app.models.episode import Episode
from backend.app.models.media import Media
from backend.app.models.person import Person
from backend.app.models.season import Season
from backend.app.schemas.detail import (
    CastMemberDTO,
    CrewMemberDTO,
    EpisodeDTO,
    ExternalIDDTO,
    MediaCreditsDTO,
    MediaDetailDTO,
    MediaTitleDTO,
    SeasonDetailDTO,
    SeasonSummaryDTO,
)


class MediaDetailService:
    @staticmethod
    async def get_media_detail(db: AsyncSession, media_id: UUID) -> Optional[MediaDetailDTO]:
        stmt = (
            select(Media)
            .options(
                selectinload(Media.genres),
                selectinload(Media.titles),
                selectinload(Media.external_ids),
                selectinload(Media.seasons).selectinload(Season.episodes),
            )
            .where(Media.id == media_id)
        )
        res = await db.execute(stmt)
        media = res.scalar_one_or_none()
        if not media:
            return None

        season_count = len(media.seasons) if media.seasons else 0
        total_episodes = sum(len(s.episodes) for s in media.seasons) if media.seasons else 0

        return MediaDetailDTO(
            id=media.id,
            title=media.title,
            original_title=media.original_title,
            overview=media.overview,
            media_type=media.media_type,
            status=media.status,
            release_date=media.release_date,
            end_date=media.end_date,
            runtime=media.runtime,
            original_language=media.original_language,
            country_of_origin=media.country_of_origin,
            is_adult=media.is_adult,
            popularity=media.popularity,
            vote_average=media.vote_average,
            vote_count=media.vote_count,
            poster_url=media.poster_url,
            backdrop_url=media.backdrop_url,
            genres=[g.name for g in media.genres] if media.genres else [],
            titles=[
                MediaTitleDTO(
                    title=t.title,
                    title_type=t.title_type,
                    language=t.language,
                    is_primary=t.is_primary,
                )
                for t in media.titles
            ]
            if media.titles
            else [],
            provenance=[
                ExternalIDDTO(
                    provider=eid.provider,
                    external_id=eid.external_id,
                )
                for eid in media.external_ids
            ]
            if media.external_ids
            else [],
            season_count=season_count,
            episode_count=total_episodes,
        )

    @staticmethod
    async def get_media_credits(db: AsyncSession, media_id: UUID) -> Optional[MediaCreditsDTO]:
        # Check media exists
        media_exists = await db.scalar(select(func.count(Media.id)).where(Media.id == media_id))
        if not media_exists:
            return None

        stmt = (
            select(Credit)
            .options(selectinload(Credit.person))
            .where(Credit.media_id == media_id)
            .order_by(Credit.order.asc(), Credit.created_at.asc())
        )
        res = await db.execute(stmt)
        credits = res.scalars().all()

        cast_list: List[CastMemberDTO] = []
        crew_list: List[CrewMemberDTO] = []

        for c in credits:
            person = c.person
            name = person.name if person else "Unknown"
            original_name = person.original_name if person else None
            profile_path = person.profile_path if person else None

            if c.credit_type == CreditType.CAST:
                cast_list.append(
                    CastMemberDTO(
                        id=c.id,
                        person_id=c.person_id,
                        name=name,
                        original_name=original_name,
                        character_name=c.character_name,
                        profile_path=profile_path,
                        order=c.order,
                    )
                )
            else:
                crew_list.append(
                    CrewMemberDTO(
                        id=c.id,
                        person_id=c.person_id,
                        name=name,
                        original_name=original_name,
                        department=c.department,
                        job=c.job,
                        profile_path=profile_path,
                    )
                )

        return MediaCreditsDTO(cast=cast_list, crew=crew_list)

    @staticmethod
    async def get_media_seasons(db: AsyncSession, media_id: UUID) -> Optional[List[SeasonSummaryDTO]]:
        media_exists = await db.scalar(select(func.count(Media.id)).where(Media.id == media_id))
        if not media_exists:
            return None

        stmt = (
            select(Season)
            .where(Season.media_id == media_id)
            .order_by(Season.season_number.asc())
        )
        res = await db.execute(stmt)
        seasons = res.scalars().all()

        return [
            SeasonSummaryDTO(
                id=s.id,
                season_number=s.season_number,
                title=s.title,
                overview=s.overview,
                poster_path=s.poster_path,
                air_date=s.air_date,
                episode_count=s.episode_count,
            )
            for s in seasons
        ]

    @staticmethod
    async def get_season_detail(
        db: AsyncSession,
        media_id: UUID,
        season_number: int,
    ) -> Optional[SeasonDetailDTO]:
        stmt = (
            select(Season)
            .options(selectinload(Season.episodes))
            .where(Season.media_id == media_id, Season.season_number == season_number)
        )
        res = await db.execute(stmt)
        season = res.scalar_one_or_none()
        if not season:
            return None

        episodes_dtos = [
            EpisodeDTO(
                id=ep.id,
                season_id=ep.season_id,
                media_id=ep.media_id,
                episode_number=ep.episode_number,
                title=ep.title,
                overview=ep.overview,
                still_path=ep.still_path,
                air_date=ep.air_date,
                runtime=ep.runtime,
            )
            for ep in (season.episodes or [])
        ]

        return SeasonDetailDTO(
            id=season.id,
            season_number=season.season_number,
            title=season.title,
            overview=season.overview,
            poster_path=season.poster_path,
            air_date=season.air_date,
            episode_count=season.episode_count or len(episodes_dtos),
            episodes=episodes_dtos,
        )

    @staticmethod
    async def get_episode_detail(
        db: AsyncSession,
        media_id: UUID,
        season_number: int,
        episode_number: int,
    ) -> Optional[EpisodeDTO]:
        stmt = (
            select(Episode)
            .join(Season, Episode.season_id == Season.id)
            .where(
                Episode.media_id == media_id,
                Season.season_number == season_number,
                Episode.episode_number == episode_number,
            )
        )
        res = await db.execute(stmt)
        ep = res.scalar_one_or_none()
        if not ep:
            return None

        return EpisodeDTO(
            id=ep.id,
            season_id=ep.season_id,
            media_id=ep.media_id,
            episode_number=ep.episode_number,
            title=ep.title,
            overview=ep.overview,
            still_path=ep.still_path,
            air_date=ep.air_date,
            runtime=ep.runtime,
        )
