from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.models.external_id import ExternalID
from backend.app.models.media import Media


class IdentityResolver:
    """Resolves external provider identifiers to canonical Media records."""

    @staticmethod
    async def find_existing(
        session: AsyncSession,
        provider: str,
        external_id: str,
    ) -> Optional[Media]:
        """Look up canonical media by provider and external ID."""
        stmt = (
            select(Media)
            .join(ExternalID, ExternalID.media_id == Media.id)
            .where(ExternalID.provider == provider, ExternalID.external_id == str(external_id))
        )
        result = await session.execute(stmt)
        return result.scalars().first()

    @staticmethod
    async def find_by_any_provider(
        session: AsyncSession,
        provider_ids: dict,
    ) -> Optional[Media]:
        """Check multiple provider IDs (e.g. tmdb_id, mal_id)."""
        for prov, ext_id in provider_ids.items():
            if ext_id:
                existing = await IdentityResolver.find_existing(session, prov, str(ext_id))
                if existing:
                    return existing
        return None
