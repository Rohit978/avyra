import argparse
import asyncio
import sys
from backend.app.core.database import AsyncSessionLocal
from backend.app.ingestion.pipeline import IngestionPipeline
from backend.app.providers.anilist import AniListAdapter
from backend.app.providers.tmdb import TMDBAdapter


async def run_import(provider: str, feed: str, limit: int = 20, page: int = 1):
    print(f"\n=======================================================")
    print(f" Cineverse Ingestion: [{provider.upper()}] Feed: {feed}")
    print(f" Page: {page} | Limit: {limit}")
    print(f"=======================================================\n")

    if provider == "tmdb":
        adapter = TMDBAdapter()
        if feed == "popular":
            raw_items = await adapter.get_popular(page=page)
        elif feed == "trending":
            raw_items = await adapter.get_trending()
        else:
            print(f"Unknown TMDB feed: {feed}")
            return
    elif provider == "anilist":
        adapter = AniListAdapter()
        if feed == "popular":
            raw_items = await adapter.get_popular(page=page, per_page=limit)
        elif feed == "trending":
            raw_items = await adapter.get_trending()
        else:
            print(f"Unknown AniList feed: {feed}")
            return
    else:
        print(f"Unknown provider: {provider}")
        return

    # Normalize items
    dtos = []
    for item in raw_items[:limit]:
        try:
            dto = adapter.normalize(item)
            dtos.append(dto)
        except Exception as exc:
            print(f"  [!] Failed to normalize item: {exc}")

    print(f"-> Normalized {len(dtos)} records. Executing transactional database upsert...")

    async with AsyncSessionLocal() as session:
        pipeline = IngestionPipeline(session)
        run = await pipeline.ingest_batch(
            provider=provider,
            job_type=feed,
            dtos=dtos,
        )

    print(f"\n✓ Ingestion Run Complete:")
    print(f"  Run ID:            {run.id}")
    print(f"  Status:            {run.status.value}")
    print(f"  Processed:         {run.records_processed}")
    print(f"  Created (New):     {run.records_created}")
    print(f"  Updated (Synced):  {run.records_updated}")
    print(f"  Failed:            {run.records_failed}")
    if run.error_message:
        print(f"  Message:           {run.error_message}")
    print("=======================================================\n")


def main():
    parser = argparse.ArgumentParser(description="Cineverse Metadata Ingestion CLI")
    parser.add_argument("command", choices=["import"], help="Ingestion command")
    parser.add_argument("--provider", choices=["tmdb", "anilist"], default="tmdb", help="Metadata provider")
    parser.add_argument("--feed", choices=["popular", "trending"], default="popular", help="Data feed type")
    parser.add_argument("--limit", type=int, default=20, help="Max items to process")
    parser.add_argument("--page", type=int, default=1, help="Provider page number")

    args = parser.parse_args()

    if args.command == "import":
        asyncio.run(run_import(
            provider=args.provider,
            feed=args.feed,
            limit=args.limit,
            page=args.page,
        ))


if __name__ == "__main__":
    main()
