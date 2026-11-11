import asyncio
import uuid
from datetime import date, datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine
from backend.app.core.config import settings
from backend.app.core.database import AsyncSessionLocal, engine
from backend.app.core.security import hash_password
from backend.app.ingestion.pipeline import IngestionPipeline
from backend.app.models.base import Base
from backend.app.models.credit import Credit
from backend.app.models.enums import CreditType, MediaStatus, MediaType, UserRole
from backend.app.models.external_id import ExternalID
from backend.app.models.media import Media
from backend.app.models.user import User
from backend.app.providers.anilist import AniListAdapter
from backend.app.schemas.normalized import (
    NormalizedCreditDTO,
    NormalizedEpisodeDTO,
    NormalizedMediaDTO,
    NormalizedSeasonDTO,
    NormalizedTitleDTO,
)


async def init_tables():
    print("-> Ensuring database tables exist...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✓ Tables verified.")


async def seed_curated_media():
    print("-> Seeding extensive catalogue of popular & blockbuster movies with TMDB IDs...")
    movies_data = [
        {
            "tmdb_id": "693134",
            "title": "Dune: Part Two",
            "original_title": "Dune: Part Two",
            "overview": "Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a path of revenge against the conspirators who destroyed his family.",
            "release_date": date(2024, 2, 27),
            "runtime": 166,
            "vote_average": 8.2,
            "vote_count": 5200,
            "popularity": 250.5,
            "poster_url": "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
            "backdrop_url": "https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5200bm.jpg",
            "genres": ["Science Fiction", "Adventure"],
            "credits": [
                {"name": "Denis Villeneuve", "type": CreditType.CREW, "job": "Director", "dept": "Directing"},
                {"name": "Timothée Chalamet", "type": CreditType.CAST, "char": "Paul Atreides", "order": 0},
                {"name": "Zendaya", "type": CreditType.CAST, "char": "Chani", "order": 1},
            ],
        },
        {
            "tmdb_id": "157336",
            "title": "Interstellar",
            "original_title": "Interstellar",
            "overview": "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.",
            "release_date": date(2014, 11, 5),
            "runtime": 169,
            "vote_average": 8.4,
            "vote_count": 35000,
            "popularity": 210.2,
            "poster_url": "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
            "backdrop_url": "https://image.tmdb.org/t/p/original/rAiYTsqBkRefBXweC25CeAZOqMn.jpg",
            "genres": ["Science Fiction", "Drama", "Adventure"],
            "credits": [
                {"name": "Christopher Nolan", "type": CreditType.CREW, "job": "Director", "dept": "Directing"},
                {"name": "Matthew McConaughey", "type": CreditType.CAST, "char": "Cooper", "order": 0},
                {"name": "Anne Hathaway", "type": CreditType.CAST, "char": "Brand", "order": 1},
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
            "popularity": 195.8,
            "poster_url": "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
            "backdrop_url": "https://image.tmdb.org/t/p/original/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg",
            "genres": ["Action", "Science Fiction", "Adventure"],
            "credits": [
                {"name": "Christopher Nolan", "type": CreditType.CREW, "job": "Director", "dept": "Directing"},
                {"name": "Leonardo DiCaprio", "type": CreditType.CAST, "char": "Dom Cobb", "order": 0},
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
            "popularity": 180.4,
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
            "popularity": 175.0,
            "poster_url": "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
            "backdrop_url": "https://image.tmdb.org/t/p/original/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg",
            "genres": ["Drama", "History"],
            "credits": [
                {"name": "Christopher Nolan", "type": CreditType.CREW, "job": "Director", "dept": "Directing"},
                {"name": "Cillian Murphy", "type": CreditType.CAST, "char": "J. Robert Oppenheimer", "order": 0},
            ],
        },
        {
            "tmdb_id": "299534",
            "title": "Avengers: Endgame",
            "original_title": "Avengers: Endgame",
            "overview": "After the devastating events of Avengers: Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more in order to reverse Thanos' actions.",
            "release_date": date(2019, 4, 24),
            "runtime": 181,
            "vote_average": 8.26,
            "vote_count": 24500,
            "popularity": 190.0,
            "poster_url": "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
            "backdrop_url": "https://image.tmdb.org/t/p/original/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg",
            "genres": ["Action", "Adventure", "Science Fiction"],
            "credits": [
                {"name": "Robert Downey Jr.", "type": CreditType.CAST, "char": "Tony Stark / Iron Man", "order": 0},
                {"name": "Chris Evans", "type": CreditType.CAST, "char": "Steve Rogers / Captain America", "order": 1},
            ],
        },
        {
            "tmdb_id": "533535",
            "title": "Deadpool & Wolverine",
            "original_title": "Deadpool & Wolverine",
            "overview": "A listless Wade Wilson toils away in civilian life with his days as the morally flexible mercenary, Deadpool, behind him. But when his homeworld faces an existential threat, Wade must reluctantly suit-up again with an even more reluctant Wolverine.",
            "release_date": date(2024, 7, 24),
            "runtime": 128,
            "vote_average": 7.7,
            "vote_count": 4800,
            "popularity": 230.0,
            "poster_url": "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
            "backdrop_url": "https://image.tmdb.org/t/p/original/yDHYTfA3R0jFYba16jBB1ef8oIt.jpg",
            "genres": ["Action", "Comedy", "Science Fiction"],
            "credits": [
                {"name": "Ryan Reynolds", "type": CreditType.CAST, "char": "Wade Wilson / Deadpool", "order": 0},
                {"name": "Hugh Jackman", "type": CreditType.CAST, "char": "Logan / Wolverine", "order": 1},
            ],
        },
        {
            "tmdb_id": "569094",
            "title": "Spider-Man: Across the Spider-Verse",
            "original_title": "Spider-Man: Across the Spider-Verse",
            "overview": "After reuniting with Gwen Stacy, Brooklyn's full-time, friendly neighborhood Spider-Man is catapulted across the Multiverse, where he encounters the Spider-Society.",
            "release_date": date(2023, 5, 31),
            "runtime": 140,
            "vote_average": 8.35,
            "vote_count": 6800,
            "popularity": 160.0,
            "poster_url": "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
            "backdrop_url": "https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg",
            "genres": ["Animation", "Action", "Adventure", "Science Fiction"],
            "credits": [
                {"name": "Shameik Moore", "type": CreditType.CAST, "char": "Miles Morales", "order": 0},
                {"name": "Hailee Steinfeld", "type": CreditType.CAST, "char": "Gwen Stacy", "order": 1},
            ],
        },
        {
            "tmdb_id": "603",
            "title": "The Matrix",
            "original_title": "The Matrix",
            "overview": "Set in the 22nd century, The Matrix tells the story of a computer hacker who joins a group of underground insurgents fighting the vast and powerful computers who now rule the earth.",
            "release_date": date(1999, 3, 30),
            "runtime": 136,
            "vote_average": 8.21,
            "vote_count": 25000,
            "popularity": 140.0,
            "poster_url": "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
            "backdrop_url": "https://image.tmdb.org/t/p/original/l4QHerTSbMI7qgahrSkzxAzPXxL.jpg",
            "genres": ["Action", "Science Fiction"],
            "credits": [
                {"name": "Keanu Reeves", "type": CreditType.CAST, "char": "Neo", "order": 0},
                {"name": "Laurence Fishburne", "type": CreditType.CAST, "char": "Morpheus", "order": 1},
            ],
        },
        {
            "tmdb_id": "550",
            "title": "Fight Club",
            "original_title": "Fight Club",
            "overview": "A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.",
            "release_date": date(1999, 10, 15),
            "runtime": 139,
            "vote_average": 8.44,
            "vote_count": 28000,
            "popularity": 135.0,
            "poster_url": "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
            "backdrop_url": "https://image.tmdb.org/t/p/original/hZkgoQYus5vegHoetLkCJzb17zJ.jpg",
            "genres": ["Drama"],
            "credits": [
                {"name": "Brad Pitt", "type": CreditType.CAST, "char": "Tyler Durden", "order": 0},
                {"name": "Edward Norton", "type": CreditType.CAST, "char": "The Narrator", "order": 1},
            ],
        },
        {
            "tmdb_id": "278",
            "title": "The Shawshank Redemption",
            "original_title": "The Shawshank Redemption",
            "overview": "Framed in the 1940s for the double murder of his wife and her lover, upstanding banker Andy Dufresne begins a new life at the Shawshank prison.",
            "release_date": date(1994, 9, 23),
            "runtime": 142,
            "vote_average": 8.71,
            "vote_count": 27000,
            "popularity": 165.0,
            "poster_url": "https://image.tmdb.org/t/p/w500/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg",
            "backdrop_url": "https://image.tmdb.org/t/p/original/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg",
            "genres": ["Drama", "Crime"],
            "credits": [
                {"name": "Tim Robbins", "type": CreditType.CAST, "char": "Andy Dufresne", "order": 0},
                {"name": "Morgan Freeman", "type": CreditType.CAST, "char": "Ellis Boyd 'Red' Redding", "order": 1},
            ],
        },
        {
            "tmdb_id": "680",
            "title": "Pulp Fiction",
            "original_title": "Pulp Fiction",
            "overview": "A burger-loving hit man, his philosophical partner, a drug-addled gangster's moll and a washed-up boxer converge in this sprawling, comedic crime caper.",
            "release_date": date(1994, 9, 10),
            "runtime": 154,
            "vote_average": 8.49,
            "vote_count": 27500,
            "popularity": 155.0,
            "poster_url": "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
            "backdrop_url": "https://image.tmdb.org/t/p/original/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg",
            "genres": ["Thriller", "Crime"],
            "credits": [
                {"name": "John Travolta", "type": CreditType.CAST, "char": "Vincent Vega", "order": 0},
                {"name": "Samuel L. Jackson", "type": CreditType.CAST, "char": "Jules Winnfield", "order": 1},
            ],
        },
        {
            "tmdb_id": "945961",
            "title": "Alien: Romulus",
            "original_title": "Alien: Romulus",
            "overview": "While scavenging the deep ends of a derelict space station, a group of young space colonizers come face to face with the most terrifying life form in the universe.",
            "release_date": date(2024, 8, 13),
            "runtime": 119,
            "vote_average": 7.3,
            "vote_count": 2400,
            "popularity": 220.0,
            "poster_url": "https://image.tmdb.org/t/p/w500/b33nnKl1GSFbao4l3fZDDqsMx0F.jpg",
            "backdrop_url": "https://image.tmdb.org/t/p/original/9SSEUrSqhljBMzRe4aBTh17rUaC.jpg",
            "genres": ["Horror", "Science Fiction"],
            "credits": [
                {"name": "Cailee Spaeny", "type": CreditType.CAST, "char": "Rain Carradine", "order": 0},
            ],
        },
        {
            "tmdb_id": "361743",
            "title": "Top Gun: Maverick",
            "original_title": "Top Gun: Maverick",
            "overview": "After thirty years, Maverick is still pushing the envelope as a top naval aviator, but must confront ghosts of his past when he leads TOP GUN's elite graduates on an impossible mission.",
            "release_date": date(2022, 5, 24),
            "runtime": 131,
            "vote_average": 8.22,
            "vote_count": 8700,
            "popularity": 145.0,
            "poster_url": "https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg",
            "backdrop_url": "https://image.tmdb.org/t/p/original/AaV1YIdWKnjAiaOe0UUK23LRIqY.jpg",
            "genres": ["Action", "Drama"],
            "credits": [
                {"name": "Tom Cruise", "type": CreditType.CAST, "char": "Pete 'Maverick' Mitchell", "order": 0},
            ],
        },
        {
            "tmdb_id": "414906",
            "title": "The Batman",
            "original_title": "The Batman",
            "overview": "In his second year of fighting crime, Batman uncovers corruption in Gotham City that connects to his own family while facing a serial killer known as the Riddler.",
            "release_date": date(2022, 3, 1),
            "runtime": 176,
            "vote_average": 7.68,
            "vote_count": 9400,
            "popularity": 150.0,
            "poster_url": "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg",
            "backdrop_url": "https://image.tmdb.org/t/p/original/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg",
            "genres": ["Crime", "Mystery", "Thriller"],
            "credits": [
                {"name": "Robert Pattinson", "type": CreditType.CAST, "char": "Bruce Wayne / Batman", "order": 0},
                {"name": "Zoë Kravitz", "type": CreditType.CAST, "char": "Selina Kyle / Catwoman", "order": 1},
            ],
        },
        {
            "tmdb_id": "603692",
            "title": "John Wick: Chapter 4",
            "original_title": "John Wick: Chapter 4",
            "overview": "With the price on his head ever increasing, John Wick uncovers a path to defeating The High Table.",
            "release_date": date(2023, 3, 22),
            "runtime": 169,
            "vote_average": 7.74,
            "vote_count": 6200,
            "popularity": 140.0,
            "poster_url": "https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg",
            "backdrop_url": "https://image.tmdb.org/t/p/original/h8gHn0OzBoaefW0YNXQ7TwaMi1.jpg",
            "genres": ["Action", "Thriller", "Crime"],
            "credits": [
                {"name": "Keanu Reeves", "type": CreditType.CAST, "char": "John Wick", "order": 0},
            ],
        },
    ]

    # Upcoming Movies
    upcoming_movies = [
        {
            "tmdb_id": "83533",
            "title": "Avatar: Fire and Ash",
            "original_title": "Avatar: Fire and Ash",
            "overview": "The third chapter in James Cameron's Avatar saga, introducing the Ash People, an aggressive Na'vi tribe centered around fire.",
            "release_date": date(2025, 12, 19),
            "runtime": 190,
            "vote_average": 8.0,
            "vote_count": 120,
            "popularity": 190.0,
            "poster_url": "https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg",
            "backdrop_url": "https://image.tmdb.org/t/p/original/8rpDcsfLJypbO6vREc0547VKqEv.jpg",
            "genres": ["Science Fiction", "Adventure", "Action"],
            "status": MediaStatus.UPCOMING,
        },
        {
            "tmdb_id": "1003596",
            "title": "Avengers: Doomsday",
            "original_title": "Avengers: Doomsday",
            "overview": "The Avengers reunite to face the formidable Victor Von Doom across the multiverse.",
            "release_date": date(2026, 5, 1),
            "runtime": 160,
            "vote_average": 8.2,
            "vote_count": 90,
            "popularity": 200.0,
            "poster_url": "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
            "backdrop_url": "https://image.tmdb.org/t/p/original/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg",
            "genres": ["Action", "Science Fiction"],
            "status": MediaStatus.UPCOMING,
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
        {
            "tmdb_id": "100088",
            "title": "The Last of Us",
            "original_title": "The Last of Us",
            "overview": "Twenty years after modern civilization has been destroyed, Joel, a hardened survivor, is hired to smuggle Ellie, a 14-year-old girl, out of an oppressive quarantine zone.",
            "release_date": date(2023, 1, 15),
            "vote_average": 8.6,
            "vote_count": 5100,
            "popularity": 150.0,
            "poster_url": "https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2V7JMrRI.jpg",
            "backdrop_url": "https://image.tmdb.org/t/p/original/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg",
            "genres": ["Drama", "Action & Adventure", "Sci-Fi & Fantasy"],
            "seasons": [
                {
                    "season_number": 1,
                    "title": "Season 1",
                    "episodes": [
                        {"episode_number": 1, "title": "When You're Lost in the Darkness", "overview": "Twenty years after a fungal outbreak ravages the planet, survivors Joel and Tess are tasked with a mission that could change everything."},
                        {"episode_number": 2, "title": "Infected", "overview": "Leaving the quarantine zone behind, Joel, Tess, and Ellie travel through a deserted and flooded Boston."},
                    ],
                },
            ],
            "credits": [
                {"name": "Pedro Pascal", "type": CreditType.CAST, "char": "Joel Miller", "order": 0},
                {"name": "Bella Ramsey", "type": CreditType.CAST, "char": "Ellie Williams", "order": 1},
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
                for c in m.get("credits", [])
            ],
        )
        dtos.append(dto)

    for u in upcoming_movies:
        dto = NormalizedMediaDTO(
            provider="tmdb",
            external_id=u["tmdb_id"],
            media_type=MediaType.MOVIE,
            title=u["title"],
            original_title=u["original_title"],
            overview=u["overview"],
            release_date=u["release_date"],
            runtime=u.get("runtime"),
            vote_average=u["vote_average"],
            vote_count=u["vote_count"],
            popularity=u["popularity"],
            poster_url=u["poster_url"],
            backdrop_url=u["backdrop_url"],
            status=u.get("status", MediaStatus.UPCOMING),
            genres=u["genres"],
            titles=[NormalizedTitleDTO(title=u["title"], title_type="primary", is_primary=True)],
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


async def map_anime_tmdb_ids():
    print("-> Mapping popular anime to TMDB IDs for seamless playback...")
    anime_tmdb_map = {
        "ONE PIECE": "37854",
        "Bleach": "30984",
        "Cyberpunk: Edgerunners": "105248",
        "Black Clover": "73223",
        "The Apothecary Diaries": "220645",
        "Jujutsu Kaisen": "95479",
        "Attack on Titan": "1429",
    }
    async with AsyncSessionLocal() as session:
        for title, tmdb_id in anime_tmdb_map.items():
            stmt = select(Media).where(Media.title.ilike(f"%{title}%"))
            res = await session.execute(stmt)
            media = res.scalars().first()
            if media:
                # Check if TMDB external id already exists
                check_stmt = select(ExternalID).where(
                    ExternalID.media_id == media.id,
                    ExternalID.provider == "tmdb",
                )
                c_res = await session.execute(check_stmt)
                if not c_res.scalar_one_or_none():
                    ext = ExternalID(
                        media_id=media.id,
                        provider="tmdb",
                        external_id=tmdb_id,
                    )
                    session.add(ext)
                    print(f"   + Mapped {media.title} to TMDB ID {tmdb_id}")
        await session.commit()
    print("✓ Anime TMDB provider mappings completed.")


async def ingest_live_anime():
    print("-> Fetching live trending anime from AniList GraphQL API...")
    try:
        adapter = AniListAdapter()
        raw_items = await adapter.get_trending()
        dtos = []
        for item in raw_items[:15]:
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
        print(f"   [!] Live AniList fetch failed: {exc}")


async def seed_users_and_watchlists():
    print("-> Verifying default admin and demo user accounts...")
    async with AsyncSessionLocal() as session:
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
            print("✓ Accounts created.")


async def main():
    print("\n==================================================")
    print(" Cineverse Full-Catalogue Ingestion & Seeding")
    print("==================================================")
    await init_tables()
    await seed_curated_media()
    await ingest_live_anime()
    await map_anime_tmdb_ids()
    await seed_users_and_watchlists()
    print("==================================================")
    print("✓ All movies, TV shows, and anime successfully ingested!")
    print("==================================================\n")


if __name__ == "__main__":
    asyncio.run(main())
