from fastapi import APIRouter
from backend.app.api.v1.endpoints import media, search

api_router = APIRouter()

api_router.include_router(search.router, prefix="/search", tags=["Search"])
api_router.include_router(media.router, prefix="/media", tags=["Media Catalogue"])
