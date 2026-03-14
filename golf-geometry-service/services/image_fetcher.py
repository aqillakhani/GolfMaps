"""Download satellite images for golf course holes."""

import asyncio
import logging
from typing import Optional

import httpx

from models.bluegolf import BlueGolfHole, BlueGolfResponse
from models.course import HoleImage

logger = logging.getLogger(__name__)


class ImageFetcher:
    async def fetch_hole_images(
        self, course_data: BlueGolfResponse
    ) -> list[Optional[HoleImage]]:
        """Fetch satellite images for all holes concurrently.

        Returns a list of HoleImage objects (or None for holes without images).
        """
        tasks = []
        for i, hole in enumerate(course_data.holes):
            url = hole.image2x or hole.image
            tasks.append(self._fetch_single(url, hole_number=i + 1))

        results = await asyncio.gather(*tasks, return_exceptions=True)

        images = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.warning(f"Failed to fetch image for hole {i + 1}: {result}")
                images.append(None)
            else:
                images.append(result)

        fetched = sum(1 for img in images if img is not None)
        logger.info(f"Fetched {fetched}/{len(course_data.holes)} hole images")
        return images

    async def _fetch_single(
        self, url: Optional[str], hole_number: int
    ) -> Optional[HoleImage]:
        """Fetch a single hole's satellite image."""
        if not url:
            return None

        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                timeout=15.0,
                headers={"User-Agent": "GolfMaps/1.0"},
                follow_redirects=True,
            )
            response.raise_for_status()

            return HoleImage(
                hole_number=hole_number,
                image_data=response.content,
            )

    async def fetch_satellite_overview(
        self, lat: float, lon: float, google_api_key: str, zoom: int = 16
    ) -> bytes:
        """Fetch a Google Maps Static API satellite image for the full course."""
        url = (
            f"https://maps.googleapis.com/maps/api/staticmap"
            f"?maptype=satellite&center={lat},{lon}"
            f"&zoom={zoom}&size=640x640&scale=2"
            f"&key={google_api_key}"
        )
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=15.0, follow_redirects=True)
            response.raise_for_status()
            return response.content
