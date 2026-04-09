from fastapi import APIRouter, HTTPException
from models.course import CourseResponse, CourseMetadata
from services.overpass import fetch_course_data
from services.processor import process_osm_data
from services import cache

router = APIRouter()


@router.get("/course/{osm_type}/{osm_id}", response_model=CourseResponse)
async def get_course(osm_type: str, osm_id: int):
    if osm_type not in ("node", "way", "relation"):
        raise HTTPException(400, "osm_type must be node, way, or relation")

    cache_key = f"{osm_type}_{osm_id}"
    cached = cache.get(cache_key)
    if cached:
        # Don't serve cached results that have zero features (stale failures)
        features = cached.get("geojson", {}).get("features", [])
        if features:
            return CourseResponse(
                metadata=CourseMetadata(**cached["metadata"]),
                geojson=cached["geojson"],
            )

    raw_data = await fetch_course_data(osm_type, osm_id)
    if not raw_data.get("elements"):
        raise HTTPException(404, "Course not found or no data available")

    processed = process_osm_data(raw_data)

    # Only cache results that have renderable features
    if processed["geojson"]["features"]:
        cache.put(cache_key, processed)

    return CourseResponse(
        metadata=CourseMetadata(**processed["metadata"]),
        geojson=processed["geojson"],
    )
