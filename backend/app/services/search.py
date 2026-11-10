import math
import uuid
from typing import List, Optional
from sqlalchemy import case, distinct, extract, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.models.enums import MediaType
from backend.app.models.genre import Genre
from backend.app.models.media import Media
from backend.app.models.title import MediaTitle
from backend.app.schemas.search import MediaSummaryDTO, PaginatedResponse, SearchSuggestionDTO


class SearchService:
    @staticmethod
    async def search_media(
        db: AsyncSession,
        query: str,
        media_type: Optional[MediaType] = None,
        genre: Optional[str] = None,
        year: Optional[int] = None,
        page: int = 1,
        limit: int = 20,
    ) -> PaginatedResponse[MediaSummaryDTO]:
        q = query.strip()
        if not q:
            return PaginatedResponse(
                items=[],
                page=page,
                limit=limit,
                total=0,
                total_pages=0,
            )

        # Detect dialect
        bind = db.get_bind()
        is_postgres = (bind.dialect.name == "postgresql") if bind else False

        # Alternate titles subquery
        if is_postgres:
            alt_match_cond = or_(
                MediaTitle.title.ilike(f"%{q}%"),
                func.similarity(MediaTitle.title, q) > 0.25,
            )
            media_match_cond = or_(
                Media.title.ilike(f"%{q}%"),
                func.similarity(Media.title, q) > 0.25,
            )
        else:
            alt_match_cond = MediaTitle.title.ilike(f"%{q}%")
            media_match_cond = or_(
                Media.title.ilike(f"%{q}%"),
                Media.original_title.ilike(f"%{q}%"),
            )

        alt_subq = select(MediaTitle.media_id).where(alt_match_cond)
        base_filter = or_(media_match_cond, Media.id.in_(alt_subq))

        # Base statement
        stmt = select(Media).options(selectinload(Media.genres)).where(base_filter)
        count_stmt = select(func.count(distinct(Media.id))).select_from(Media).where(base_filter)

        # Optional filters
        if media_type:
            stmt = stmt.where(Media.media_type == media_type)
            count_stmt = count_stmt.where(Media.media_type == media_type)

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

        # Ranking score: exact matches first, then prefix, then popularity
        exact_rank = case(
            (func.lower(Media.title) == q.lower(), 1),
            (Media.title.ilike(f"{q}%"), 2),
            else_=3,
        )

        stmt = stmt.order_by(exact_rank.asc(), Media.popularity.desc())
        offset = max(0, (page - 1) * limit)
        stmt = stmt.offset(offset).limit(limit)

        results = await db.execute(stmt)
        media_items = results.scalars().all()

        dto_items = [
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

        total_pages = math.ceil(total / limit) if limit > 0 else 1

        return PaginatedResponse(
            items=dto_items,
            page=page,
            limit=limit,
            total=total,
            total_pages=total_pages,
        )

    @staticmethod
    async def get_search_suggestions(
        db: AsyncSession,
        query: str,
        limit: int = 8,
    ) -> List[SearchSuggestionDTO]:
        q = query.strip()
        if not q:
            return []

        limit = min(max(1, limit), 20)

        # Subquery for alternate titles
        alt_subq = select(MediaTitle.media_id).where(MediaTitle.title.ilike(f"%{q}%"))

        stmt = (
            select(
                Media.id,
                Media.title,
                Media.media_type,
                Media.release_date,
                Media.poster_url,
                Media.vote_average,
                Media.popularity,
            )
            .where(
                or_(
                    Media.title.ilike(f"%{q}%"),
                    Media.original_title.ilike(f"%{q}%"),
                    Media.id.in_(alt_subq),
                )
            )
        )

        exact_rank = case(
            (func.lower(Media.title) == q.lower(), 1),
            (Media.title.ilike(f"{q}%"), 2),
            else_=3,
        )

        stmt = stmt.order_by(exact_rank.asc(), Media.popularity.desc()).limit(limit)
        results = await db.execute(stmt)
        rows = results.all()

        return [
            SearchSuggestionDTO(
                id=row[0],
                title=row[1],
                media_type=row[2],
                release_date=row[3],
                poster_url=row[4],
                vote_average=row[5],
            )
            for row in rows
        ]
