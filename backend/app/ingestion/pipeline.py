import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Tuple
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.ingestion.resolver import IdentityResolver
from backend.app.models.credit import Credit
from backend.app.models.episode import Episode
from backend.app.models.external_id import ExternalID
from backend.app.models.genre import Genre, media_genres
from backend.app.models.ingestion import IngestionRun, IngestionStatus
from backend.app.models.media import Media
from backend.app.models.person import Person
from backend.app.models.season import Season
from backend.app.models.title import MediaTitle
from backend.app.schemas.normalized import NormalizedMediaDTO

logger = logging.getLogger(__name__)


class IngestionPipeline:
    """Transactional coordinator for normalizing and upserting media metadata."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def _get_or_create_genre(self, name: str) -> Genre:
        slug = name.lower().replace(" ", "-").replace("&", "and")
        stmt = select(Genre).where(Genre.name == name)
        result = await self.session.execute(stmt)
        genre = result.scalars().first()
        if not genre:
            genre = Genre(name=name, slug=slug)
            self.session.add(genre)
            await self.session.flush()
        return genre

    async def _get_or_create_person(self, name: str, original_name: str = None, profile_path: str = None) -> Person:
        stmt = select(Person).where(Person.name == name)
        result = await self.session.execute(stmt)
        person = result.scalars().first()
        if not person:
            person = Person(
                name=name,
                original_name=original_name,
                profile_path=profile_path,
            )
            self.session.add(person)
            await self.session.flush()
        return person

    async def upsert_media(self, dto: NormalizedMediaDTO) -> Tuple[Media, bool]:
        """
        Idempotently upsert a NormalizedMediaDTO into the database.
        Returns: (Media, is_created: bool)
        """
        # 1. Resolve identity
        existing_media = await IdentityResolver.find_existing(
            self.session, dto.provider, dto.external_id
        )

        is_created = False
        if existing_media:
            media = existing_media
            # Update mutable fields without overwriting non-empty values with None
            if dto.overview:
                media.overview = dto.overview
            if dto.poster_url:
                media.poster_url = dto.poster_url
            if dto.backdrop_url:
                media.backdrop_url = dto.backdrop_url
            if dto.popularity > 0:
                media.popularity = dto.popularity
            if dto.vote_average > 0:
                media.vote_average = dto.vote_average
            if dto.vote_count > 0:
                media.vote_count = dto.vote_count
            media.status = dto.status
            if dto.runtime:
                media.runtime = dto.runtime
            media.raw_metadata.update(dto.raw_metadata)
        else:
            # Create new canonical Media
            media = Media(
                media_type=dto.media_type,
                title=dto.title,
                original_title=dto.original_title,
                overview=dto.overview,
                release_date=dto.release_date,
                end_date=dto.end_date,
                original_language=dto.original_language,
                country_of_origin=dto.country_of_origin,
                runtime=dto.runtime,
                is_adult=dto.is_adult,
                status=dto.status,
                popularity=dto.popularity,
                vote_average=dto.vote_average,
                vote_count=dto.vote_count,
                poster_url=dto.poster_url,
                backdrop_url=dto.backdrop_url,
                raw_metadata=dto.raw_metadata,
            )
            self.session.add(media)
            await self.session.flush()

            # Create primary external ID link
            ext_id = ExternalID(
                media_id=media.id,
                provider=dto.provider,
                external_id=dto.external_id,
            )
            self.session.add(ext_id)
            is_created = True

        # 1.5 Sync secondary external IDs from raw_metadata
        if dto.raw_metadata:
            added_ext_keys = {(dto.provider, str(dto.external_id).strip())}
            prov_mappings = [
                ("tmdb", dto.raw_metadata.get("moviedb_id") or dto.raw_metadata.get("tmdb_id")),
                ("imdb", dto.raw_metadata.get("imdb_id")),
                ("anilist", dto.raw_metadata.get("anilist_id")),
            ]
            for prov, val in prov_mappings:
                if val:
                    val_str = str(val).strip()
                    if (prov, val_str) in added_ext_keys:
                        continue
                    chk_stmt = select(ExternalID).where(
                        (ExternalID.provider == prov) & (ExternalID.external_id == val_str)
                    )
                    chk_res = await self.session.execute(chk_stmt)
                    if not chk_res.scalars().first():
                        self.session.add(
                            ExternalID(
                                media_id=media.id,
                                provider=prov,
                                external_id=val_str,
                            )
                        )
                        added_ext_keys.add((prov, val_str))

        # 2. Sync Titles
        existing_titles_stmt = select(MediaTitle.title).where(MediaTitle.media_id == media.id)
        existing_titles_res = await self.session.execute(existing_titles_stmt)
        existing_title_set = set(existing_titles_res.scalars().all())

        for t in dto.titles:
            if t.title not in existing_title_set:
                self.session.add(
                    MediaTitle(
                        media_id=media.id,
                        title=t.title,
                        title_type=t.title_type,
                        language=t.language,
                        is_primary=t.is_primary,
                    )
                )
                existing_title_set.add(t.title)

        # 3. Sync Genres
        for g_name in dto.genres:
            genre = await self._get_or_create_genre(g_name)
            mg_stmt = select(media_genres.c.genre_id).where(
                media_genres.c.media_id == media.id,
                media_genres.c.genre_id == genre.id,
            )
            mg_res = await self.session.execute(mg_stmt)
            if not mg_res.scalars().first():
                await self.session.execute(
                    media_genres.insert().values(media_id=media.id, genre_id=genre.id)
                )

        # 4. Sync Seasons and Episodes
        for s in dto.seasons:
            s_stmt = select(Season).where(
                Season.media_id == media.id,
                Season.season_number == s.season_number,
            )
            s_res = await self.session.execute(s_stmt)
            season = s_res.scalars().first()
            if not season:
                season = Season(
                    media_id=media.id,
                    season_number=s.season_number,
                    title=s.title,
                    overview=s.overview,
                    poster_path=s.poster_path,
                    air_date=s.air_date,
                    episode_count=s.episode_count,
                )
                self.session.add(season)
                await self.session.flush()
            else:
                season.episode_count = max(season.episode_count, s.episode_count)

            # Sync episodes if present
            seen_ep_numbers = set()
            for ep in s.episodes:
                if ep.episode_number in seen_ep_numbers:
                    continue
                seen_ep_numbers.add(ep.episode_number)
                ep_stmt = select(Episode).where(
                    Episode.season_id == season.id,
                    Episode.episode_number == ep.episode_number,
                )
                ep_res = await self.session.execute(ep_stmt)
                episode = ep_res.scalars().first()
                if not episode:
                    episode = Episode(
                        season_id=season.id,
                        media_id=media.id,
                        episode_number=ep.episode_number,
                        title=ep.title,
                        overview=ep.overview,
                        still_path=ep.still_path,
                        air_date=ep.air_date,
                        runtime=ep.runtime,
                    )
                    self.session.add(episode)

        # 5. Sync Credits
        for c in dto.credits:
            person = await self._get_or_create_person(
                name=c.person_name,
                original_name=c.original_name,
                profile_path=c.profile_path,
            )
            cr_stmt = select(Credit).where(
                Credit.media_id == media.id,
                Credit.person_id == person.id,
                Credit.credit_type == c.credit_type,
            )
            cr_res = await self.session.execute(cr_stmt)
            if not cr_res.scalars().first():
                credit = Credit(
                    media_id=media.id,
                    person_id=person.id,
                    credit_type=c.credit_type,
                    character_name=c.character_name,
                    department=c.department,
                    job=c.job,
                    order=c.order,
                )
                self.session.add(credit)

        await self.session.flush()
        return media, is_created

    async def ingest_batch(
        self,
        provider: str,
        job_type: str,
        dtos: List[NormalizedMediaDTO],
    ) -> IngestionRun:
        """
        Process a list of NormalizedMediaDTO records within an IngestionRun audit tracking wrapper.
        """
        run = IngestionRun(
            provider=provider,
            job_type=job_type,
            status=IngestionStatus.RUNNING,
            records_processed=len(dtos),
        )
        self.session.add(run)
        await self.session.flush()

        created_count = 0
        updated_count = 0
        failed_count = 0
        errors: List[Dict[str, Any]] = []

        for dto in dtos:
            try:
                # Use a savepoint for each item so a single failure doesn't roll back the whole run
                async with self.session.begin_nested():
                    _, is_created = await self.upsert_media(dto)
                    if is_created:
                        created_count += 1
                    else:
                        updated_count += 1
            except Exception as exc:
                failed_count += 1
                error_entry = {
                    "external_id": dto.external_id,
                    "title": dto.title,
                    "error": str(exc),
                }
                errors.append(error_entry)
                logger.error(f"Failed to ingest record {dto.title} ({dto.external_id}): {exc}")

        # Finalize run statistics
        run.records_created = created_count
        run.records_updated = updated_count
        run.records_failed = failed_count
        run.completed_at = datetime.now(timezone.utc)
        run.error_details = {"errors": errors[:50]}

        if failed_count == 0:
            run.status = IngestionStatus.COMPLETED
        elif failed_count == len(dtos):
            run.status = IngestionStatus.FAILED
            run.error_message = f"All {len(dtos)} records failed to import."
        else:
            run.status = IngestionStatus.PARTIAL
            run.error_message = f"{failed_count} of {len(dtos)} records failed to import."

        await self.session.commit()
        return run
