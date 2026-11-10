from datetime import date
from backend.app.models.enums import CreditType, MediaStatus, MediaType
from backend.app.providers.anilist import AniListAdapter
from backend.tests.fixtures.anilist_fixtures import SAMPLE_ANILIST_MEDIA


def test_anilist_normalize_anime():
    adapter = AniListAdapter()
    normalized = adapter.normalize(SAMPLE_ANILIST_MEDIA)

    assert normalized.provider == "anilist"
    assert normalized.external_id == "16498"
    assert normalized.media_type == MediaType.ANIME
    assert normalized.title == "Attack on Titan"
    assert normalized.original_title == "進撃の巨人"
    assert normalized.release_date == date(2013, 4, 7)
    assert normalized.end_date == date(2013, 9, 29)
    assert normalized.status == MediaStatus.COMPLETED
    assert normalized.vote_average == 8.4  # 84/10.0
    assert "Action" in normalized.genres
    assert "Fantasy" in normalized.genres
    assert "WIT Studio" in normalized.raw_metadata["studios"]
    assert normalized.poster_url is not None
    assert "anilistcdn" in normalized.poster_url

    # Check title variants: English, Romaji, Native, Synonyms
    title_texts = [t.title for t in normalized.titles]
    assert "Attack on Titan" in title_texts
    assert "Shingeki no Kyojin" in title_texts
    assert "進撃の巨人" in title_texts
    assert "AoT" in title_texts

    # Check credits
    assert len(normalized.credits) == 2
    va = normalized.credits[0]
    assert va.person_name == "Yuki Kaji"
    assert va.character_name == "Eren Yeager"
    assert va.credit_type == CreditType.CAST

    director = normalized.credits[1]
    assert director.person_name == "Tetsuro Araki"
    assert director.job == "Director"
    assert director.credit_type == CreditType.CREW
