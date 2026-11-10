import uuid
from datetime import date
from backend.app.models.enums import CreditType, MediaStatus, MediaType
from backend.app.models.genre import Genre, media_genres
from backend.app.models.media import Media
from backend.app.models.external_id import ExternalID
from backend.app.models.title import MediaTitle
from backend.app.models.season import Season
from backend.app.models.episode import Episode
from backend.app.models.person import Person
from backend.app.models.credit import Credit


def test_media_model_attributes():
    media_id = uuid.uuid4()
    item = Media(
        id=media_id,
        media_type=MediaType.MOVIE,
        title="Inception",
        original_title="Inception",
        overview="A thief who steals corporate secrets through the use of dream-sharing technology.",
        release_date=date(2010, 7, 16),
        status=MediaStatus.RELEASED,
        runtime=148,
        popularity=98.5,
        vote_average=8.8,
        vote_count=35000,
        raw_metadata={"budget": 160000000},
    )
    assert item.id == media_id
    assert item.media_type == MediaType.MOVIE
    assert item.title == "Inception"
    assert item.status == MediaStatus.RELEASED
    assert item.raw_metadata["budget"] == 160000000


def test_external_id_mapping():
    media_id = uuid.uuid4()
    ext = ExternalID(
        media_id=media_id,
        provider="tmdb",
        external_id="27205",
    )
    assert ext.provider == "tmdb"
    assert ext.external_id == "27205"
    assert ext.media_id == media_id


def test_media_title_variant():
    media_id = uuid.uuid4()
    title = MediaTitle(
        media_id=media_id,
        title="インセプション",
        title_type="native",
        language="ja",
        is_primary=False,
    )
    assert title.language == "ja"
    assert title.title_type == "native"
    assert not title.is_primary


def test_season_and_episode_hierarchy():
    media_id = uuid.uuid4()
    season_id = uuid.uuid4()
    episode_id = uuid.uuid4()

    season = Season(
        id=season_id,
        media_id=media_id,
        season_number=1,
        title="Season 1",
        episode_count=10,
    )
    episode = Episode(
        id=episode_id,
        season_id=season_id,
        media_id=media_id,
        episode_number=1,
        title="Pilot",
        runtime=45,
    )
    assert season.season_number == 1
    assert episode.episode_number == 1
    assert episode.season_id == season_id


def test_people_and_credits():
    person_id = uuid.uuid4()
    media_id = uuid.uuid4()

    actor = Person(
        id=person_id,
        name="Leonardo DiCaprio",
        gender=2,
    )
    credit = Credit(
        media_id=media_id,
        person_id=person_id,
        credit_type=CreditType.CAST,
        character_name="Dom Cobb",
        order=0,
    )
    assert actor.name == "Leonardo DiCaprio"
    assert credit.credit_type == CreditType.CAST
    assert credit.character_name == "Dom Cobb"
