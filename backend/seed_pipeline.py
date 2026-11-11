import asyncio
import uuid
from datetime import date, datetime, timezone
from typing import Any, Dict, List
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
from backend.seed_catalogue_data import MOVIES_DATA, TV_SHOWS_DATA


async def init_tables():
    print("-> Ensuring database tables exist...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✓ Tables verified.")


async def seed_curated_media():
    print(f"-> Seeding curated catalogue of {len(MOVIES_DATA)} blockbuster movies and {len(TV_SHOWS_DATA)} top TV series...")
    dtos: List[NormalizedMediaDTO] = []

    # Movies
    for m in MOVIES_DATA:
        credits_dtos = [
            NormalizedCreditDTO(
                person_name=c["name"],
                credit_type=c["type"],
                character_name=c.get("char"),
                job=c.get("job"),
                department=c.get("dept"),
                order=c.get("order", idx),
            )
            for idx, c in enumerate(m.get("credits", []))
        ]

        dto = NormalizedMediaDTO(
            provider="tmdb",
            external_id=str(m["tmdb_id"]),
            media_type=MediaType.MOVIE,
            title=m["title"],
            original_title=m.get("original_title", m["title"]),
            overview=m.get("overview"),
            release_date=m.get("release_date"),
            runtime=m.get("runtime"),
            vote_average=m.get("vote_average", 8.0),
            vote_count=m.get("vote_count", 1000),
            popularity=m.get("popularity", 100.0),
            poster_url=m.get("poster_url"),
            backdrop_url=m.get("backdrop_url"),
            status=m.get("status", MediaStatus.RELEASED),
            genres=m.get("genres", []),
            titles=[NormalizedTitleDTO(title=m["title"], title_type="primary", is_primary=True)],
            credits=credits_dtos,
        )
        dtos.append(dto)

    # TV Shows
    for tv in TV_SHOWS_DATA:
        seasons_data = tv.get("seasons")
        if not seasons_data:
            # Generate default Season 1 with 3 episodes if not specified
            seasons_data = [
                {
                    "season_number": 1,
                    "title": "Season 1",
                    "episodes": [
                        {"episode_number": 1, "title": "Pilot", "overview": f"The journey begins for {tv['title']}."},
                        {"episode_number": 2, "title": "Episode 2", "overview": f"The story develops in {tv['title']}."},
                        {"episode_number": 3, "title": "Episode 3", "overview": f"Tension rises in {tv['title']}."},
                    ],
                }
            ]

        seasons_dtos = []
        for s in seasons_data:
            ep_dtos = [
                NormalizedEpisodeDTO(
                    episode_number=ep["episode_number"],
                    title=ep.get("title", f"Episode {ep['episode_number']}"),
                    overview=ep.get("overview", ""),
                )
                for ep in s.get("episodes", [])
            ]
            seasons_dtos.append(
                NormalizedSeasonDTO(
                    season_number=s["season_number"],
                    title=s.get("title", f"Season {s['season_number']}"),
                    episode_count=len(ep_dtos),
                    episodes=ep_dtos,
                )
            )

        credits_dtos = [
            NormalizedCreditDTO(
                person_name=c["name"],
                credit_type=c["type"],
                character_name=c.get("char"),
                job=c.get("job"),
                order=c.get("order", idx),
            )
            for idx, c in enumerate(tv.get("credits", []))
        ]

        dto = NormalizedMediaDTO(
            provider="tmdb",
            external_id=str(tv["tmdb_id"]),
            media_type=MediaType.TV_SHOW,
            title=tv["title"],
            original_title=tv.get("original_title", tv["title"]),
            overview=tv.get("overview"),
            release_date=tv.get("release_date"),
            vote_average=tv.get("vote_average", 8.2),
            vote_count=tv.get("vote_count", 2000),
            popularity=tv.get("popularity", 120.0),
            poster_url=tv.get("poster_url"),
            backdrop_url=tv.get("backdrop_url"),
            status=MediaStatus.RELEASED,
            genres=tv.get("genres", []),
            titles=[NormalizedTitleDTO(title=tv["title"], title_type="primary", is_primary=True)],
            seasons=seasons_dtos,
            credits=credits_dtos,
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


async def ingest_live_anime():
    print("-> Fetching live popular & trending anime from AniList GraphQL API (150+ titles)...")
    try:
        adapter = AniListAdapter()
        raw_items_dict: Dict[int, Any] = {}

        # Fetch 3 pages of popular anime (50 per page = 150 items)
        for page in range(1, 4):
            try:
                page_items = await adapter.get_popular(page=page, per_page=50)
                for item in page_items:
                    item_id = item.get("id")
                    if item_id and item_id not in raw_items_dict:
                        raw_items_dict[item_id] = item
                print(f"   + Fetched page {page} ({len(page_items)} anime)")
                await asyncio.sleep(0.3)
            except Exception as e:
                print(f"   [!] Failed to fetch popular page {page}: {e}")

        # Also fetch top trending anime
        try:
            trending_items = await adapter.get_trending()
            for item in trending_items:
                item_id = item.get("id")
                if item_id and item_id not in raw_items_dict:
                    raw_items_dict[item_id] = item
            print(f"   + Fetched trending anime ({len(trending_items)} anime)")
        except Exception as e:
            print(f"   [!] Failed to fetch trending: {e}")

        dtos = []
        for item in raw_items_dict.values():
            try:
                dto = adapter.normalize(item)
                dtos.append(dto)
            except Exception as e:
                pass

        print(f"-> Ingesting {len(dtos)} anime into Cineverse database...")
        async with AsyncSessionLocal() as session:
            pipeline = IngestionPipeline(session)
            run = await pipeline.ingest_batch(
                provider="anilist",
                job_type="popular_and_trending",
                dtos=dtos,
            )
            print(f"✓ AniList Ingestion Run [{run.id}]: {run.records_created} created, {run.records_updated} updated.")
    except Exception as exc:
        print(f"   [!] Live AniList fetch failed: {exc}")


async def map_anime_tmdb_ids():
    print("-> Mapping anime titles to TMDB IDs for seamless playback...")
    anime_tmdb_map = {
        "ONE PIECE": "37854",
        "Bleach": "30984",
        "Cyberpunk: Edgerunners": "105248",
        "Black Clover": "73223",
        "The Apothecary Diaries": "220645",
        "Jujutsu Kaisen": "95479",
        "Attack on Titan": "1429",
        "Shingeki no Kyojin": "1429",
        "Naruto": "31910",
        "Shippuden": "31910",
        "JoJo": "46116",
        "Steel Ball Run": "46116",
        "Overgeared": "280208",
        "Chitose": "265636",
        "Sato-san": "209502",
        "Student Council": "191656",
        "Cheat-Granting": "249821",
        "Nia Liston": "270830",
        "Love Potion": "268593",
        "Demon Slayer": "85937",
        "Kimetsu no Yaiba": "85937",
        "Solo Leveling": "127532",
        "Chainsaw Man": "114410",
        "Death Note": "13916",
        "Fullmetal Alchemist": "31911",
        "Hunter x Hunter": "46298",
        "Frieren": "209867",
        "My Hero Academia": "65930",
        "Boku no Hero": "65930",
        "One Punch Man": "63926",
        "Spy x Family": "120089",
        "Tokyo Ghoul": "61374",
        "Sword Art Online": "45782",
        "Overlord": "64196",
        "Mob Psycho 100": "67070",
        "Vinland Saga": "83236",
        "Dragon Ball": "12971",
        "Haikyu": "60863",
        "Blue Lock": "135251",
        "Kaiju": "207468",
        "Dandadan": "237478",
        "Steins;Gate": "42823",
        "Code Geass": "32168",
        "Cowboy Bebop": "4087",
        "Neon Genesis Evangelion": "890",
        "No Game No Life": "60938",
        "Re:Zero": "65942",
        "Kaguya-sama": "83095",
        "Spirited Away": "129",
        "Your Name": "372058",
        "Suzume": "916224",
        "Weathering With You": "568160",
        "A Silent Voice": "378064",
        "Princess Mononoke": "128",
        "Howl's Moving Castle": "4935",
        "Grave of the Fireflies": "12477",
        "Classroom of the Elite": "71383",
        "Dr. STONE": "86031",
        "Mushoku Tensei": "99581",
        "That Time I Got Reincarnated as a Slime": "82452",
        "The Eminence in Shadow": "118742",
        "Sousou no Frieren": "209867",
    }

    async with AsyncSessionLocal() as session:
        existing_tmdb_ids_res = await session.execute(
            select(ExternalID.external_id).where(ExternalID.provider == "tmdb")
        )
        used_tmdb_ids = set(str(eid) for eid in existing_tmdb_ids_res.scalars().all())
        mapped_media_ids = set()

        for title, tmdb_id in anime_tmdb_map.items():
            if str(tmdb_id) in used_tmdb_ids:
                continue
            stmt = select(Media).where(Media.title.ilike(f"%{title}%"))
            res = await session.execute(stmt)
            medias = res.scalars().all()
            for media in medias:
                if media.id in mapped_media_ids:
                    continue
                # Check if TMDB external id already exists for this media
                check_stmt = select(ExternalID).where(
                    (ExternalID.media_id == media.id) & (ExternalID.provider == "tmdb")
                )
                c_res = await session.execute(check_stmt)
                if not c_res.scalar_one_or_none():
                    ext = ExternalID(
                        media_id=media.id,
                        provider="tmdb",
                        external_id=str(tmdb_id),
                    )
                    session.add(ext)
                    mapped_media_ids.add(media.id)
                    used_tmdb_ids.add(str(tmdb_id))
                    print(f"   + Mapped {media.title} to TMDB ID {tmdb_id}")
                    break
        await session.commit()
    print("✓ Anime TMDB provider mappings completed.")


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
