from typing import List, Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.models.media import Media
from backend.app.models.watchlist import Watchlist, WatchlistItem
from backend.app.schemas.search import MediaSummaryDTO
from backend.app.schemas.watchlist import (
    WatchlistCreateRequest,
    WatchlistDetailResponseDTO,
    WatchlistItemResponseDTO,
    WatchlistResponseDTO,
    WatchlistUpdateRequest,
)


class WatchlistService:
    @staticmethod
    def _map_media_summary(m: Media) -> MediaSummaryDTO:
        return MediaSummaryDTO(
            id=m.id,
            title=m.title,
            original_title=m.original_title,
            media_type=m.media_type,
            status=m.status,
            overview=m.overview,
            release_date=m.release_date,
            poster_url=m.poster_url,
            backdrop_url=m.backdrop_url,
            vote_average=m.vote_average,
            vote_count=m.vote_count,
            popularity=m.popularity,
            genres=[g.name for g in m.genres] if m.genres else [],
        )

    @classmethod
    async def get_user_watchlists(
        cls, db: AsyncSession, user_id: UUID
    ) -> List[WatchlistResponseDTO]:
        stmt = (
            select(Watchlist)
            .options(selectinload(Watchlist.items))
            .where(Watchlist.user_id == user_id)
            .order_by(Watchlist.created_at.desc())
        )
        res = await db.execute(stmt)
        watchlists = res.scalars().all()

        return [
            WatchlistResponseDTO(
                id=w.id,
                user_id=w.user_id,
                name=w.name,
                description=w.description,
                is_default=w.is_default,
                item_count=len(w.items) if w.items else 0,
                created_at=w.created_at,
            )
            for w in watchlists
        ]

    @classmethod
    async def create_watchlist(
        cls, db: AsyncSession, user_id: UUID, req: WatchlistCreateRequest
    ) -> WatchlistResponseDTO:
        # Check duplicate name for this user
        existing = await db.scalar(
            select(func.count(Watchlist.id)).where(
                Watchlist.user_id == user_id,
                func.lower(Watchlist.name) == req.name.strip().lower(),
            )
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A watchlist named '{req.name.strip()}' already exists.",
            )

        new_wl = Watchlist(
            user_id=user_id,
            name=req.name.strip(),
            description=req.description,
            is_default=req.is_default,
        )
        db.add(new_wl)
        await db.commit()
        await db.refresh(new_wl)

        return WatchlistResponseDTO(
            id=new_wl.id,
            user_id=new_wl.user_id,
            name=new_wl.name,
            description=new_wl.description,
            is_default=new_wl.is_default,
            item_count=0,
            created_at=new_wl.created_at,
        )

    @classmethod
    async def get_watchlist_detail(
        cls, db: AsyncSession, user_id: UUID, watchlist_id: UUID
    ) -> Optional[WatchlistDetailResponseDTO]:
        stmt = (
            select(Watchlist)
            .options(
                selectinload(Watchlist.items)
                .selectinload(WatchlistItem.media)
                .selectinload(Media.genres)
            )
            .where(Watchlist.id == watchlist_id, Watchlist.user_id == user_id)
        )
        res = await db.execute(stmt)
        wl = res.scalar_one_or_none()
        if not wl:
            return None

        items_dto = [
            WatchlistItemResponseDTO(
                id=item.id,
                watchlist_id=item.watchlist_id,
                media_id=item.media_id,
                media=cls._map_media_summary(item.media) if item.media else None,
                created_at=item.created_at,
            )
            for item in (wl.items or [])
        ]

        return WatchlistDetailResponseDTO(
            id=wl.id,
            user_id=wl.user_id,
            name=wl.name,
            description=wl.description,
            is_default=wl.is_default,
            item_count=len(items_dto),
            created_at=wl.created_at,
            items=items_dto,
        )

    @classmethod
    async def update_watchlist(
        cls, db: AsyncSession, user_id: UUID, watchlist_id: UUID, req: WatchlistUpdateRequest
    ) -> Optional[WatchlistResponseDTO]:
        stmt = (
            select(Watchlist)
            .options(selectinload(Watchlist.items))
            .where(Watchlist.id == watchlist_id, Watchlist.user_id == user_id)
        )
        res = await db.execute(stmt)
        wl = res.scalar_one_or_none()
        if not wl:
            return None

        if req.name and req.name.strip().lower() != wl.name.lower():
            conflict = await db.scalar(
                select(func.count(Watchlist.id)).where(
                    Watchlist.user_id == user_id,
                    Watchlist.id != watchlist_id,
                    func.lower(Watchlist.name) == req.name.strip().lower(),
                )
            )
            if conflict:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"A watchlist named '{req.name.strip()}' already exists.",
                )
            wl.name = req.name.strip()

        if req.description is not None:
            wl.description = req.description
        if req.is_default is not None:
            wl.is_default = req.is_default

        await db.commit()
        await db.refresh(wl)

        return WatchlistResponseDTO(
            id=wl.id,
            user_id=wl.user_id,
            name=wl.name,
            description=wl.description,
            is_default=wl.is_default,
            item_count=len(wl.items) if wl.items else 0,
            created_at=wl.created_at,
        )

    @classmethod
    async def delete_watchlist(
        cls, db: AsyncSession, user_id: UUID, watchlist_id: UUID
    ) -> bool:
        stmt = select(Watchlist).where(Watchlist.id == watchlist_id, Watchlist.user_id == user_id)
        res = await db.execute(stmt)
        wl = res.scalar_one_or_none()
        if not wl:
            return False

        await db.delete(wl)
        await db.commit()
        return True

    @classmethod
    async def add_item(
        cls, db: AsyncSession, user_id: UUID, watchlist_id: UUID, media_id: UUID
    ) -> WatchlistItemResponseDTO:
        # Check ownership of watchlist
        wl = await db.scalar(
            select(Watchlist).where(Watchlist.id == watchlist_id, Watchlist.user_id == user_id)
        )
        if not wl:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Watchlist not found.")

        # Check media exists
        media = await db.scalar(
            select(Media).options(selectinload(Media.genres)).where(Media.id == media_id)
        )
        if not media:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media not found.")

        # Check item already in watchlist
        existing_item = await db.scalar(
            select(WatchlistItem).where(
                WatchlistItem.watchlist_id == watchlist_id,
                WatchlistItem.media_id == media_id,
            )
        )
        if existing_item:
            return WatchlistItemResponseDTO(
                id=existing_item.id,
                watchlist_id=existing_item.watchlist_id,
                media_id=existing_item.media_id,
                media=cls._map_media_summary(media),
                created_at=existing_item.created_at,
            )

        new_item = WatchlistItem(watchlist_id=watchlist_id, media_id=media_id)
        db.add(new_item)
        await db.commit()
        await db.refresh(new_item)

        return WatchlistItemResponseDTO(
            id=new_item.id,
            watchlist_id=new_item.watchlist_id,
            media_id=new_item.media_id,
            media=cls._map_media_summary(media),
            created_at=new_item.created_at,
        )

    @classmethod
    async def remove_item(
        cls, db: AsyncSession, user_id: UUID, watchlist_id: UUID, media_id: UUID
    ) -> bool:
        # Check ownership
        wl_exists = await db.scalar(
            select(func.count(Watchlist.id)).where(
                Watchlist.id == watchlist_id, Watchlist.user_id == user_id
            )
        )
        if not wl_exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Watchlist not found.")

        item = await db.scalar(
            select(WatchlistItem).where(
                WatchlistItem.watchlist_id == watchlist_id,
                WatchlistItem.media_id == media_id,
            )
        )
        if not item:
            return False

        await db.delete(item)
        await db.commit()
        return True
