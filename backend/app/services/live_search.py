import asyncio
from datetime import date, datetime
from typing import Any, Dict, List, Optional
import httpx

from backend.app.core.config import settings
from backend.app.models.enums import CreditType, MediaStatus, MediaType
from backend.app.schemas.normalized import (
    NormalizedCreditDTO,
    NormalizedEpisodeDTO,
    NormalizedMediaDTO,
    NormalizedSeasonDTO,
    NormalizedTitleDTO,
)
from backend.app.services.playback import ANIME_TMDB_MAP


class LiveSearchService:
    CINEMETA_BASE_URL = "https://v3-cinemeta.strem.io"
    ANILIST_GRAPHQL_URL = "https://graphql.anilist.co"

    @classmethod
    async def search_cinemeta(
        cls,
        client: httpx.AsyncClient,
        query: str,
        media_type: Optional[MediaType] = None,
        limit: int = 6,
    ) -> List[NormalizedMediaDTO]:
        """Search movies and series on Cinemeta (free, open Stremio index)."""
        dtos: List[NormalizedMediaDTO] = []
        types_to_search = []
        if media_type == MediaType.MOVIE:
            types_to_search = [("movie", MediaType.MOVIE)]
        elif media_type == MediaType.TV_SHOW:
            types_to_search = [("series", MediaType.TV_SHOW)]
        else:
            types_to_search = [("movie", MediaType.MOVIE), ("series", MediaType.TV_SHOW)]

        encoded_q = httpx.URL(f"search={query}").raw_path.decode()

        for c_type, m_type in types_to_search:
            try:
                url = f"{cls.CINEMETA_BASE_URL}/catalog/{c_type}/top/{encoded_q}.json"
                resp = await client.get(url, timeout=4.0)
                if resp.status_code != 200:
                    continue
                data = resp.json()
                metas = data.get("metas", [])[:limit]

                # Fetch meta details for the top items concurrently to get moviedb_id and description
                async def fetch_meta(meta_item: Dict[str, Any], curr_ctype: str, curr_mtype: MediaType) -> Optional[NormalizedMediaDTO]:
                    imdb_id = meta_item.get("id") or meta_item.get("imdb_id")
                    if not imdb_id:
                        return None
                    try:
                        detail_url = f"{cls.CINEMETA_BASE_URL}/meta/{curr_ctype}/{imdb_id}.json"
                        d_resp = await client.get(detail_url, timeout=3.5)
                        if d_resp.status_code == 200:
                            d_meta = d_resp.json().get("meta", {})
                        else:
                            d_meta = meta_item
                    except Exception:
                        d_meta = meta_item

                    title = d_meta.get("name") or meta_item.get("name")
                    if not title:
                        return None

                    # Extract year / release date
                    rel_date = None
                    year_val = d_meta.get("year") or meta_item.get("releaseInfo")
                    if year_val:
                        try:
                            clean_year = int(str(year_val).split("–")[0].split("-")[0].strip())
                            rel_date = date(clean_year, 1, 1)
                        except Exception:
                            pass

                    # Extract moviedb_id (TMDB ID)
                    moviedb_id = d_meta.get("moviedb_id")
                    provider_ext_id = str(moviedb_id) if moviedb_id else str(imdb_id)
                    provider_name = "tmdb" if moviedb_id else "imdb"

                    # Genres
                    genres = d_meta.get("genres", [])
                    if not genres and d_meta.get("genre"):
                        g_raw = d_meta["genre"]
                        genres = [g_raw] if isinstance(g_raw, str) else list(g_raw)

                    # Rating
                    vote_avg = 7.5
                    if d_meta.get("imdbRating"):
                        try:
                            vote_avg = float(d_meta["imdbRating"])
                        except Exception:
                            pass

                    # Cast
                    credits = []
                    for idx, actor in enumerate(d_meta.get("cast", [])[:5]):
                        credits.append(
                            NormalizedCreditDTO(
                                person_name=actor,
                                credit_type=CreditType.CAST,
                                order=idx,
                            )
                        )
                    director = d_meta.get("director")
                    if director:
                        d_names = [director] if isinstance(director, str) else director
                        for d_name in d_names[:2]:
                            credits.append(
                                NormalizedCreditDTO(
                                    person_name=d_name,
                                    credit_type=CreditType.CREW,
                                    job="Director",
                                    department="Directing",
                                )
                            )

                    # Seasons / Episodes for series
                    seasons_dto: List[NormalizedSeasonDTO] = []
                    if curr_mtype == MediaType.TV_SHOW:
                        videos = d_meta.get("videos", [])
                        seasons_dict: Dict[int, List[NormalizedEpisodeDTO]] = {}
                        seen_eps = set()
                        for v in videos:
                            s_num = int(v.get("season", 1))
                            e_num = int(v.get("episode", 1))
                            if (s_num, e_num) in seen_eps:
                                continue
                            seen_eps.add((s_num, e_num))
                            ep_dto = NormalizedEpisodeDTO(
                                episode_number=e_num,
                                title=v.get("title") or v.get("name") or f"Episode {e_num}",
                                overview=v.get("overview", ""),
                            )
                            seasons_dict.setdefault(s_num, []).append(ep_dto)

                        for s_num in sorted(seasons_dict.keys()):
                            seasons_dto.append(
                                NormalizedSeasonDTO(
                                    season_number=s_num,
                                    title=f"Season {s_num}",
                                    episode_count=len(seasons_dict[s_num]),
                                    episodes=seasons_dict[s_num],
                                )
                            )

                    # Runtime clean integer (e.g. "90 min" -> 90)
                    runtime_int = None
                    raw_rt = d_meta.get("runtime")
                    if raw_rt:
                        try:
                            digits = "".join(filter(str.isdigit, str(raw_rt)))
                            if digits:
                                runtime_int = int(digits)
                        except Exception:
                            pass

                    return NormalizedMediaDTO(
                        provider=provider_name,
                        external_id=provider_ext_id,
                        media_type=curr_mtype,
                        title=title,
                        original_title=title,
                        overview=d_meta.get("description") or f"{title} ({year_val or ''})",
                        release_date=rel_date,
                        runtime=runtime_int,
                        vote_average=vote_avg,
                        vote_count=1000,
                        popularity=150.0,
                        poster_url=d_meta.get("poster") or meta_item.get("poster"),
                        backdrop_url=d_meta.get("background") or meta_item.get("background"),
                        status=MediaStatus.RELEASED,
                        genres=genres,
                        titles=[NormalizedTitleDTO(title=title, title_type="primary", is_primary=True)],
                        credits=credits,
                        seasons=seasons_dto,
                        raw_metadata={
                            "imdb_id": imdb_id,
                            "moviedb_id": moviedb_id,
                        },
                    )

                tasks = [fetch_meta(item, c_type, m_type) for item in metas]
                meta_results = await asyncio.gather(*tasks, return_exceptions=True)
                for res in meta_results:
                    if isinstance(res, NormalizedMediaDTO):
                        dtos.append(res)
            except Exception as e:
                print(f"[LiveSearch] Cinemeta search error for {c_type}: {e}")

        return dtos

    @classmethod
    async def search_anilist(
        cls,
        client: httpx.AsyncClient,
        query: str,
        limit: int = 6,
    ) -> List[NormalizedMediaDTO]:
        """Search anime on AniList GraphQL."""
        dtos: List[NormalizedMediaDTO] = []
        graphql_query = """
        query ($search: String, $perPage: Int) {
          Page(page: 1, perPage: $perPage) {
            media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
              id
              title {
                romaji
                english
                native
              }
              format
              status
              description(asHtml: false)
              startDate { year month day }
              endDate { year month day }
              episodes
              duration
              countryOfOrigin
              genres
              averageScore
              popularity
              coverImage { extraLarge large }
              bannerImage
            }
          }
        }
        """
        try:
            resp = await client.post(
                cls.ANILIST_GRAPHQL_URL,
                json={"query": graphql_query, "variables": {"search": query, "perPage": limit}},
                timeout=4.0,
            )
            if resp.status_code != 200:
                return []
            data = resp.json().get("data", {}).get("Page", {}).get("media", [])

            for item in data:
                raw_titles = item.get("title", {}) or {}
                title = (
                    raw_titles.get("english")
                    or raw_titles.get("romaji")
                    or raw_titles.get("native")
                    or "Untitled Anime"
                )
                orig_title = raw_titles.get("native") or raw_titles.get("romaji")

                # Dates
                start = item.get("startDate", {}) or {}
                rel_date = None
                if start.get("year") and start.get("month") and start.get("day"):
                    try:
                        rel_date = date(start["year"], start["month"], start["day"])
                    except ValueError:
                        pass

                # Mapped TMDB ID
                anilist_id = str(item["id"])
                mapped_tmdb_id = None
                title_lower = title.lower()
                for key, val in ANIME_TMDB_MAP.items():
                    if key in title_lower:
                        mapped_tmdb_id = val
                        break

                provider = "tmdb" if mapped_tmdb_id else "anilist"
                ext_id = mapped_tmdb_id if mapped_tmdb_id else anilist_id

                cover = item.get("coverImage", {}) or {}
                poster_url = cover.get("extraLarge") or cover.get("large")
                backdrop_url = item.get("bannerImage")

                # Seasons/episodes
                ep_count = item.get("episodes") or 12
                episodes = [
                    NormalizedEpisodeDTO(
                        episode_number=idx,
                        title=f"Episode {idx}",
                        overview="",
                    )
                    for idx in range(1, min(ep_count + 1, 25))
                ]
                seasons = [
                    NormalizedSeasonDTO(
                        season_number=1,
                        title="Season 1",
                        episode_count=len(episodes),
                        episodes=episodes,
                    )
                ]

                score = float(item.get("averageScore", 80)) / 10.0 if item.get("averageScore") else 8.0

                dto = NormalizedMediaDTO(
                    provider=provider,
                    external_id=ext_id,
                    media_type=MediaType.ANIME,
                    title=title,
                    original_title=orig_title,
                    overview=item.get("description") or f"{title} on Cineverse",
                    release_date=rel_date,
                    runtime=item.get("duration"),
                    vote_average=score,
                    vote_count=item.get("popularity", 1000),
                    popularity=float(item.get("popularity", 100.0)),
                    poster_url=poster_url,
                    backdrop_url=backdrop_url,
                    status=MediaStatus.RELEASED,
                    genres=item.get("genres", ["Animation", "Action"]),
                    titles=[
                        NormalizedTitleDTO(title=title, title_type="primary", is_primary=True),
                    ],
                    seasons=seasons,
                    raw_metadata={
                        "anilist_id": anilist_id,
                        "tmdb_id": mapped_tmdb_id,
                    },
                )
                dtos.append(dto)
        except Exception as e:
            print(f"[LiveSearch] AniList search error: {e}")

        return dtos

    @classmethod
    async def search_and_cache(
        cls,
        query: str,
        media_type: Optional[MediaType] = None,
        limit: int = 10,
    ) -> List[NormalizedMediaDTO]:
        """
        Search live across Cinemeta & AniList simultaneously.
        Returns normalized DTOs ready for display and auto-ingestion.
        """
        q = query.strip()
        if not q or len(q) < 2:
            return []

        async with httpx.AsyncClient(
            headers={"User-Agent": "Cineverse/1.0 (LiveSearch Engine)"},
            follow_redirects=True,
        ) as client:
            tasks = []
            if media_type != MediaType.ANIME:
                tasks.append(cls.search_cinemeta(client, q, media_type=media_type, limit=limit))
            if media_type != MediaType.MOVIE:
                tasks.append(cls.search_anilist(client, q, limit=limit))

            results = await asyncio.gather(*tasks, return_exceptions=True)

        combined: List[NormalizedMediaDTO] = []
        for r in results:
            if isinstance(r, list):
                combined.extend(r)

        return combined
