import asyncio
import time
import httpx

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
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


async def _rate_limited_query(query: str) -> dict:
    global _last_overpass_time
    async with _overpass_lock:
        now = time.time()
        wait = max(0, 2.0 - (now - _last_overpass_time))
        if wait > 0:
            await asyncio.sleep(wait)
        async with httpx.AsyncClient(timeout=60.0) as client:
            for attempt in range(3):
                response = await client.post(OVERPASS_URL, data={"data": query})
                if response.status_code == 429:
                    retry_after = int(response.headers.get("Retry-After", 5))
                    await asyncio.sleep(retry_after + 1)
                    continue
                response.raise_for_status()
                _last_overpass_time = time.time()
                return response.json()
            response.raise_for_status()
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
    for item in data:
        osm_type = item.get("osm_type", "")
        extra = item.get("extratags", {})
        category = item.get("class", "")
        item_type = item.get("type", "")

        is_golf = (
            (category == "leisure" and item_type == "golf_course")
            or extra.get("leisure") == "golf_course"
            or "golf" in item.get("display_name", "").lower()
        )
        if not is_golf:
            continue

        addr = item.get("address", {})
        location_parts = [
            addr.get("city", addr.get("town", addr.get("village", ""))),
            addr.get("state", ""),
            addr.get("country", ""),
        ]
        location = ", ".join(p for p in location_parts if p) or None

        name = item.get("namedetails", {}).get("name", "") or item.get("display_name", "").split(",")[0]

        results.append({
            "osm_id": int(item["osm_id"]),
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
    """Search using Nominatim (fast text search) filtered to golf courses."""
    headers = {"User-Agent": "GolfMapPoster/1.0"}
    core_name = _strip_golf_suffix(query)

    # Strategy 1: search with "{core_name} golf course"
    data = await _nominatim_search(f"{core_name} golf course", limit, headers)
    results = _parse_golf_results(data, query)
    if results:
        return results

    # Strategy 2: search with just the core name (handles unusual OSM naming)
    data = await _nominatim_search(core_name, limit, headers)
    results = _parse_golf_results(data, query)
    return results


async def fetch_course_data(osm_type: str, osm_id: int) -> dict:
    type_map = {"node": "node", "way": "way", "relation": "rel"}
    ql_type = type_map.get(osm_type, osm_type)

    # Try map_to_area first (works for relations and closed ways)
    overpass_query = f'''
[out:json][timeout:30];
{ql_type}({osm_id});
map_to_area -> .course_area;
{ql_type}({osm_id});
out body geom;
(
  nwr["golf"](area.course_area);
  nwr["natural"="water"](area.course_area);
);
out body geom;
'''
    try:
        return await _rate_limited_query(overpass_query)
    except Exception:
        # Fallback: get boundary first, compute bbox, query within bbox
        boundary_query = f'''
[out:json][timeout:15];
{ql_type}({osm_id});
out body geom;
'''
        boundary_data = await _rate_limited_query(boundary_query)
        elements = boundary_data.get("elements", [])
        if not elements:
            return boundary_data

        # Compute bbox from geometry
        lats, lons = [], []
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

        if not lats:
            return boundary_data

        bbox = f"{min(lats)},{min(lons)},{max(lats)},{max(lons)}"
        bbox_query = f'''
[out:json][timeout:30];
{ql_type}({osm_id});
out body geom;
(
  nwr["golf"]({bbox});
  nwr["natural"="water"]({bbox});
);
out body geom;
'''
        return await _rate_limited_query(bbox_query)
