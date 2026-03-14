import asyncio
import time
import httpx

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
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


async def search_courses(query: str, limit: int = 10) -> list[dict]:
    """Search using Nominatim (fast text search) filtered to golf courses."""
    global _last_nominatim_time
    async with _nominatim_lock:
        now = time.time()
        wait = max(0, 1.1 - (now - _last_nominatim_time))
        if wait > 0:
            await asyncio.sleep(wait)

        params = {
            "q": f"{query} golf course",
            "format": "json",
            "limit": limit,
            "extratags": 1,
            "namedetails": 1,
            "addressdetails": 1,
        }
        headers = {"User-Agent": "GolfMapPoster/1.0"}

        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(NOMINATIM_URL, params=params, headers=headers)
            response.raise_for_status()
            _last_nominatim_time = time.time()
            data = response.json()

    results = []
    for item in data:
        # Filter to golf-related results
        osm_type = item.get("osm_type", "")  # "relation", "way", "node"
        extra = item.get("extratags", {})
        category = item.get("class", "")
        item_type = item.get("type", "")

        is_golf = (
            category == "leisure" and item_type == "golf_course"
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
  nwr["natural"="wood"](area.course_area);
  nwr["landuse"="forest"](area.course_area);
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
  nwr["natural"="wood"]({bbox});
  nwr["landuse"="forest"]({bbox});
);
out body geom;
'''
        return await _rate_limited_query(bbox_query)
