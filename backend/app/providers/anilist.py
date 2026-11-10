from datetime import date
from typing import Any, Dict, List, Optional
from backend.app.core.config import settings
from backend.app.models.enums import CreditType, MediaStatus, MediaType
from backend.app.providers.base import BaseAdapter
from backend.app.schemas.normalized import (
    NormalizedCreditDTO,
    NormalizedMediaDTO,
    NormalizedSeasonDTO,
    NormalizedTitleDTO,
)


class AniListAdapter(BaseAdapter):
    """AniList GraphQL API adapter for anime metadata."""

    def __init__(
        self,
        endpoint_url: Optional[str] = None,
        rate_limit_delay: float = 0.5,
    ):
        url = endpoint_url or settings.ANILIST_API_URL
        super().__init__(
            name="anilist",
            base_url=url,
            rate_limit_delay=rate_limit_delay,
        )

    async def _graphql_query(self, query: str, variables: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Execute a GraphQL query against AniList API."""
        payload = {"query": query, "variables": variables or {}}
        headers = {"Content-Type": "application/json", "Accept": "application/json"}
        response = await self._request_with_retry(
            method="POST",
            endpoint="",
            json_data=payload,
            headers=headers,
        )
        return response.get("data", {})

    async def health_check(self) -> bool:
        """Ping AniList with minimal query."""
        try:
            query = "query { SiteStatistics { users { nodes { date } } } }"
            await self._graphql_query(query)
            return True
        except Exception:
            return False

    async def get_popular(self, page: int = 1, per_page: int = 20) -> List[Dict[str, Any]]:
        """Fetch popular anime page from AniList."""
        query = """
        query ($page: Int, $perPage: Int) {
          Page(page: $page, perPage: $perPage) {
            media(type: ANIME, sort: POPULARITY_DESC) {
              id
              title {
                romaji
                english
                native
              }
              format
              status
              description
              startDate { year month day }
              endDate { year month day }
              episodes
              duration
              countryOfOrigin
              isAdult
              genres
              averageScore
              popularity
              coverImage { extraLarge large }
              bannerImage
            }
          }
        }
        """
        data = await self._graphql_query(query, {"page": page, "perPage": per_page})
        return data.get("Page", {}).get("media", [])

    async def get_trending(self, time_window: str = "day") -> List[Dict[str, Any]]:
        """Fetch trending anime from AniList."""
        query = """
        query {
          Page(page: 1, perPage: 20) {
            media(type: ANIME, sort: TRENDING_DESC) {
              id
              title {
                romaji
                english
                native
              }
              format
              status
              description
              startDate { year month day }
              endDate { year month day }
              episodes
              duration
              countryOfOrigin
              isAdult
              genres
              averageScore
              popularity
              coverImage { extraLarge large }
              bannerImage
            }
          }
        }
        """
        data = await self._graphql_query(query)
        return data.get("Page", {}).get("media", [])

    async def get_details(self, external_id: str) -> Dict[str, Any]:
        """Fetch full details for an anime by its AniList ID."""
        query = """
        query ($id: Int) {
          Media(id: $id, type: ANIME) {
            id
            idMal
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
            season
            seasonYear
            episodes
            duration
            countryOfOrigin
            isAdult
            genres
            synonyms
            averageScore
            popularity
            coverImage { extraLarge large }
            bannerImage
            studios(isMain: true) {
              nodes { id name }
            }
            characters(sort: ROLE, perPage: 15) {
              edges {
                node { name { full } image { medium } }
                role
                voiceActors(language: JAPANESE) {
                  id
                  name { full native }
                  image { medium }
                }
              }
            }
            staff(perPage: 10) {
              edges {
                node { id name { full } image { medium } }
                role
              }
            }
          }
        }
        """
        data = await self._graphql_query(query, {"id": int(external_id)})
        return data.get("Media", {})

    def normalize(self, raw_record: Dict[str, Any]) -> NormalizedMediaDTO:
        """Normalize AniList GraphQL payload into NormalizedMediaDTO."""
        external_id = str(raw_record.get("id"))
        raw_titles = raw_record.get("title", {}) or {}

        # Primary title preference: English -> Romaji -> Native
        title = raw_titles.get("english") or raw_titles.get("romaji") or raw_titles.get("native") or "Untitled Anime"
        original_title = raw_titles.get("native") or raw_titles.get("romaji")

        # Multilingual title collection
        titles_dto: List[NormalizedTitleDTO] = [
            NormalizedTitleDTO(title=title, title_type="primary", language="en", is_primary=True)
        ]
        if raw_titles.get("romaji") and raw_titles["romaji"] != title:
            titles_dto.append(
                NormalizedTitleDTO(title=raw_titles["romaji"], title_type="romanized", language="ja-latn", is_primary=False)
            )
        if raw_titles.get("native") and raw_titles["native"] != title:
            titles_dto.append(
                NormalizedTitleDTO(title=raw_titles["native"], title_type="native", language="ja", is_primary=False)
            )
        for syn in raw_record.get("synonyms", []):
            if syn and syn != title:
                titles_dto.append(
                    NormalizedTitleDTO(title=syn, title_type="alternate", is_primary=False)
                )

        # Dates
        start = raw_record.get("startDate", {}) or {}
        release_date = None
        if start.get("year") and start.get("month") and start.get("day"):
            try:
                release_date = date(start["year"], start["month"], start["day"])
            except ValueError:
                pass

        end = raw_record.get("endDate", {}) or {}
        end_date = None
        if end.get("year") and end.get("month") and end.get("day"):
            try:
                end_date = date(end["year"], end["month"], end["day"])
            except ValueError:
                pass

        # Status mapping
        raw_status = (raw_record.get("status") or "").upper()
        if raw_status == "FINISHED":
            status = MediaStatus.COMPLETED
        elif raw_status == "RELEASING":
            status = MediaStatus.ONGOING
        elif raw_status == "NOT_YET_RELEASED":
            status = MediaStatus.UPCOMING
        elif raw_status == "CANCELLED":
            status = MediaStatus.CANCELLED
        else:
            status = MediaStatus.UNKNOWN

        # Cover & Banner Images
        cover = raw_record.get("coverImage", {}) or {}
        poster_url = cover.get("extraLarge") or cover.get("large")
        backdrop_url = raw_record.get("bannerImage")

        # Score normalization (AniList is 0-100, normalize to 0-10 scale)
        avg_score = raw_record.get("averageScore")
        vote_average = (float(avg_score) / 10.0) if avg_score is not None else 0.0

        # Credits: Characters + Staff
        credits_dto: List[NormalizedCreditDTO] = []
        char_edges = (raw_record.get("characters", {}) or {}).get("edges", [])
        for edge in char_edges:
            char_node = edge.get("node", {}) or {}
            char_name = (char_node.get("name", {}) or {}).get("full")
            vas = edge.get("voiceActors", [])
            va_name = (vas[0].get("name", {}) or {}).get("full") if vas else None
            va_id = str(vas[0].get("id")) if vas and vas[0].get("id") else None

            credits_dto.append(
                NormalizedCreditDTO(
                    person_name=va_name or char_name or "Unknown Voice Actor",
                    credit_type=CreditType.CAST,
                    character_name=char_name,
                    profile_path=(vas[0].get("image", {}) or {}).get("medium") if vas else None,
                    external_person_id=va_id,
                )
            )

        staff_edges = (raw_record.get("staff", {}) or {}).get("edges", [])
        for edge in staff_edges:
            staff_node = edge.get("node", {}) or {}
            staff_name = (staff_node.get("name", {}) or {}).get("full")
            if staff_name:
                credits_dto.append(
                    NormalizedCreditDTO(
                        person_name=staff_name,
                        credit_type=CreditType.CREW,
                        job=edge.get("role"),
                        profile_path=(staff_node.get("image", {}) or {}).get("medium"),
                        external_person_id=str(staff_node.get("id")) if staff_node.get("id") else None,
                    )
                )

        # Single season abstraction if episodic anime
        seasons_dto = []
        ep_count = raw_record.get("episodes") or 0
        if ep_count > 0:
            seasons_dto.append(
                NormalizedSeasonDTO(
                    season_number=1,
                    title="Season 1",
                    air_date=release_date,
                    episode_count=ep_count,
                )
            )

        # Extract main studio
        studios = [s.get("name") for s in (raw_record.get("studios", {}) or {}).get("nodes", []) if s.get("name")]

        return NormalizedMediaDTO(
            provider="anilist",
            external_id=external_id,
            media_type=MediaType.ANIME,
            title=title,
            original_title=original_title,
            overview=raw_record.get("description"),
            release_date=release_date,
            end_date=end_date,
            original_language="ja",
            country_of_origin=raw_record.get("countryOfOrigin") or "JP",
            runtime=raw_record.get("duration"),
            is_adult=raw_record.get("isAdult", False),
            status=status,
            popularity=float(raw_record.get("popularity", 0.0)),
            vote_average=vote_average,
            vote_count=0,
            poster_url=poster_url,
            backdrop_url=backdrop_url,
            genres=raw_record.get("genres", []),
            titles=titles_dto,
            seasons=seasons_dto,
            credits=credits_dto,
            raw_metadata={
                "anilist_id": external_id,
                "id_mal": raw_record.get("idMal"),
                "format": raw_record.get("format"),
                "season": raw_record.get("season"),
                "season_year": raw_record.get("seasonYear"),
                "studios": studios,
            },
        )
