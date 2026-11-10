from fastapi import APIRouter
from backend.app.api.v1.endpoints import admin, auth, media, progress, search, watchlists

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(search.router, prefix="/search", tags=["Search"])
api_router.include_router(media.router, prefix="/media", tags=["Media Catalogue"])
api_router.include_router(watchlists.router, prefix="/watchlists", tags=["Watchlists"])
api_router.include_router(progress.router, prefix="/progress", tags=["Viewing Progress"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin Operations"])
