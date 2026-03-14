"""Fetch satellite imagery for golf course areas.

Uses ESRI World Imagery tiles (free, no API key) by default,
or Google Maps Static API for higher quality when a key is available.
"""

import io
import math
import logging
from typing import Optional

import httpx
from PIL import Image

from config import settings

logger = logging.getLogger(__name__)

TILE_SIZE = 256
ESRI_TILE_URL = (
    "https://server.arcgisonline.com/ArcGIS/rest/services/"
    "World_Imagery/MapServer/tile/{z}/{y}/{x}"
)
GOOGLE_STATIC_URL = "https://maps.googleapis.com/maps/api/staticmap"


def _latlon_to_tile(lat: float, lon: float, zoom: int) -> tuple[int, int]:
    """Convert lat/lon to tile x,y at a given zoom level."""
    lat_rad = math.radians(lat)
    n = 2 ** zoom
    x = int((lon + 180.0) / 360.0 * n)
    y = int((1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n)
    return (x, y)


def _tile_to_latlon(x: int, y: int, zoom: int) -> tuple[float, float]:
    """Convert tile x,y to lat/lon of the tile's top-left corner."""
    n = 2 ** zoom
    lon = x / n * 360.0 - 180.0
    lat_rad = math.atan(math.sinh(math.pi * (1 - 2 * y / n)))
    lat = math.degrees(lat_rad)
    return (lat, lon)


class SatelliteFetcher:
    """Downloads satellite imagery of golf course areas."""

    async def fetch_course_image(
        self,
        center_lat: float,
        center_lon: float,
    ) -> tuple[bytes, dict, int, int]:
        """Fetch a satellite image centered on the course.

        Returns:
            Tuple of (png_bytes, bounds_dict, width_px, height_px).
            bounds_dict has keys: minLat, maxLat, minLon, maxLon.
        """
        # Prefer Google Maps Static API if key available (higher quality)
        if settings.google_maps_api_key:
            return await self._fetch_google_maps(center_lat, center_lon)

        # Free fallback: stitch ESRI World Imagery tiles
        return await self._fetch_esri_tiles(center_lat, center_lon)

    async def _fetch_google_maps(
        self, lat: float, lon: float
    ) -> tuple[bytes, dict, int, int]:
        """Fetch from Google Maps Static API (higher quality)."""
        zoom = settings.satellite_zoom
        size = 640  # Max without premium
        scale = 2   # 2x resolution → 1280x1280 actual pixels

        params = {
            "center": f"{lat},{lon}",
            "zoom": zoom,
            "size": f"{size}x{size}",
            "scale": scale,
            "maptype": "satellite",
            "key": settings.google_maps_api_key,
        }

        async with httpx.AsyncClient() as client:
            resp = await client.get(GOOGLE_STATIC_URL, params=params, timeout=15.0)
            resp.raise_for_status()
            image_bytes = resp.content

        # Compute bounds from center + zoom
        actual_px = size * scale
        bounds = self._compute_bounds(lat, lon, zoom, actual_px, actual_px)

        logger.info(
            f"Google Maps satellite: {actual_px}x{actual_px}px, "
            f"zoom {zoom}, bounds: {bounds}"
        )
        return (image_bytes, bounds, actual_px, actual_px)

    async def _fetch_esri_tiles(
        self, lat: float, lon: float
    ) -> tuple[bytes, dict, int, int]:
        """Fetch and stitch ESRI World Imagery tiles."""
        zoom = settings.satellite_zoom
        grid = settings.satellite_grid_size

        cx, cy = _latlon_to_tile(lat, lon, zoom)
        half = grid // 2

        x_start = cx - half
        y_start = cy - half
        x_end = x_start + grid
        y_end = y_start + grid

        # Download tiles concurrently
        tiles: dict[tuple[int, int], bytes] = {}
        async with httpx.AsyncClient() as client:
            for ty in range(y_start, y_end):
                for tx in range(x_start, x_end):
                    url = ESRI_TILE_URL.format(z=zoom, y=ty, x=tx)
                    try:
                        resp = await client.get(
                            url,
                            timeout=10.0,
                            headers={
                                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                                "Referer": "https://www.arcgis.com/",
                            },
                        )
                        if resp.status_code == 200:
                            tiles[(tx, ty)] = resp.content
                    except Exception as e:
                        logger.warning(f"Tile fetch failed ({tx},{ty}): {e}")

        if len(tiles) < grid * grid * 0.5:
            raise ValueError(
                f"Only fetched {len(tiles)}/{grid*grid} tiles — image unusable"
            )

        # Stitch into single image
        img_w = grid * TILE_SIZE
        img_h = grid * TILE_SIZE
        stitched = Image.new("RGB", (img_w, img_h))

        for (tx, ty), tile_bytes in tiles.items():
            tile_img = Image.open(io.BytesIO(tile_bytes))
            px = (tx - x_start) * TILE_SIZE
            py = (ty - y_start) * TILE_SIZE
            stitched.paste(tile_img, (px, py))

        # Geographic bounds
        top_lat, left_lon = _tile_to_latlon(x_start, y_start, zoom)
        bot_lat, right_lon = _tile_to_latlon(x_end, y_end, zoom)

        bounds = {
            "minLat": bot_lat,
            "maxLat": top_lat,
            "minLon": left_lon,
            "maxLon": right_lon,
        }

        buf = io.BytesIO()
        stitched.save(buf, format="PNG")
        image_bytes = buf.getvalue()

        logger.info(
            f"ESRI tiles: {len(tiles)}/{grid*grid} fetched, "
            f"{img_w}x{img_h}px, bounds: {bounds}"
        )
        return (image_bytes, bounds, img_w, img_h)

    @staticmethod
    def _compute_bounds(
        center_lat: float,
        center_lon: float,
        zoom: int,
        width_px: int,
        height_px: int,
    ) -> dict:
        """Compute geographic bounds for a Google Maps Static image."""
        # Meters per pixel at this zoom level and latitude
        meters_per_px = (
            156543.03392 * math.cos(math.radians(center_lat)) / (2 ** zoom)
        )
        half_w_m = (width_px / 2) * meters_per_px
        half_h_m = (height_px / 2) * meters_per_px

        # Convert meters to degrees
        m_per_deg_lat = 110574.0
        m_per_deg_lon = 111320.0 * math.cos(math.radians(center_lat))

        d_lat = half_h_m / m_per_deg_lat
        d_lon = half_w_m / m_per_deg_lon

        return {
            "minLat": center_lat - d_lat,
            "maxLat": center_lat + d_lat,
            "minLon": center_lon - d_lon,
            "maxLon": center_lon + d_lon,
        }
