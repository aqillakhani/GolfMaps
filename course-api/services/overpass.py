import asyncio
import time
import httpx

OVERPASS_URLS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

_GOLF_SUFFIXES = [
    "golf & country club", "golf and country club",
    "golf course", "golf club", "golf links",
    "country club", "golf resort",
]


def _strip_golf_suffix(query: str) -> str:
    """Remove trailing golf-related suffixes to prevent double-suffix in Nominatim queries."""
    q = query.strip()
    lower = q.lower()
    for suffix in _GOLF_SUFFIXES:
        if lower.endswith(suffix):
            return q[:len(q) - len(suffix)].strip()
    return q


def _score_result(result_name: str, query: str) -> int:
    """Score a search result by relevance to the user's query. Higher = better."""
    rn = result_name.lower().strip()
    q = query.lower().strip()
    core = _strip_golf_suffix(query).lower().strip()
    if q == rn or core == rn:
        return 100
    if core in rn:
        return 80
    if rn in q:
        return 60
    query_words = set(core.split())
    result_words = set(rn.split())
    overlap = len(query_words & result_words)
    return overlap * 20


_last_overpass_time = 0.0
_last_nominatim_time = 0.0
_overpass_lock = asyncio.Lock()
_nominatim_lock = asyncio.Lock()


async def _rate_limited_query(query: str, timeout_seconds: int = 60) -> dict:
    """Execute an Overpass query with rate limiting, retry on 429/504, and server failover."""
    global _last_overpass_time
    async with _overpass_lock:
        now = time.time()
        wait = max(0, 1.5 - (now - _last_overpass_time))
        if wait > 0:
            await asyncio.sleep(wait)

        last_error: Exception | None = None
        for server_url in OVERPASS_URLS:
            async with httpx.AsyncClient(timeout=float(timeout_seconds)) as client:
                for attempt in range(3):
                    try:
                        response = await client.post(server_url, data={"data": query})
                        if response.status_code == 429:
                            retry_after = int(response.headers.get("Retry-After", 5))
                            await asyncio.sleep(retry_after + 1)
                            continue
                        if response.status_code in (502, 503, 504):
                            await asyncio.sleep(3 * (attempt + 1))
                            continue
                        response.raise_for_status()
                        _last_overpass_time = time.time()
                        return response.json()
                    except (httpx.TimeoutException, httpx.HTTPStatusError) as e:
                        last_error = e
                        await asyncio.sleep(2 * (attempt + 1))
                        continue
                    except Exception as e:
                        last_error = e
                        break

        if last_error:
            raise last_error
        return {}


