"""Fetch real golf course polygon data from OpenStreetMap Overpass API.

Two-step approach:
1. Find the specific course boundary (leisure=golf_course with name)
2. Query features within that boundary

OSM has detailed fairway/green/bunker/tee/water polygons for many courses,
traced by real mappers. This is the most accurate free data source.
"""

import logging
import re
import time

import httpx

from api.schemas import BoundsResponse, CourseGeometryResponse, FeatureResponse

logger = logging.getLogger(__name__)

OVERPASS_URLS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]

# Step 1: Find course boundary
COURSE_BOUNDARY_QUERY = """
[out:json][timeout:30];
(
  way["leisure"="golf_course"]["name"~"{name_pattern}",i]({s},{w},{n},{e});
  relation["leisure"="golf_course"]["name"~"{name_pattern}",i]({s},{w},{n},{e});
);
out geom;
"""

# Step 2: Fetch features within a bounding box
FEATURES_QUERY = """
[out:json][timeout:30];
(
  way["golf"="fairway"]({s},{w},{n},{e});
  way["golf"="green"]({s},{w},{n},{e});
  way["golf"="bunker"]({s},{w},{n},{e});
  way["golf"="tee"]({s},{w},{n},{e});
  way["natural"="water"]({s},{w},{n},{e});
  way["golf"="water_hazard"]({s},{w},{n},{e});
);
out geom;
"""

# Fallback: broader query without course name filtering
BROAD_FEATURES_QUERY = """
[out:json][timeout:30];
(
  way["golf"="fairway"]({s},{w},{n},{e});
  way["golf"="green"]({s},{w},{n},{e});
  way["golf"="bunker"]({s},{w},{n},{e});
  way["golf"="tee"]({s},{w},{n},{e});
  way["natural"="water"]({s},{w},{n},{e});
  way["golf"="water_hazard"]({s},{w},{n},{e});
);
out geom;
"""

TAG_TO_TYPE = {
    "fairway": "fairway",
    "green": "green",
    "bunker": "bunker",
    "tee": "tee",
    "water_hazard": "water",
}


