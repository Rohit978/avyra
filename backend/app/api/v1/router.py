from fastapi import APIRouter
from backend.app.api.v1.endpoints import auth, media, search

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(search.router, prefix="/search", tags=["Search"])
api_router.include_router(media.router, prefix="/media", tags=["Media Catalogue"])
