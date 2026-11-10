from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    PROJECT_NAME: str = "Cineverse"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "supersecretchangeinproduction"
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/cineverse"
    SYNC_DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/cineverse"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
    # Provider settings
    TMDB_API_KEY: str = ""
    ANILIST_API_URL: str = "https://graphql.anilist.co"
    
    # Configured Embed Templates
    VIDBOLT_MOVIE_URL_TEMPLATE: str = "https://vidbolt.xyz/movie/{TMDB_ID}"
    VIDBOLT_TV_URL_TEMPLATE: str = "https://vidbolt.xyz/tv/{id}/{s}/{e}"
    REELSDOWNLOAD_URL_TEMPLATE: str = "https://embed.reelsdownload.online/player/{TMDB_ID}?key=k_5661ac637169a1733857dc50"
    
    # Embed domain allowlist
    ALLOWED_EMBED_DOMAINS: List[str] = [
        "vidbolt.xyz",
        "embed.reelsdownload.online",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()

