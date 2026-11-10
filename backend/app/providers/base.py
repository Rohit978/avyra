import abc
import asyncio
import logging
import random
from typing import Any, Dict, List, Optional
import httpx
from backend.app.schemas.normalized import NormalizedMediaDTO

logger = logging.getLogger(__name__)


class BaseAdapter(abc.ABC):
    """Abstract base class for external metadata provider adapters."""

    def __init__(
        self,
        name: str,
        base_url: str,
        timeout: float = 15.0,
        rate_limit_delay: float = 0.2,
        max_retries: int = 3,
    ):
        self.name = name
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.rate_limit_delay = rate_limit_delay
        self.max_retries = max_retries
        self._client: Optional[httpx.AsyncClient] = None

    async def get_client(self) -> httpx.AsyncClient:
        """Get or initialize reusable async HTTP client."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                timeout=self.timeout,
                headers={"User-Agent": "Cineverse/1.0 (+https://github.com/Rohit978/avyra)"},
            )
        return self._client

    async def close(self) -> None:
        """Close underlying HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    async def _request_with_retry(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        json_data: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """Execute HTTP request with rate-limiting delay and exponential backoff."""
        client = await self.get_client()
        url = endpoint if endpoint.startswith("http") else f"{self.base_url}/{endpoint.lstrip('/')}"
        
        # Proactive rate-limit throttle
        if self.rate_limit_delay > 0:
            await asyncio.sleep(self.rate_limit_delay)

        for attempt in range(self.max_retries + 1):
            try:
                response = await client.request(
                    method=method,
                    url=url,
                    params=params,
                    json=json_data,
                    headers=headers,
                )

                # Handle 429 Too Many Requests
                if response.status_code == 429:
                    retry_after = float(response.headers.get("Retry-After", 2.0))
                    jitter = random.uniform(0.1, 0.5)
                    wait_time = retry_after + jitter
                    logger.warning(f"[{self.name}] Rate limited (429). Retrying after {wait_time:.2f}s...")
                    await asyncio.sleep(wait_time)
                    continue

                # Raise HTTP errors for 4xx/5xx
                response.raise_for_status()
                return response.json()

            except (httpx.RequestError, httpx.HTTPStatusError) as exc:
                if attempt == self.max_retries:
                    logger.error(f"[{self.name}] Request failed after {self.max_retries} retries: {exc}")
                    raise

                backoff = (2 ** attempt) + random.uniform(0.1, 0.5)
                logger.warning(f"[{self.name}] Request to {url} failed ({exc}). Retrying in {backoff:.2f}s...")
                await asyncio.sleep(backoff)

        raise RuntimeError(f"[{self.name}] Max retries exceeded for {url}")

    @abc.abstractmethod
    async def get_popular(self, page: int = 1) -> List[Dict[str, Any]]:
        """Fetch popular titles list."""
        pass

    @abc.abstractmethod
    async def get_trending(self, time_window: str = "day") -> List[Dict[str, Any]]:
        """Fetch trending titles list."""
        pass

    @abc.abstractmethod
    async def get_details(self, external_id: str) -> Dict[str, Any]:
        """Fetch full details for an external title identifier."""
        pass

    @abc.abstractmethod
    def normalize(self, raw_record: Dict[str, Any]) -> NormalizedMediaDTO:
        """Transform raw provider payload into unified NormalizedMediaDTO."""
        pass

    @abc.abstractmethod
    async def health_check(self) -> bool:
        """Verify provider availability."""
        pass
