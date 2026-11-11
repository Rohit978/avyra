import math
import sys
import uuid
from typing import List, Optional
from sqlalchemy import case, distinct, extract, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.ingestion.pipeline import IngestionPipeline
from backend.app.models.enums import MediaType
from backend.app.models.genre import Genre
from backend.app.models.media import Media
from backend.app.models.title import MediaTitle
from backend.app.schemas.search import MediaSummaryDTO, PaginatedResponse, SearchSuggestionDTO
from backend.app.services.live_search import LiveSearchService


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

        # Helper to execute DB query
        async def _query_local():
            bind = db.get_bind()
            is_postgres = (bind.dialect.name == "postgresql") if bind else False

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

            stmt = select(Media).options(selectinload(Media.genres)).where(base_filter)
            count_stmt = select(func.count(distinct(Media.id))).select_from(Media).where(base_filter)

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

            total_res = await db.execute(count_stmt)
            total = total_res.scalar_one_or_none() or 0

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
            return total, media_items

        total, media_items = await _query_local()

        # JIT Live Search & Auto-Cache: If no local items found, search Cinemeta & AniList live
        if total == 0 and len(q) >= 2 and "pytest" not in sys.modules:
            try:
                remote_dtos = await LiveSearchService.search_and_cache(
                    query=q,
                    media_type=media_type,
                    limit=8,
                )
                if remote_dtos:
                    pipeline = IngestionPipeline(db)
                    ingested_any = False
                    for dto in remote_dtos:
                        try:
                            await pipeline.upsert_media(dto)
                            ingested_any = True
                        except Exception as e:
                            pass
                    if ingested_any:
                        await db.commit()
                        total, media_items = await _query_local()
            except Exception as e:
                print(f"[SearchService] Live search error: {e}")

        if total == 0:
            return PaginatedResponse(
                items=[],
                page=page,
                limit=limit,
                total=0,
                total_pages=0,
            )

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

        async def _query_suggestions():
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
            return results.all()

        rows = await _query_suggestions()

        # If no local suggestions found, do quick live fetch
        if not rows and len(q) >= 2 and "pytest" not in sys.modules:
            try:
                remote_dtos = await LiveSearchService.search_and_cache(query=q, limit=4)
                if remote_dtos:
                    pipeline = IngestionPipeline(db)
                    ingested_any = False
                    for dto in remote_dtos:
                        try:
                            await pipeline.upsert_media(dto)
                            ingested_any = True
                        except Exception:
                            pass
                    if ingested_any:
                        await db.commit()
                        rows = await _query_suggestions()
            except Exception:
                pass

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
