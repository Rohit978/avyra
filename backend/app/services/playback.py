from typing import List, Optional
from urllib.parse import urlparse
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.core.config import settings
from backend.app.models.enums import MediaType
from backend.app.models.external_id import ExternalID
from backend.app.models.media import Media
from backend.app.schemas.playback import EmbedSourceDTO, PlaybackOptionsResponseDTO


class PlaybackService:
    @staticmethod
    def _is_domain_allowed(url: str) -> bool:
        try:
            parsed = urlparse(url)
            hostname = parsed.hostname
            if not hostname:
                return False
            return any(
                hostname == allowed or hostname.endswith(f".{allowed}")
                for allowed in settings.ALLOWED_EMBED_DOMAINS
            )
        except Exception:
            return False

    @classmethod
    async def resolve_playback(
        cls,
        db: AsyncSession,
        media_id: UUID,
        season_number: Optional[int] = None,
        episode_number: Optional[int] = None,
    ) -> Optional[PlaybackOptionsResponseDTO]:
        stmt = (
            select(Media)
            .options(selectinload(Media.external_ids))
            .where(Media.id == media_id)
        )
        res = await db.execute(stmt)
        media = res.scalar_one_or_none()
        if not media:
            return None

        # Locate TMDB external ID
        tmdb_eid: Optional[ExternalID] = None
        if media.external_ids:
            for eid in media.external_ids:
                if eid.provider.lower() == "tmdb":
                    tmdb_eid = eid
                    break

        # Fallback if no TMDB ID is linked
        if not tmdb_eid or not tmdb_eid.external_id:
            return PlaybackOptionsResponseDTO(
                media_id=media.id,
                media_type=media.media_type,
                title=media.title,
                has_stream=False,
                reason="No TMDB provider mapping available for stream routing.",
                embed_sources=[],
            )

        tmdb_id = str(tmdb_eid.external_id).strip()
        embed_sources: List[EmbedSourceDTO] = []

        is_episodic = media.media_type in (MediaType.TV_SHOW, MediaType.ANIME)
        has_ep_params = season_number is not None and episode_number is not None

        if is_episodic and has_ep_params:
            # 1. Vidbolt TV template: https://vidbolt.xyz/tv/{id}/{s}/{e}
            vidbolt_tv_url = settings.VIDBOLT_TV_URL_TEMPLATE.format(
                id=tmdb_id,
                s=season_number,
                e=episode_number,
            )
            if cls._is_domain_allowed(vidbolt_tv_url):
                embed_sources.append(
                    EmbedSourceDTO(
                        id="vidbolt-tv",
                        name="Vidbolt",
                        embed_url=vidbolt_tv_url,
                        domain="vidbolt.xyz",
                        is_primary=True,
                    )
                )

            # 2. Reelsdownload fallback player template
            reels_url = settings.REELSDOWNLOAD_URL_TEMPLATE.format(TMDB_ID=tmdb_id)
            if cls._is_domain_allowed(reels_url):
                embed_sources.append(
                    EmbedSourceDTO(
                        id="reelsdownload",
                        name="ReelsDownload",
                        embed_url=reels_url,
                        domain="embed.reelsdownload.online",
                        is_primary=len(embed_sources) == 0,
                    )
                )
        else:
            # Movie or default title stream
            # 1. Vidbolt Movie: https://vidbolt.xyz/movie/{TMDB_ID}
            vidbolt_movie_url = settings.VIDBOLT_MOVIE_URL_TEMPLATE.format(TMDB_ID=tmdb_id)
            if cls._is_domain_allowed(vidbolt_movie_url):
                embed_sources.append(
                    EmbedSourceDTO(
                        id="vidbolt-movie",
                        name="Vidbolt",
                        embed_url=vidbolt_movie_url,
                        domain="vidbolt.xyz",
                        is_primary=True,
                    )
                )

            # 2. ReelsDownload: https://embed.reelsdownload.online/player/{TMDB_ID}?key=k_5661ac637169a1733857dc50
            reels_url = settings.REELSDOWNLOAD_URL_TEMPLATE.format(TMDB_ID=tmdb_id)
            if cls._is_domain_allowed(reels_url):
                embed_sources.append(
                    EmbedSourceDTO(
                        id="reelsdownload",
                        name="ReelsDownload",
                        embed_url=reels_url,
                        domain="embed.reelsdownload.online",
                        is_primary=len(embed_sources) == 0,
                    )
                )

        return PlaybackOptionsResponseDTO(
            media_id=media.id,
            media_type=media.media_type,
            title=media.title,
            has_stream=len(embed_sources) > 0,
            tmdb_id=tmdb_id,
            season_number=season_number,
            episode_number=episode_number,
            embed_sources=embed_sources,
            sandbox_policy="allow-scripts allow-same-origin allow-forms allow-presentation",
            referrer_policy="no-referrer",
            reason=None if len(embed_sources) > 0 else "Configured stream domains were rejected by policy.",
        )