class OSMFetcher:
    """Fetches real golf course polygon data from OpenStreetMap."""

    async def fetch_course_features(
        self,
        center_lat: float,
        center_lon: float,
        course_name: str = "",
    ) -> CourseGeometryResponse | None:
        """Query OSM for golf features for a specific course.

        Pipeline:
        1. Search for the course boundary by name → get precise bbox
        2. Query features within that bbox
        3. If no boundary found, use a fallback bbox around center coords
        """
        # Step 1: Try to find the specific course boundary
        bbox = await self._find_course_bbox(
            center_lat, center_lon, course_name
        )

        if bbox:
            s, w, n, e = bbox
            logger.info(
                f"Found OSM course boundary for '{course_name}': "
                f"({s:.4f},{w:.4f},{n:.4f},{e:.4f})"
            )
        else:
            # Fallback: use center coords with a reasonable padding
            pad = 0.009  # ~1km
            s = center_lat - pad
            n = center_lat + pad
            w = center_lon - pad
            e = center_lon + pad
            logger.info(
                f"No OSM boundary found; using fallback bbox "
                f"({s:.4f},{w:.4f},{n:.4f},{e:.4f})"
            )

        # Step 2: Query features within the bbox
        return await self._fetch_features(s, w, n, e, course_name)

    async def _find_course_bbox(
        self,
        center_lat: float,
        center_lon: float,
        course_name: str,
    ) -> tuple[float, float, float, float] | None:
        """Find the course boundary in OSM and return its bbox."""
        if not course_name:
            return None

        # Build a regex pattern from the course name
        # "Pinehurst No. 2" → "Pinehurst.*2"
        # "Pebble Beach Golf Links" → "Pebble.*Beach"
        pattern = self._name_to_pattern(course_name)
        if not pattern:
            return None

        # Search in a wide area around the center
        search_pad = 0.03  # ~3km
        query = COURSE_BOUNDARY_QUERY.format(
            name_pattern=pattern,
            s=center_lat - search_pad,
            w=center_lon - search_pad,
            n=center_lat + search_pad,
            e=center_lon + search_pad,
        )

        try:
            data = await self._query_overpass(query)
        except Exception as e:
            logger.warning(f"Course boundary search failed: {e}")
            return None

        elements = data.get("elements", [])
        if not elements:
            return None

        # Find the closest matching course
        best = None
        best_dist = float("inf")
        for elem in elements:
            geom = elem.get("geometry", [])
            if not geom:
                # For relations, get outer geometry
                for member in elem.get("members", []):
                    if member.get("role") == "outer":
                        geom = member.get("geometry", [])
                        if geom:
                            break
            if not geom:
                continue

            lats = [n["lat"] for n in geom]
            lons = [n["lon"] for n in geom]
            c_lat = sum(lats) / len(lats)
            c_lon = sum(lons) / len(lons)
            dist = (c_lat - center_lat) ** 2 + (c_lon - center_lon) ** 2
            if dist < best_dist:
                best_dist = dist
                # Add small padding to the course boundary
                pad = 0.001
                best = (min(lats) - pad, min(lons) - pad,
                        max(lats) + pad, max(lons) + pad)

        return best

    async def _fetch_features(
        self,
        s: float, w: float, n: float, e: float,
        course_name: str,
    ) -> CourseGeometryResponse | None:
        """Fetch golf features within a bounding box."""
        query = FEATURES_QUERY.format(s=s, w=w, n=n, e=e)

        try:
            data = await self._query_overpass(query)
        except Exception as exc:
            logger.error(f"Feature query failed: {exc}")
            return None

        elements = data.get("elements", [])
        if not elements:
            logger.info("No OSM features in bbox")
            return None

        # Parse all features
        features: list[FeatureResponse] = []
        all_lats: list[float] = []
        all_lons: list[float] = []

        for elem in elements:
            feat = self._parse_element(elem)
            if feat:
                features.append(feat)
                for pt in feat.points:
                    all_lons.append(pt[0])
                    all_lats.append(pt[1])

        if not features or not all_lats:
            return None

        # Count types
        type_counts: dict[str, int] = {}
        for f in features:
            type_counts[f.type] = type_counts.get(f.type, 0) + 1

        fairway_count = type_counts.get("fairway", 0)
        if fairway_count < 3:
            logger.info(f"Only {fairway_count} fairways — insufficient")
            return None

        green_count = type_counts.get("green", 0)
        logger.info(
            f"OSM: {len(features)} features ({type_counts}) "
            f"for '{course_name}'"
        )

        pad_lat = (max(all_lats) - min(all_lats)) * 0.05
        pad_lon = (max(all_lons) - min(all_lons)) * 0.05

        return CourseGeometryResponse(
            features=features,
            bounds=BoundsResponse(
                minLat=min(all_lats) - pad_lat,
                maxLat=max(all_lats) + pad_lat,
                minLng=min(all_lons) - pad_lon,
                maxLng=max(all_lons) + pad_lon,
            ),
            timestamp=int(time.time() * 1000),
            source="openstreetmap",
            course_name=course_name,
            hole_count=max(green_count, fairway_count, 9),
            confidence=0.95,
            metadata={
                "method": "osm_overpass",
                "total_features": len(features),
                "fairways": fairway_count,
                "greens": green_count,
                "bunkers": type_counts.get("bunker", 0),
                "water": type_counts.get("water", 0),
                "tees": type_counts.get("tee", 0),
            },
        )

    @staticmethod
    def _name_to_pattern(name: str) -> str:
        """Convert a course name to a regex pattern for OSM search.

        "Pinehurst No. 2" → "Pinehurst.*2"
        "Pebble Beach Golf Links" → "Pebble.*Beach"
        "Augusta National" → "Augusta.*National"
        """
        # Remove common suffixes
        cleaned = re.sub(
            r"\b(golf|course|club|links|resort|country)\b",
            "", name, flags=re.IGNORECASE,
        )
        words = [w for w in cleaned.split() if len(w) > 1]
        if not words:
            return name.split()[0] if name.split() else ""

        # Take first and last significant words
        if len(words) >= 2:
            return f"{words[0]}.*{words[-1]}"
        return words[0]

    @staticmethod
    def _parse_element(elem: dict) -> FeatureResponse | None:
        """Parse a single OSM element into a FeatureResponse."""
        tags = elem.get("tags", {})

        # Determine feature type
        feat_type = None
        golf_tag = tags.get("golf", "")
        if golf_tag in TAG_TO_TYPE:
            feat_type = TAG_TO_TYPE[golf_tag]
        elif tags.get("natural") == "water" or "water" in tags:
            feat_type = "water"
        else:
            return None

        # Extract geometry
        geometry = elem.get("geometry", [])
        if not geometry:
            for member in elem.get("members", []):
                if member.get("role") == "outer":
                    geometry = member.get("geometry", [])
                    if geometry:
                        break

        if len(geometry) < 3:
            return None

        points: list[list[float]] = []
        for node in geometry:
            lat = node.get("lat")
            lon = node.get("lon")
            if lat is not None and lon is not None:
                points.append([lon, lat])

        if len(points) < 3:
            return None

        centroid_lon = sum(p[0] for p in points) / len(points)
        centroid_lat = sum(p[1] for p in points) / len(points)

        return FeatureResponse(
            type=feat_type,
            points=points,
            centroid=[centroid_lon, centroid_lat],
            hole_number=None,
        )

    @staticmethod
    async def _query_overpass(query: str) -> dict:
        """Execute an Overpass API query with fallback servers."""
        last_error = None
        async with httpx.AsyncClient() as client:
            for url in OVERPASS_URLS:
                try:
                    resp = await client.post(
                        url,
                        data={"data": query},
                        timeout=35.0,
                        headers={"User-Agent": "GolfGeometryService/1.0"},
                    )
                    resp.raise_for_status()
                    return resp.json()
                except Exception as e:
                    logger.warning(f"Overpass server {url} failed: {e}")
                    last_error = e
        raise last_error or RuntimeError("All Overpass servers failed")
