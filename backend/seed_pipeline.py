import asyncio
import uuid
from datetime import date, datetime, timezone
from sqlalchemy.ext.asyncio import create_async_engine
from backend.app.core.config import settings
from backend.app.core.database import AsyncSessionLocal, engine
from backend.app.core.security import hash_password
from backend.app.ingestion.pipeline import IngestionPipeline
from backend.app.models.base import Base
from backend.app.models.credit import Credit
from backend.app.models.enums import CreditType, MediaStatus, MediaType, UserRole, ViewingStatus
from backend.app.models.episode import Episode
from backend.app.models.external_id import ExternalID
from backend.app.models.genre import Genre
from backend.app.models.media import Media
from backend.app.models.person import Person
from backend.app.models.progress import UserEpisodeProgress, UserMediaProgress
from backend.app.models.season import Season
from backend.app.models.title import MediaTitle
from backend.app.models.user import User
from backend.app.models.watchlist import Watchlist, WatchlistItem
from backend.app.providers.anilist import AniListAdapter
from backend.app.schemas.normalized import (
    NormalizedCreditDTO,
    NormalizedEpisodeDTO,
    NormalizedMediaDTO,
    NormalizedSeasonDTO,
    NormalizedTitleDTO,
)


async def init_tables():
    print("-> Creating database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✓ Tables created successfully.")


async def ingest_live_anime():
    print("-> Fetching live trending anime from AniList GraphQL API...")
    try:
        adapter = AniListAdapter()
        raw_items = await adapter.get_trending()
        dtos = []
        for item in raw_items[:12]:
            try:
                dto = adapter.normalize(item)
                dtos.append(dto)
            except Exception as e:
                print(f"   [!] Failed to normalize item: {e}")

        async with AsyncSessionLocal() as session:
            pipeline = IngestionPipeline(session)
            run = await pipeline.ingest_batch(
                provider="anilist",
                job_type="trending",
                dtos=dtos,
            )
            print(f"✓ AniList Ingestion Run [{run.id}]: {run.records_created} created, {run.records_updated} updated.")
    except Exception as exc:
        print(f"   [!] Live AniList fetch failed (proceeding with fallback): {exc}")


