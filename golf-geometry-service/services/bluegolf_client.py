"""Client for fetching golf course data from BlueGolf's JSON API.

Falls back to static data files when BlueGolf is unreachable (rate-limited, etc.).
"""

import json
import logging
import os
from pathlib import Path

import httpx

from config import settings
from models.bluegolf import BlueGolfResponse

logger = logging.getLogger(__name__)

STATIC_DATA_DIR = Path(__file__).parent.parent / "data"


class BlueGolfNotFoundError(Exception):
    pass


class BlueGolfClient:
    def __init__(self):
        self.base_url = settings.bluegolf_base_url

    async def fetch_course_data(self, handle: str) -> BlueGolfResponse:
        """Fetch course data from BlueGolf API, falling back to static data.

        Args:
            handle: BlueGolf course handle (e.g., "pinehurst2", "pebblebeach")

        Returns:
            Parsed BlueGolf response with holes, features, and image URLs.

        Raises:
            BlueGolfNotFoundError: If the course can't be found anywhere.
        """
        # Try BlueGolf API first
        try:
            return await self._fetch_from_api(handle)
        except BlueGolfNotFoundError as e:
            logger.info(f"API unavailable for '{handle}': {e}")

        # Fall back to static data
        result = self._load_static_data(handle)
        if result:
            return result

        raise BlueGolfNotFoundError(
            f"Course '{handle}' not found (API unavailable, no static data)"
        )

    async def _fetch_from_api(self, handle: str) -> BlueGolfResponse:
        """Fetch from BlueGolf's live API."""
        url = f"{self.base_url}/{handle}/overview.json"
        logger.info(f"Fetching BlueGolf data: {url}")

        async with httpx.AsyncClient(follow_redirects=True) as client:
            try:
                response = await client.get(
                    url,
                    timeout=10.0,
                    headers={
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                        "Accept": "application/json, text/plain, */*",
                        "Referer": "https://course.bluegolf.com/",
                    },
                )
            except (httpx.TimeoutException, httpx.ConnectError) as e:
                raise BlueGolfNotFoundError(f"Connection failed for {handle}: {e}")

            if response.status_code == 404:
                raise BlueGolfNotFoundError(f"Course '{handle}' not found on BlueGolf")

            if response.status_code in (302, 403, 429):
                raise BlueGolfNotFoundError(
                    f"BlueGolf rate-limited (status {response.status_code})"
                )

            response.raise_for_status()

            content_type = response.headers.get("content-type", "")
            if "json" not in content_type and "javascript" not in content_type:
                raise BlueGolfNotFoundError(
                    f"BlueGolf returned non-JSON (got {content_type})"
                )

            data = response.json()

        result = BlueGolfResponse.model_validate(data)
        if not result.holes:
            raise BlueGolfNotFoundError(f"No hole data for '{handle}'")

        logger.info(f"Fetched {len(result.holes)} holes from API for {handle}")

        # Save to static data for future offline use
        self._save_static_data(handle, data)

        return result

    def _load_static_data(self, handle: str) -> BlueGolfResponse | None:
        """Load course data from a static JSON file."""
        path = STATIC_DATA_DIR / f"{handle}.json"
        if not path.exists():
            return None

        try:
            with open(path) as f:
                data = json.load(f)
            result = BlueGolfResponse.model_validate(data)
            if result.holes:
                logger.info(f"Loaded {len(result.holes)} holes from static data for {handle}")
                return result
        except Exception as e:
            logger.warning(f"Failed to load static data for {handle}: {e}")

        return None

    def _save_static_data(self, handle: str, data: dict):
        """Cache API response as static JSON for offline use."""
        try:
            os.makedirs(STATIC_DATA_DIR, exist_ok=True)
            path = STATIC_DATA_DIR / f"{handle}.json"
            with open(path, "w") as f:
                json.dump(data, f)
            logger.info(f"Saved static data for {handle}")
        except Exception as e:
            logger.warning(f"Failed to save static data for {handle}: {e}")

    async def probe_handle(self, handle: str) -> bool:
        """Check if a handle exists (static data or API)."""
        # Check static data first (instant)
        if (STATIC_DATA_DIR / f"{handle}.json").exists():
            return True

        # Try API
        url = f"{self.base_url}/{handle}/overview.json"
        async with httpx.AsyncClient(follow_redirects=True) as client:
            try:
                response = await client.get(
                    url,
                    timeout=5.0,
                    headers={
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                        "Accept": "application/json, text/plain, */*",
                        "Referer": "https://course.bluegolf.com/",
                    },
                )
                content_type = response.headers.get("content-type", "")
                return response.status_code == 200 and "json" in content_type
            except (httpx.TimeoutException, httpx.HTTPError):
                return False
