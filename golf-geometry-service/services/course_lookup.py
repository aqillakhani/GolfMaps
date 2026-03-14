"""Resolve a golf course name to a BlueGolf handle."""

import logging
import re
from typing import Optional

import httpx

from config import settings
from services.bluegolf_client import BlueGolfClient

logger = logging.getLogger(__name__)

# Pre-built lookup table for well-known courses
KNOWN_HANDLES: dict[str, str] = {
    "augusta national": "augustanationalgc",
    "augusta national golf club": "augustanationalgc",
    "pebble beach": "pebblebeach",
    "pebble beach golf links": "pebblebeach",
    "pinehurst no. 2": "pinehurst2",
    "pinehurst no 2": "pinehurst2",
    "pinehurst number 2": "pinehurst2",
    "pinehurst resort no. 2": "pinehurst2",
    "st andrews old course": "standrewsold",
    "the old course st andrews": "standrewsold",
    "old course at st andrews": "standrewsold",
    "torrey pines south": "torreypinessouth",
    "torrey pines north": "torreypinesnorth",
    "bethpage black": "bethpageblack",
    "bethpage state park black": "bethpageblack",
    "whistling straits": "whistlingstraitsgc",
    "kiawah island ocean course": "kiawahocean",
    "tpc sawgrass": "tpcsawgrassstadium",
    "tpc sawgrass stadium": "tpcsawgrassstadium",
    "tpc scottsdale": "tpcscottsdalestadium",
    "tpc scottsdale stadium": "tpcscottsdalestadium",
    "oakmont country club": "oakmont",
    "merion golf club east": "merioneast",
    "merion east": "merioneast",
    "winged foot west": "wingedfootwest",
    "winged foot golf club west": "wingedfootwest",
    "shinnecock hills": "shinnecockhills",
    "shinnecock hills golf club": "shinnecockhills",
    "royal melbourne west": "royalmelbournewest",
    "cypress point": "cypresspoint",
    "cypress point club": "cypresspoint",
    "congressional blue": "congressionalblue",
    "riviera country club": "riviera",
    "the riviera country club": "riviera",
    "harbour town golf links": "harbourtowngolflinks",
    "harbour town": "harbourtowngolflinks",
    "bay hill": "bayhill",
    "arnold palmer bay hill": "bayhill",
    "muirfield village": "muirfieldvillage",
    "muirfield village golf club": "muirfieldvillage",
    "valhalla golf club": "valhalla",
    "southern hills country club": "southernhills",
    "southern hills": "southernhills",
    "east lake golf club": "eastlake",
    "east lake": "eastlake",
    "kapalua plantation": "kapaluaplantation",
    "kapalua plantation course": "kapaluaplantation",
    "royal dornoch": "royaldornoch",
    "royal dornoch golf club": "royaldornoch",
    "bandon dunes": "bandondunes",
    "pacific dunes": "pacificdunes",
    "sand valley": "sandvalley",
    "mammoth dunes": "mammothdunes",
    "streamsong red": "streamsongred",
    "streamsong blue": "streamsongblue",
    "streamsong black": "streamsongblack",
    "erin hills": "erinhills",
    "chambers bay": "chambersbay",
    "quail hollow club": "quailhollow",
    "quail hollow": "quailhollow",
    "colonial country club": "colonialcc",
    "colonial": "colonialcc",
}


class CourseLookupService:
    def __init__(self, bluegolf_client: BlueGolfClient):
        self.bluegolf = bluegolf_client

    async def resolve_handle(
        self, course_name: str, location: Optional[str] = None
    ) -> Optional[str]:
        """Resolve a course name to a BlueGolf handle.

        Tries multiple strategies in order:
        1. Pre-built lookup table
        2. Handle generation heuristic + API probe
        3. Google Custom Search (if API key configured)

        Returns None if resolution fails.
        """
        normalized = self._normalize_name(course_name)

        # Layer 1: Lookup table
        handle = KNOWN_HANDLES.get(normalized)
        if handle:
            logger.info(f"Resolved '{course_name}' via lookup table: {handle}")
            return handle

        # Layer 2: Heuristic generation + probe
        candidates = self._generate_handle_candidates(course_name)
        for candidate in candidates:
            if await self.bluegolf.probe_handle(candidate):
                logger.info(f"Resolved '{course_name}' via probe: {candidate}")
                return candidate

        # Layer 3: Google Custom Search
        if settings.google_cse_api_key and settings.google_cse_cx:
            handle = await self._search_google(course_name, location)
            if handle:
                logger.info(f"Resolved '{course_name}' via Google search: {handle}")
                return handle

        logger.warning(f"Could not resolve BlueGolf handle for '{course_name}'")
        return None

    def _normalize_name(self, name: str) -> str:
        """Normalize a course name for lookup table matching."""
        name = name.lower().strip()
        name = re.sub(r"[''`]", "", name)
        name = re.sub(r"\s+", " ", name)
        return name

    def _generate_handle_candidates(self, name: str) -> list[str]:
        """Generate possible BlueGolf handles from a course name."""
        candidates = []
        base = name.lower()

        # Remove common suffixes
        for suffix in [
            " golf club", " golf course", " country club",
            " golf links", " golf & country club", " resort",
            " club", " links",
        ]:
            base = base.replace(suffix, "")

        # Strip everything non-alphanumeric
        clean = re.sub(r"[^a-z0-9]", "", base)
        candidates.append(clean)

        # Try with common suffixes
        candidates.append(clean + "gc")
        candidates.append(clean + "cc")
        candidates.append(clean + "golfclub")
        candidates.append(clean + "stadium")
        candidates.append(clean + "course")

        # Handle "No. X" / "No X" patterns -> just the number
        numbered = re.sub(r"no\.?\s*(\d+)", r"\1", base)
        numbered_clean = re.sub(r"[^a-z0-9]", "", numbered)
        if numbered_clean != clean:
            candidates.append(numbered_clean)

        # Handle "The X" -> "X"
        if base.startswith("the "):
            no_the = re.sub(r"[^a-z0-9]", "", base[4:])
            candidates.append(no_the)

        # Try keeping full name (no suffix stripping)
        full_clean = re.sub(r"[^a-z0-9]", "", name.lower())
        if full_clean != clean:
            candidates.append(full_clean)

        return list(dict.fromkeys(candidates))  # dedupe preserving order

    async def _search_google(
        self, course_name: str, location: Optional[str] = None
    ) -> Optional[str]:
        """Search Google Custom Search for a BlueGolf course page."""
        query = f'site:course.bluegolf.com "{course_name}"'
        if location:
            query += f" {location}"

        params = {
            "key": settings.google_cse_api_key,
            "cx": settings.google_cse_cx,
            "q": query,
            "num": 3,
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    "https://www.googleapis.com/customsearch/v1",
                    params=params,
                    timeout=10.0,
                )
                response.raise_for_status()
                data = response.json()
            except (httpx.HTTPError, httpx.TimeoutException):
                return None

        for item in data.get("items", []):
            link = item.get("link", "")
            match = re.search(
                r"course\.bluegolf\.com/bluegolf/course/course/([^/]+)/", link
            )
            if match:
                return match.group(1)

        return None
