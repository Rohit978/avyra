from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_db
from backend.app.core.deps import get_current_active_user
from backend.app.models.user import User
from backend.app.schemas.watchlist import (
    WatchlistCreateRequest,
    WatchlistDetailResponseDTO,
    WatchlistItemAddRequest,
    WatchlistItemResponseDTO,
    WatchlistResponseDTO,
    WatchlistUpdateRequest,
)
from backend.app.services.watchlist import WatchlistService

router = APIRouter()


@router.get("", response_model=List[WatchlistResponseDTO], summary="List user watchlists")
async def get_watchlists(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all watchlists owned by the current authenticated user."""
    return await WatchlistService.get_user_watchlists(db, current_user.id)


@router.post("", response_model=WatchlistResponseDTO, status_code=status.HTTP_201_CREATED, summary="Create a new watchlist")
async def create_watchlist(
    req: WatchlistCreateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new custom watchlist."""
    return await WatchlistService.create_watchlist(db, current_user.id, req)


@router.get("/{watchlist_id}", response_model=WatchlistDetailResponseDTO, summary="Get watchlist detail with items")
async def get_watchlist_detail(
    watchlist_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve full details of a specific watchlist and all its saved media items."""
    wl = await WatchlistService.get_watchlist_detail(db, current_user.id, watchlist_id)
    if not wl:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Watchlist not found.")
    return wl


@router.put("/{watchlist_id}", response_model=WatchlistResponseDTO, summary="Update watchlist metadata")
async def update_watchlist(
    watchlist_id: UUID,
    req: WatchlistUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update name or description of an existing watchlist."""
    updated = await WatchlistService.update_watchlist(db, current_user.id, watchlist_id, req)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Watchlist not found.")
    return updated


@router.delete("/{watchlist_id}", summary="Delete watchlist")
async def delete_watchlist(
    watchlist_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a watchlist and remove all its items."""
    deleted = await WatchlistService.delete_watchlist(db, current_user.id, watchlist_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Watchlist not found.")
    return {"message": "Watchlist deleted successfully."}


@router.post("/{watchlist_id}/items", response_model=WatchlistItemResponseDTO, status_code=status.HTTP_201_CREATED, summary="Add item to watchlist")
async def add_item_to_watchlist(
    watchlist_id: UUID,
    req: WatchlistItemAddRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a media title to a user watchlist."""
    return await WatchlistService.add_item(db, current_user.id, watchlist_id, req.media_id)


@router.delete("/{watchlist_id}/items/{media_id}", summary="Remove item from watchlist")
async def remove_item_from_watchlist(
    watchlist_id: UUID,
    media_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a media title from a user watchlist."""
    removed = await WatchlistService.remove_item(db, current_user.id, watchlist_id, media_id)
    if not removed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found in watchlist.")
    return {"message": "Item removed from watchlist."}
