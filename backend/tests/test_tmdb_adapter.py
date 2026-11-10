from datetime import date
from backend.app.models.enums import CreditType, MediaStatus, MediaType
from backend.app.providers.tmdb import TMDBAdapter
from backend.tests.fixtures.tmdb_fixtures import (
    SAMPLE_TMDB_MOVIE_DETAIL,
    SAMPLE_TMDB_TV_DETAIL,
)


def test_tmdb_normalize_movie():
    adapter = TMDBAdapter(api_key="test_key")
    normalized = adapter.normalize(SAMPLE_TMDB_MOVIE_DETAIL)

    assert normalized.provider == "tmdb"
    assert normalized.external_id == "550"
    assert normalized.media_type == MediaType.MOVIE
    assert normalized.title == "Fight Club"
    assert normalized.release_date == date(1999, 10, 15)
    assert normalized.runtime == 139
    assert normalized.status == MediaStatus.RELEASED
    assert "Drama" in normalized.genres
    assert "Thriller" in normalized.genres
    assert normalized.poster_url is not None
    assert "image.tmdb.org" in normalized.poster_url
    assert len(normalized.credits) == 3
    assert normalized.credits[0].person_name == "Brad Pitt"
    assert normalized.credits[0].credit_type == CreditType.CAST
    assert normalized.credits[2].person_name == "David Fincher"
    assert normalized.credits[2].credit_type == CreditType.CREW


def test_tmdb_normalize_tv():
    adapter = TMDBAdapter(api_key="test_key")
    normalized = adapter.normalize(SAMPLE_TMDB_TV_DETAIL)

    assert normalized.provider == "tmdb"
    assert normalized.external_id == "1399"
    assert normalized.media_type == MediaType.TV_SHOW
    assert normalized.title == "Game of Thrones"
    assert normalized.release_date == date(2011, 4, 17)
    assert normalized.end_date == date(2019, 5, 19)
    assert normalized.status == MediaStatus.COMPLETED
    assert len(normalized.seasons) == 1
    assert normalized.seasons[0].season_number == 1
    assert normalized.seasons[0].episode_count == 10
    assert len(normalized.titles) >= 2  # Primary + Spanish alternate