async def _nominatim_search(search_query: str, limit: int, headers: dict) -> list[dict]:
    """Execute a single Nominatim search and return raw JSON results."""
    global _last_nominatim_time
    async with _nominatim_lock:
        now = time.time()
        wait = max(0, 1.1 - (now - _last_nominatim_time))
        if wait > 0:
            await asyncio.sleep(wait)

        params = {
            "q": search_query,
            "format": "json",
            "limit": limit,
            "extratags": 1,
            "namedetails": 1,
            "addressdetails": 1,
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(NOMINATIM_URL, params=params, headers=headers)
            response.raise_for_status()
            _last_nominatim_time = time.time()
            return response.json()


def _parse_golf_results(data: list[dict], original_query: str) -> list[dict]:
    """Filter Nominatim results to golf courses and sort by relevance."""
    results = []
    seen_ids = set()
    for item in data:
        osm_type = item.get("osm_type", "")
        osm_id = item.get("osm_id")
        extra = item.get("extratags") or {}
        category = item.get("class", "")
        item_type = item.get("type", "")

        is_golf = (
            (category == "leisure" and item_type == "golf_course")
            or extra.get("leisure") == "golf_course"
            or "golf" in item.get("display_name", "").lower()
        )
        if not is_golf:
            continue

        # Nodes are POIs, not course boundaries — skip them.
        # Golf courses are always ways (closed polygons) or relations.
        if osm_type == "node":
            continue

        # Deduplicate
        key = (osm_type, osm_id)
        if key in seen_ids:
            continue
        seen_ids.add(key)

        addr = item.get("address") or {}
        location_parts = [
            addr.get("city", addr.get("town", addr.get("village", ""))),
            addr.get("state", ""),
            addr.get("country", ""),
        ]
        location = ", ".join(p for p in location_parts if p) or None

        name = (item.get("namedetails") or {}).get("name", "") or item.get("display_name", "").split(",")[0]

        results.append({
            "osm_id": int(osm_id),
            "osm_type": osm_type,
            "name": name,
            "location": location,
            "lat": float(item["lat"]),
            "lon": float(item["lon"]),
        })

    # Sort by relevance to the original query
    results.sort(key=lambda r: _score_result(r["name"], original_query), reverse=True)
    return results


async def search_courses(query: str, limit: int = 10) -> list[dict]:
    """Search using Nominatim with multiple strategies, then fall back to Overpass name search."""
    headers = {"User-Agent": "GolfMapPoster/1.0"}
    core_name = _strip_golf_suffix(query)

    # Strategy 1: "{core_name} golf course"
    data = await _nominatim_search(f"{core_name} golf course", limit, headers)
    results = _parse_golf_results(data, query)
    if results:
        return results

    # Strategy 2: "{core_name} golf club"
    data = await _nominatim_search(f"{core_name} golf club", limit, headers)
    results = _parse_golf_results(data, query)
    if results:
        return results

    # Strategy 3: "{core_name} golf"
    data = await _nominatim_search(f"{core_name} golf", limit, headers)
    results = _parse_golf_results(data, query)
    if results:
        return results

    # Strategy 4: just the core name
    data = await _nominatim_search(core_name, limit, headers)
    results = _parse_golf_results(data, query)
    if results:
        return results

    # Strategy 5: Overpass name search — handles variant spellings (Paa-Ko vs Paako).
    # Run BEFORE word-based Nominatim since word searches can match non-golf features.
    results = await _overpass_name_search(core_name, query, limit)
    if results:
        return results

    # Strategy 6: individual words from the query (last resort, may match roads)
    words = [w for w in core_name.split() if len(w) >= 4]
    for word in words:
        data = await _nominatim_search(f"{word} golf course", limit, headers)
        results = _parse_golf_results(data, query)
        if results:
            return results

    return []


async def _overpass_name_search(core_name: str, original_query: str, limit: int) -> list[dict]:
    """Search Overpass directly for golf courses matching the name.

    Uses word-prefix matching to handle variant spellings:
    "Paako Ridge" → pattern "Paa.*Rid" → matches "Paa-Ko Ridge Golf Club"
    This handles hyphens, alternate romanizations, and partial name differences.
    """
    import re
    words = core_name.split()
    # Build patterns: exact words first, then 3-char prefixes as fallback
    safe_words = [re.escape(w).replace('"', '\\"') for w in words if len(w) >= 3]
    prefixes = [re.escape(w[:3]).replace('"', '\\"') for w in words if len(w) >= 3]
    if not prefixes:
        return []

    exact_pattern = ".*".join(safe_words)
    prefix_pattern = ".*".join(prefixes)

    patterns = [exact_pattern]
    if prefix_pattern != exact_pattern:
        patterns.append(prefix_pattern)

    for pattern in patterns:
        # Use explicit way + rel instead of nwr — nwr regex can miss relations
        overpass_query = f'''
[out:json][timeout:15];
(
  way["leisure"="golf_course"]["name"~"{pattern}",i];
  rel["leisure"="golf_course"]["name"~"{pattern}",i];
);
out center tags;
'''
        try:
            data = await _rate_limited_query(overpass_query, timeout_seconds=20)
        except Exception:
            continue

        results = _parse_overpass_elements(data, original_query)
        if results:
            return results[:limit]

    return []


def _parse_overpass_elements(data: dict, original_query: str) -> list[dict]:
    """Parse Overpass elements into search results."""
    results = []
    seen_ids = set()
    for el in data.get("elements", []):
        tags = el.get("tags", {})
        el_type = el.get("type", "")
        el_id = el.get("id")

        osm_type = {"node": "node", "way": "way", "relation": "relation"}.get(el_type, el_type)

        key = (osm_type, el_id)
        if key in seen_ids:
            continue
        seen_ids.add(key)

        center = el.get("center", {})
        lat = center.get("lat") or el.get("lat")
        lon = center.get("lon") or el.get("lon")
        if lat is None or lon is None:
            continue

        name = tags.get("name", "")
        if not name:
            continue

        location_parts = [
            tags.get("addr:city", ""),
            tags.get("addr:state", ""),
            tags.get("addr:country", ""),
        ]
        location = ", ".join(p for p in location_parts if p) or None

        results.append({
            "osm_id": int(el_id),
            "osm_type": osm_type,
            "name": name,
            "location": location,
            "lat": float(lat),
            "lon": float(lon),
        })

    results.sort(key=lambda r: _score_result(r["name"], original_query), reverse=True)
    return results


def _has_golf_sub_features(data: dict) -> bool:
    """Check if Overpass result contains golf-tagged sub-features (not just the boundary)."""
    golf_tags = {
        "fairway", "green", "bunker", "tee", "water_hazard",
        "lateral_water_hazard", "rough", "hole", "driving_range",
    }
    for el in data.get("elements", []):
        tags = el.get("tags", {})
        # Skip the main boundary element itself
        if tags.get("leisure") == "golf_course":
            continue
        golf_val = tags.get("golf", "")
        if golf_val in golf_tags:
            return True
        if tags.get("natural") in ("water", "sand"):
            return True
    return False


def _extract_bbox(elements: list[dict], padding: float = 0.002) -> str | None:
    """Compute a bounding box string from Overpass elements with optional padding."""
    lats: list[float] = []
    lons: list[float] = []
    for el in elements:
        if "geometry" in el:
            for pt in el["geometry"]:
                lats.append(pt["lat"])
                lons.append(pt["lon"])
        elif "bounds" in el:
            b = el["bounds"]
            lats.extend([b["minlat"], b["maxlat"]])
            lons.extend([b["minlon"], b["maxlon"]])
        elif "lat" in el:
            lats.append(el["lat"])
            lons.append(el["lon"])
        for member in el.get("members", []):
            if "geometry" in member:
                for pt in member["geometry"]:
                    lats.append(pt["lat"])
                    lons.append(pt["lon"])

    if not lats:
        return None
    return f"{min(lats) - padding},{min(lons) - padding},{max(lats) + padding},{max(lons) + padding}"


async def fetch_course_data(osm_type: str, osm_id: int) -> dict:
    """Fetch course geometry from Overpass with multiple fallback strategies.

    Strategy order:
    1. map_to_area (works for relations and closed ways)
    2. bbox from boundary geometry (works for everything)
    3. Return boundary-only for outline rendering
    """
    type_map = {"node": "node", "way": "way", "relation": "rel"}
    ql_type = type_map.get(osm_type, osm_type)

    # Always fetch the boundary first — we need it for metadata and as fallback
    boundary_query = f'''
[out:json][timeout:20];
{ql_type}({osm_id});
out body geom;
'''
    boundary_data: dict | None = None
    try:
        boundary_data = await _rate_limited_query(boundary_query, timeout_seconds=25)
    except Exception:
        pass

    if not boundary_data or not boundary_data.get("elements"):
        return boundary_data or {"elements": []}

    # Strategy 1: map_to_area — most accurate, queries within the course polygon
    area_query = f'''
[out:json][timeout:30];
{ql_type}({osm_id});
map_to_area -> .course_area;
{ql_type}({osm_id});
out body geom;
(
  nwr["golf"](area.course_area);
  nwr["natural"="water"](area.course_area);
  nwr["natural"="sand"](area.course_area);
);
out body geom;
'''
    try:
        area_data = await _rate_limited_query(area_query, timeout_seconds=35)
        if _has_golf_sub_features(area_data):
            return area_data
    except Exception:
        pass

    # Strategy 2: bbox query — compute bbox from boundary, query within it
    bbox = _extract_bbox(boundary_data.get("elements", []))
    if bbox:
        bbox_query = f'''
[out:json][timeout:30];
{ql_type}({osm_id});
out body geom;
(
  nwr["golf"]({bbox});
  nwr["natural"="water"]({bbox});
  nwr["natural"="sand"]({bbox});
);
out body geom;
'''
        try:
            bbox_data = await _rate_limited_query(bbox_query, timeout_seconds=35)
            if _has_golf_sub_features(bbox_data):
                return bbox_data
        except Exception:
            pass

    # Strategy 3: No golf sub-features found anywhere.
    # Return boundary data so the processor can render the course outline.
    return boundary_data
