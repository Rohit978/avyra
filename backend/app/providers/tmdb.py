from datetime import datetime
from typing import Any, Dict, List, Optional
from backend.app.core.config import settings
from backend.app.models.enums import CreditType, MediaStatus, MediaType
from backend.app.providers.base import BaseAdapter
from backend.app.schemas.normalized import (
    NormalizedCreditDTO,
    NormalizedEpisodeDTO,
    NormalizedMediaDTO,
    NormalizedSeasonDTO,
    NormalizedTitleDTO,
)


class TMDBAdapter(BaseAdapter):
    """The Movie Database (TMDB) REST API adapter."""

    IMAGE_BASE_URL = "https://image.tmdb.org/t/p"

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: str = "https://api.themoviedb.org/3",
        rate_limit_delay: float = 0.2,
    ):
        super().__init__(
            name="tmdb",
            base_url=base_url,
            rate_limit_delay=rate_limit_delay,
        )
        self.api_key = api_key or settings.TMDB_API_KEY

    def _auth_params(self, extra: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        params = {"api_key": self.api_key}
        if extra:
            params.update(extra)
        return params

    def _get_image_url(self, path: Optional[str], size: str = "w500") -> Optional[str]:
        if not path:
            return None
        return f"{self.IMAGE_BASE_URL}/{size}/{path.lstrip('/')}"

    async def health_check(self) -> bool:
        """Ping TMDB configuration endpoint."""
        try:
            await self._request_with_retry("GET", "configuration", params=self._auth_params())
            return True
        except Exception:
            return False

    async def get_popular(self, page: int = 1) -> List[Dict[str, Any]]:
        """Fetch popular movies and tv shows from TMDB."""
        movies = await self._request_with_retry(
            "GET", "movie/popular", params=self._auth_params({"page": page})
        )
        results = []
        for item in movies.get("results", []):
            item["media_type"] = "movie"
            results.append(item)
        return results

    async def get_trending(self, time_window: str = "day") -> List[Dict[str, Any]]:
        """Fetch all trending media (movies + tv)."""
        data = await self._request_with_retry(
            "GET", f"trending/all/{time_window}", params=self._auth_params()
        )
        return data.get("results", [])

    async def get_details(self, external_id: str, media_type: str = "movie") -> Dict[str, Any]:
        """Fetch full details with credits, alternative titles, and videos."""
        endpoint = f"{media_type}/{external_id}"
        params = self._auth_params({
            "append_to_response": "credits,alternative_titles,external_ids"
        })
        data = await self._request_with_retry("GET", endpoint, params=params)
        data["media_type"] = media_type
        return data

    async def get_season_details(self, series_id: str, season_number: int) -> Dict[str, Any]:
        """Fetch season episodes."""
        endpoint = f"tv/{series_id}/season/{season_number}"
        return await self._request_with_retry("GET", endpoint, params=self._auth_params())

    def normalize(self, raw_record: Dict[str, Any]) -> NormalizedMediaDTO:
        """Normalize TMDB raw payload into NormalizedMediaDTO."""
        media_type_raw = raw_record.get("media_type", "movie")
        is_movie = media_type_raw == "movie"

        media_type = MediaType.MOVIE if is_movie else MediaType.TV_SHOW
        external_id = str(raw_record.get("id"))

        # Titles
        title = raw_record.get("title") if is_movie else raw_record.get("name")
        title = title or "Untitled"
        original_title = raw_record.get("original_title") if is_movie else raw_record.get("original_name")

        # Dates
        release_date_str = raw_record.get("release_date") if is_movie else raw_record.get("first_air_date")
        release_date = None
        if release_date_str:
            try:
                release_date = datetime.strptime(release_date_str, "%Y-%m-%d").date()
            except ValueError:
                pass

        end_date = None
        last_air_date_str = raw_record.get("last_air_date")
        if last_air_date_str:
            try:
                end_date = datetime.strptime(last_air_date_str, "%Y-%m-%d").date()
            except ValueError:
                pass

        # Status mapping
        raw_status = (raw_record.get("status") or "").lower()
        if "released" in raw_status or "ended" in raw_status:
            status = MediaStatus.RELEASED if is_movie else MediaStatus.COMPLETED
        elif "returning" in raw_status:
            status = MediaStatus.ONGOING
        elif "canceled" in raw_status or "cancelled" in raw_status:
            status = MediaStatus.CANCELLED
        elif "post" in raw_status or "planned" in raw_status or "in production" in raw_status:
            status = MediaStatus.UPCOMING
        else:
            status = MediaStatus.RELEASED if release_date else MediaStatus.UNKNOWN

        # Genres
        genres = []
        for g in raw_record.get("genres", []):
            if isinstance(g, dict) and "name" in g:
                genres.append(g["name"])
            elif isinstance(g, str):
                genres.append(g)

        # Alternate Titles
        titles_dto: List[NormalizedTitleDTO] = [
            NormalizedTitleDTO(
                title=title,
                title_type="primary",
                language=raw_record.get("original_language"),
                is_primary=True,
            )
        ]
        alt_titles = raw_record.get("alternative_titles", {})
        alt_list = alt_titles.get("titles", []) if is_movie else alt_titles.get("results", [])
        for alt in alt_list:
            alt_name = alt.get("title") or alt.get("name")
            if alt_name and alt_name != title:
                titles_dto.append(
                    NormalizedTitleDTO(
                        title=alt_name,
                        title_type="alternate",
                        language=alt.get("iso_3166_1") or alt.get("language"),
                        is_primary=False,
                    )
                )

        # Credits
        credits_dto: List[NormalizedCreditDTO] = []
        raw_credits = raw_record.get("credits", {})
        for cast in raw_credits.get("cast", [])[:20]:
            credits_dto.append(
                NormalizedCreditDTO(
                    person_name=cast.get("name", "Unknown"),
                    original_name=cast.get("original_name"),
                    credit_type=CreditType.CAST,
                    character_name=cast.get("character"),
                    order=cast.get("order", 0),
                    profile_path=self._get_image_url(cast.get("profile_path")),
                    external_person_id=str(cast.get("id")) if cast.get("id") else None,
                )
            )

        for crew in raw_credits.get("crew", [])[:15]:
            credits_dto.append(
                NormalizedCreditDTO(
                    person_name=crew.get("name", "Unknown"),
                    original_name=crew.get("original_name"),
                    credit_type=CreditType.CREW,
                    department=crew.get("department"),
                    job=crew.get("job"),
                    profile_path=self._get_image_url(crew.get("profile_path")),
                    external_person_id=str(crew.get("id")) if crew.get("id") else None,
                )
            )

        # Seasons for TV
        seasons_dto: List[NormalizedSeasonDTO] = []
        for s in raw_record.get("seasons", []):
            s_air_date = None
            if s.get("air_date"):
                try:
                    s_air_date = datetime.strptime(s["air_date"], "%Y-%m-%d").date()
                except ValueError:
                    pass

            seasons_dto.append(
                NormalizedSeasonDTO(
                    season_number=s.get("season_number", 1),
                    title=s.get("name"),
                    overview=s.get("overview"),
                    poster_path=self._get_image_url(s.get("poster_path")),
                    air_date=s_air_date,
                    episode_count=s.get("episode_count", 0),
                )
            )

        # Runtime
        runtime = raw_record.get("runtime")
        if not runtime and raw_record.get("episode_run_time"):
            runtimes = raw_record["episode_run_time"]
            runtime = runtimes[0] if runtimes else None

        return NormalizedMediaDTO(
            provider="tmdb",
            external_id=external_id,
            media_type=media_type,
            title=title,
            original_title=original_title,
            overview=raw_record.get("overview"),
            release_date=release_date,
            end_date=end_date,
            original_language=raw_record.get("original_language"),
            country_of_origin=raw_record.get("origin_country", [None])[0] if raw_record.get("origin_country") else None,
            runtime=runtime,
            is_adult=raw_record.get("adult", False),
            status=status,
            popularity=float(raw_record.get("popularity", 0.0)),
            vote_average=float(raw_record.get("vote_average", 0.0)),
            vote_count=int(raw_record.get("vote_count", 0)),
            poster_url=self._get_image_url(raw_record.get("poster_path")),
            backdrop_url=self._get_image_url(raw_record.get("backdrop_path"), size="original"),
            genres=genres,
            titles=titles_dto,
            seasons=seasons_dto,
            credits=credits_dto,
            raw_metadata={
                "tmdb_id": external_id,
                "tagline": raw_record.get("tagline"),
                "budget": raw_record.get("budget"),
                "revenue": raw_record.get("revenue"),
            },
        )
