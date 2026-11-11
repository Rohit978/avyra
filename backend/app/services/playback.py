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


ANIME_TMDB_MAP = {
    "naruto": "31910",
    "shippuden": "31910",
    "one piece": "37854",
    "bleach": "30984",
    "jujutsu kaisen": "95479",
    "demon slayer": "85937",
    "kimetsu no yaiba": "85937",
    "attack on titan": "1429",
    "shingeki no kyojin": "1429",
    "solo leveling": "127532",
    "chainsaw man": "114410",
    "death note": "13916",
    "fullmetal alchemist": "31911",
    "hunter x hunter": "46298",
    "my hero academia": "65930",
    "one punch man": "63926",
    "cyberpunk": "105248",
    "black clover": "73223",
    "apothecary diaries": "220645",
    "jojo": "46116",
    "steel ball run": "46116",
    "frieren": "209867",
    "spy x family": "120089",
    "tokyo ghoul": "61374",
    "sword art online": "45782",
    "overlord": "64196",
    "mob psycho": "67070",
    "vinland saga": "83236",
    "dragon ball": "12971",
    "haikyu": "60863",
    "blue lock": "135251",
    "kaiju": "207468",
    "dandadan": "237478",
    "overgeared": "280208",
    "chitose": "265636",
    "sato-san": "209502",
    "student council": "191656",
    "laid-off cheat": "249821",
    "nia liston": "270830",
    "love potion": "268593",
}


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

        # Dynamic fallback matching for anime / missing TMDB IDs
        tmdb_id: Optional[str] = None
        if tmdb_eid and tmdb_eid.external_id:
            tmdb_id = str(tmdb_eid.external_id).strip()
        else:
            title_lower = (media.title or "").lower()
            orig_lower = (media.original_title or "").lower()
            for key, val in ANIME_TMDB_MAP.items():
                if key in title_lower or key in orig_lower:
                    tmdb_id = val
                    break

        # Fallback if no TMDB ID is linked
        if not tmdb_id:
            return PlaybackOptionsResponseDTO(
                media_id=media.id,
                media_type=media.media_type,
                title=media.title,
                has_stream=False,
                reason="No TMDB provider mapping available for stream routing.",
                embed_sources=[],
            )

        embed_sources: List[EmbedSourceDTO] = []
        is_episodic = media.media_type in (MediaType.TV_SHOW, MediaType.ANIME)

        if is_episodic:
            # Episodic content (TV Shows & Anime): Default to Season 1, Episode 1 if not specified
            s_num = season_number if season_number is not None else 1
            e_num = episode_number if episode_number is not None else 1

            # 1. Vidbolt TV template: https://vidbolt.xyz/tv/{id}/{s}/{e}
            vidbolt_tv_url = settings.VIDBOLT_TV_URL_TEMPLATE.format(
                id=tmdb_id,
                s=s_num,
                e=e_num,
            )
            if cls._is_domain_allowed(vidbolt_tv_url):
                embed_sources.append(
                    EmbedSourceDTO(
                        id="vidbolt-tv",
                        name="Server 1",
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
                        name="Server 2",
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
                        name="Server 1",
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
                        name="Server 2",
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
