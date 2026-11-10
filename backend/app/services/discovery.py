import math
from datetime import date
from typing import List, Optional
from sqlalchemy import distinct, extract, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.models.enums import MediaStatus, MediaType
from backend.app.models.genre import Genre
from backend.app.models.media import Media
from backend.app.schemas.search import MediaSummaryDTO, PaginatedResponse


class DiscoveryService:
    @staticmethod
    def _build_dto_list(media_items: List[Media]) -> List[MediaSummaryDTO]:
        return [
            MediaSummaryDTO(
                id=item.id,
                title=item.title,
                original_title=item.original_title,
                media_type=item.media_type,
                status=item.status,
                overview=item.overview,
                release_date=item.release_date,
                poster_url=item.poster_url,
                backdrop_url=item.backdrop_url,
                vote_average=item.vote_average,
                vote_count=item.vote_count,
                popularity=item.popularity,
                genres=[g.name for g in item.genres] if item.genres else [],
            )
            for item in media_items
        ]

    @classmethod
    async def browse_catalogue(
        cls,
        db: AsyncSession,
        media_type: Optional[MediaType] = None,
        genre: Optional[str] = None,
        year: Optional[int] = None,
        status: Optional[MediaStatus] = None,
        sort_by: str = "popularity",
        sort_order: str = "desc",
        page: int = 1,
        limit: int = 20,
    ) -> PaginatedResponse[MediaSummaryDTO]:
        stmt = select(Media).options(selectinload(Media.genres))
        count_stmt = select(func.count(distinct(Media.id))).select_from(Media)

        # Filters
        if media_type:
            stmt = stmt.where(Media.media_type == media_type)
            count_stmt = count_stmt.where(Media.media_type == media_type)

        if status:
            stmt = stmt.where(Media.status == status)
            count_stmt = count_stmt.where(Media.status == status)

        if year:
            stmt = stmt.where(extract("year", Media.release_date) == year)
            count_stmt = count_stmt.where(extract("year", Media.release_date) == year)

        if genre:
            stmt = stmt.join(Media.genres).where(
                or_(
                    func.lower(Genre.name) == genre.lower(),
                    Genre.slug == genre.lower(),
                )
            )
            count_stmt = count_stmt.join(Media.genres).where(
                or_(
                    func.lower(Genre.name) == genre.lower(),
                    Genre.slug == genre.lower(),
                )
            )

        # Total count
        total_res = await db.execute(count_stmt)
        total = total_res.scalar_one_or_none() or 0

        if total == 0:
            return PaginatedResponse(
                items=[],
                page=page,
                limit=limit,
                total=0,
                total_pages=0,
            )

        # Sorting
        sort_col = getattr(Media, sort_by, Media.popularity)
        if sort_order.lower() == "asc":
            stmt = stmt.order_by(sort_col.asc(), Media.id.asc())
        else:
            stmt = stmt.order_by(sort_col.desc(), Media.id.desc())

        offset = max(0, (page - 1) * limit)
        stmt = stmt.offset(offset).limit(limit)

        results = await db.execute(stmt)
        items = results.scalars().all()

        total_pages = math.ceil(total / limit) if limit > 0 else 1

        return PaginatedResponse(
            items=cls._build_dto_list(items),
            page=page,
            limit=limit,
            total=total,
            total_pages=total_pages,
        )

    @classmethod
    async def get_curated_collection(
        cls,
        db: AsyncSession,
        collection: str,
        media_type: Optional[MediaType] = None,
        page: int = 1,
        limit: int = 20,
    ) -> PaginatedResponse[MediaSummaryDTO]:
        stmt = select(Media).options(selectinload(Media.genres))
        count_stmt = select(func.count(distinct(Media.id))).select_from(Media)

        if media_type:
            stmt = stmt.where(Media.media_type == media_type)
            count_stmt = count_stmt.where(Media.media_type == media_type)

        collection = collection.lower().replace("_", "-")

        if collection == "trending":
            stmt = stmt.order_by(Media.popularity.desc(), Media.vote_count.desc())
        elif collection == "popular":
            stmt = stmt.order_by(Media.popularity.desc(), Media.vote_average.desc())
        elif collection == "top-rated":
            # For quality scoring, prioritize higher vote averages with non-zero votes
            stmt = stmt.where(Media.vote_count > 0).order_by(
                Media.vote_average.desc(), Media.vote_count.desc()
            )
            count_stmt = count_stmt.where(Media.vote_count > 0)
        elif collection == "upcoming":
            today = date.today()
            stmt = stmt.where(
                or_(
                    Media.release_date > today,
                    Media.status == MediaStatus.UPCOMING,
                )
            ).order_by(Media.release_date.asc().nulls_last())
            count_stmt = count_stmt.where(
                or_(
                    Media.release_date > today,
                    Media.status == MediaStatus.UPCOMING,
                )
            )
        else:
            # Fallback to popularity
            stmt = stmt.order_by(Media.popularity.desc())

        # Total count
        total_res = await db.execute(count_stmt)
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
        stmt = stmt.offset(offset).limit(limit)

        results = await db.execute(stmt)
        items = results.scalars().all()

        total_pages = math.ceil(total / limit) if limit > 0 else 1

        return PaginatedResponse(
            items=cls._build_dto_list(items),
            page=page,
            limit=limit,
            total=total,
            total_pages=total_pages,
        )
