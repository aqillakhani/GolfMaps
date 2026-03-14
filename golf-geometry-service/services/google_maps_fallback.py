"""Fallback: extract geometry using Google Maps satellite imagery when BlueGolf unavailable."""

import logging
from typing import Optional

import httpx

from api.schemas import CourseGeometryResponse
from config import settings
from services.geometry_assembler import GeometryAssembler
from services.image_fetcher import ImageFetcher
from services.vision_analyzer import VisionAnalyzer

logger = logging.getLogger(__name__)


class GoogleMapsFallback:
    def __init__(
        self,
        vision_analyzer: VisionAnalyzer,
        assembler: GeometryAssembler,
        image_fetcher: ImageFetcher,
    ):
        self.vision = vision_analyzer
        self.assembler = assembler
        self.image_fetcher = image_fetcher

    async def extract_geometry(
        self, course_name: str, location: Optional[str] = None
    ) -> Optional[CourseGeometryResponse]:
        """Extract course geometry using Google Maps satellite imagery.

        1. Geocode the course to get lat/lon.
        2. Fetch a satellite image.
        3. Analyze with Claude Vision (no reference anchors).
        4. Return geometry.
        """
        if not settings.google_maps_api_key:
            logger.warning("Google Maps API key not configured, skipping fallback")
            return None

        # Geocode
        coords = await self._geocode_course(course_name, location)
        if not coords:
            logger.warning(f"Could not geocode '{course_name}'")
            return None

        lat, lon = coords
        logger.info(f"Geocoded '{course_name}' to ({lat}, {lon})")

        # Fetch satellite image
        try:
            image_data = await self.image_fetcher.fetch_satellite_overview(
                lat, lon, settings.google_maps_api_key, zoom=16
            )
        except Exception as e:
            logger.warning(f"Failed to fetch satellite image: {e}")
            return None

        # Analyze with Vision
        try:
            features = await self.vision.analyze_full_course(image_data, course_name)
        except Exception as e:
            logger.warning(f"Vision analysis failed for fallback: {e}")
            return None

        if not features:
            return None

        return self.assembler.assemble_from_vision_only(
            features, course_name, lat, lon
        )

    async def _geocode_course(
        self, course_name: str, location: Optional[str] = None
    ) -> Optional[tuple[float, float]]:
        """Geocode a golf course using Google Geocoding API."""
        query = f"{course_name} golf course"
        if location:
            query += f", {location}"

        params = {
            "address": query,
            "key": settings.google_maps_api_key,
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    "https://maps.googleapis.com/maps/api/geocode/json",
                    params=params,
                    timeout=10.0,
                )
                response.raise_for_status()
                data = response.json()
            except (httpx.HTTPError, httpx.TimeoutException):
                return None

        results = data.get("results", [])
        if not results:
            return None

        loc = results[0]["geometry"]["location"]
        return (loc["lat"], loc["lng"])