async def seed_curated_media():
    print("-> Seeding curated movies and TV shows with real TMDB IDs for streaming...")
    movies_data = [
        {
            "tmdb_id": "157336",
            "title": "Interstellar",
            "original_title": "Interstellar",
            "overview": "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.",
            "release_date": date(2014, 11, 5),
            "runtime": 169,
            "vote_average": 8.4,
            "vote_count": 35000,
            "popularity": 145.2,
            "poster_url": "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
            "backdrop_url": "https://image.tmdb.org/t/p/original/rAiYTsqBkRefBXweC25CeAZOqMn.jpg",
            "genres": ["Science Fiction", "Drama", "Adventure"],
            "credits": [
                {"name": "Christopher Nolan", "type": CreditType.CREW, "job": "Director", "dept": "Directing"},
                {"name": "Matthew McConaughey", "type": CreditType.CAST, "char": "Cooper", "order": 0},
                {"name": "Anne Hathaway", "type": CreditType.CAST, "char": "Brand", "order": 1},
                {"name": "Jessica Chastain", "type": CreditType.CAST, "char": "Murph", "order": 2},
            ],
        },
        {
            "tmdb_id": "27205",
            "title": "Inception",
            "original_title": "Inception",
            "overview": "Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life as payment for a task considered to be impossible: \"inception\".",
            "release_date": date(2010, 7, 15),
            "runtime": 148,
            "vote_average": 8.36,
            "vote_count": 36000,
            "popularity": 132.8,
            "poster_url": "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
            "backdrop_url": "https://image.tmdb.org/t/p/original/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg",
            "genres": ["Action", "Science Fiction", "Adventure"],
            "credits": [
                {"name": "Christopher Nolan", "type": CreditType.CREW, "job": "Director", "dept": "Directing"},
                {"name": "Leonardo DiCaprio", "type": CreditType.CAST, "char": "Dom Cobb", "order": 0},
                {"name": "Joseph Gordon-Levitt", "type": CreditType.CAST, "char": "Arthur", "order": 1},
                {"name": "Elliot Page", "type": CreditType.CAST, "char": "Ariadne", "order": 2},
            ],
        },
        {
            "tmdb_id": "693134",
            "title": "Dune: Part Two",
            "original_title": "Dune: Part Two",
            "overview": "Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a path of revenge against the conspirators who destroyed his family.",
            "release_date": date(2024, 2, 27),
            "runtime": 166,
            "vote_average": 8.2,
            "vote_count": 5200,
            "popularity": 210.5,
            "poster_url": "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
            "backdrop_url": "https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5200bm.jpg",
            "genres": ["Science Fiction", "Adventure"],
            "credits": [
                {"name": "Denis Villeneuve", "type": CreditType.CREW, "job": "Director", "dept": "Directing"},
                {"name": "Timothée Chalamet", "type": CreditType.CAST, "char": "Paul Atreides", "order": 0},
                {"name": "Zendaya", "type": CreditType.CAST, "char": "Chani", "order": 1},
                {"name": "Rebecca Ferguson", "type": CreditType.CAST, "char": "Lady Jessica", "order": 2},
            ],
        },
        {
            "tmdb_id": "155",
            "title": "The Dark Knight",
            "original_title": "The Dark Knight",
            "overview": "Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the streets.",
            "release_date": date(2008, 7, 16),
            "runtime": 152,
            "vote_average": 8.51,
            "vote_count": 32000,
            "popularity": 120.4,
            "poster_url": "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
            "backdrop_url": "https://image.tmdb.org/t/p/original/dqK9Hag1054tghRQSqLSfrkvQnA.jpg",
            "genres": ["Drama", "Action", "Crime", "Thriller"],
            "credits": [
                {"name": "Christopher Nolan", "type": CreditType.CREW, "job": "Director", "dept": "Directing"},
                {"name": "Christian Bale", "type": CreditType.CAST, "char": "Bruce Wayne / Batman", "order": 0},
                {"name": "Heath Ledger", "type": CreditType.CAST, "char": "Joker", "order": 1},
            ],
        },
        {
            "tmdb_id": "872585",
            "title": "Oppenheimer",
            "original_title": "Oppenheimer",
            "overview": "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II.",
            "release_date": date(2023, 7, 19),
            "runtime": 180,
            "vote_average": 8.1,
            "vote_count": 8900,
            "popularity": 115.0,
            "poster_url": "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
            "backdrop_url": "https://image.tmdb.org/t/p/original/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg",
            "genres": ["Drama", "History"],
            "credits": [
                {"name": "Christopher Nolan", "type": CreditType.CREW, "job": "Director", "dept": "Directing"},
                {"name": "Cillian Murphy", "type": CreditType.CAST, "char": "J. Robert Oppenheimer", "order": 0},
                {"name": "Emily Blunt", "type": CreditType.CAST, "char": "Katherine Oppenheimer", "order": 1},
            ],
        },
    ]

    tv_shows_data = [
        {
            "tmdb_id": "1396",
            "title": "Breaking Bad",
            "original_title": "Breaking Bad",
            "overview": "Walter White, a New Mexico chemistry teacher, is diagnosed with Stage III cancer and given a prognosis of two years left to live. He enters the dangerous world of drugs and crime to ensure his family's financial future.",
            "release_date": date(2008, 1, 20),
            "vote_average": 8.9,
            "vote_count": 14000,
            "popularity": 190.0,
            "poster_url": "https://image.tmdb.org/t/p/w500/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg",
            "backdrop_url": "https://image.tmdb.org/t/p/original/9faGSFi5jam6pDWGNd0p8J2vPt5.jpg",
            "genres": ["Drama", "Crime"],
            "seasons": [
                {
                    "season_number": 1,
                    "title": "Season 1",
                    "episodes": [
                        {"episode_number": 1, "title": "Pilot", "overview": "A chemistry teacher discovers he has terminal cancer and begins cooking crystal meth."},
                        {"episode_number": 2, "title": "Cat's in the Bag...", "overview": "Walt and Jesse attempt to dispose of two bodies."},
                        {"episode_number": 3, "title": "...And the Bag's in the River", "overview": "Walt struggles with a moral dilemma involving Krazy-8."},
                    ],
                },
                {
                    "season_number": 2,
                    "title": "Season 2",
                    "episodes": [
                        {"episode_number": 1, "title": "Seven Thirty-Seven", "overview": "Walt and Jesse realize how dire their situation is with Tuco."},
                        {"episode_number": 2, "title": "Grilled", "overview": "Walt and Jesse are held captive by an unhinged Tuco."},
                    ],
                },
            ],
            "credits": [
                {"name": "Bryan Cranston", "type": CreditType.CAST, "char": "Walter White", "order": 0},
                {"name": "Aaron Paul", "type": CreditType.CAST, "char": "Jesse Pinkman", "order": 1},
            ],
        },
        {
            "tmdb_id": "66732",
            "title": "Stranger Things",
            "original_title": "Stranger Things",
            "overview": "When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.",
            "release_date": date(2016, 7, 15),
            "vote_average": 8.6,
            "vote_count": 17000,
            "popularity": 165.0,
            "poster_url": "https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
            "backdrop_url": "https://image.tmdb.org/t/p/original/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",
            "genres": ["Sci-Fi & Fantasy", "Drama", "Mystery"],
            "seasons": [
                {
                    "season_number": 1,
                    "title": "Season 1",
                    "episodes": [
                        {"episode_number": 1, "title": "Chapter One: The Vanishing of Will Byers", "overview": "On his way home from a friend's house, young Will sees something terrifying."},
                        {"episode_number": 2, "title": "Chapter Two: The Weirdo on Maple Street", "overview": "Lucas, Mike and Dustin try to talk to the girl they found in the woods."},
                    ],
                },
            ],
            "credits": [
                {"name": "Millie Bobby Brown", "type": CreditType.CAST, "char": "Eleven", "order": 0},
                {"name": "Finn Wolfhard", "type": CreditType.CAST, "char": "Mike Wheeler", "order": 1},
            ],
        },
    ]

    dtos = []
    for m in movies_data:
        dto = NormalizedMediaDTO(
            provider="tmdb",
            external_id=m["tmdb_id"],
            media_type=MediaType.MOVIE,
            title=m["title"],
            original_title=m["original_title"],
            overview=m["overview"],
            release_date=m["release_date"],
            runtime=m.get("runtime"),
            vote_average=m["vote_average"],
            vote_count=m["vote_count"],
            popularity=m["popularity"],
            poster_url=m["poster_url"],
            backdrop_url=m["backdrop_url"],
            status=MediaStatus.RELEASED,
            genres=m["genres"],
            titles=[NormalizedTitleDTO(title=m["title"], title_type="primary", is_primary=True)],
            credits=[
                NormalizedCreditDTO(
                    person_name=c["name"],
                    credit_type=c["type"],
                    character_name=c.get("char"),
                    job=c.get("job"),
                    department=c.get("dept"),
                    order=c.get("order", 0),
                )
                for c in m["credits"]
            ],
        )
        dtos.append(dto)

    for tv in tv_shows_data:
        seasons_dtos = []
        for s in tv.get("seasons", []):
            ep_dtos = [
                NormalizedEpisodeDTO(
                    episode_number=ep["episode_number"],
                    title=ep["title"],
                    overview=ep["overview"],
                )
                for ep in s.get("episodes", [])
            ]
            seasons_dtos.append(
                NormalizedSeasonDTO(
                    season_number=s["season_number"],
                    title=s["title"],
                    episode_count=len(ep_dtos),
                    episodes=ep_dtos,
                )
            )

        dto = NormalizedMediaDTO(
            provider="tmdb",
            external_id=tv["tmdb_id"],
            media_type=MediaType.TV_SHOW,
            title=tv["title"],
            original_title=tv["original_title"],
            overview=tv["overview"],
            release_date=tv["release_date"],
            vote_average=tv["vote_average"],
            vote_count=tv["vote_count"],
            popularity=tv["popularity"],
            poster_url=tv["poster_url"],
            backdrop_url=tv["backdrop_url"],
            status=MediaStatus.RELEASED,
            genres=tv["genres"],
            titles=[NormalizedTitleDTO(title=tv["title"], title_type="primary", is_primary=True)],
            seasons=seasons_dtos,
            credits=[
                NormalizedCreditDTO(
                    person_name=c["name"],
                    credit_type=c["type"],
                    character_name=c.get("char"),
                    job=c.get("job"),
                    order=c.get("order", 0),
                )
                for c in tv["credits"]
            ],
        )
        dtos.append(dto)

    async with AsyncSessionLocal() as session:
        pipeline = IngestionPipeline(session)
        run = await pipeline.ingest_batch(
            provider="tmdb",
            job_type="curated_seed",
            dtos=dtos,
        )
        print(f"✓ TMDB Curated Ingestion Run [{run.id}]: {run.records_created} created, {run.records_updated} updated.")


async def seed_users_and_watchlists():
    print("-> Seeding default admin and demo user accounts...")
    async with AsyncSessionLocal() as session:
        from sqlalchemy import select
        res = await session.execute(select(User).where(User.email == "admin@cineverse.com"))
        if not res.scalar_one_or_none():
            admin = User(
                username="admin",
                email="admin@cineverse.com",
                hashed_password=hash_password("admin123"),
                role=UserRole.ADMIN,
                is_active=True,
            )
            demo = User(
                username="demouser",
                email="demo@cineverse.com",
                hashed_password=hash_password("demo123"),
                role=UserRole.USER,
                is_active=True,
            )
            session.add_all([admin, demo])
            await session.commit()
            print("✓ Admin created: admin@cineverse.com / admin123")
            print("✓ Demo user created: demo@cineverse.com / demo123")


async def main():
    print("\n==================================================")
    print(" Cineverse End-to-End Pipeline Initializer")
    print("==================================================")
    await init_tables()
    await seed_curated_media()
    await ingest_live_anime()
    await seed_users_and_watchlists()
    print("==================================================")
    print("✓ Pipeline successfully initialized and seeded!")
    print("==================================================\n")


if __name__ == "__main__":
    asyncio.run(main())

