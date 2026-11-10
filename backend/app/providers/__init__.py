"""Metadata providers package."""
from backend.app.providers.base import BaseAdapter
from backend.app.providers.tmdb import TMDBAdapter
from backend.app.providers.anilist import AniListAdapter

__all__ = ["BaseAdapter", "TMDBAdapter", "AniListAdapter"]
