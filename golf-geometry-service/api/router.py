"""API endpoints for the Golf Geometry Service."""

import logging
import re
from typing import Optional

from fastapi import APIRouter, HTTPException, Request

from api.schemas import (
    CourseGeometryRequest,
    CourseGeometryResponse,
    CourseSearchItem,
    CourseSearchResponse,
    ErrorResponse,
    HealthResponse,
)
from services.bluegolf_client import BlueGolfClient, BlueGolfNotFoundError
from services.cache_service import CacheService
from services.course_lookup import CourseLookupService
from services.geometry_estimator import GeometryEstimator
from services.osm_fetcher import OSMFetcher

logger = logging.getLogger(__name__)
router = APIRouter()

# Service instances
bluegolf_client = BlueGolfClient()
course_lookup = CourseLookupService(bluegolf_client)
geometry_estimator = GeometryEstimator()
osm_fetcher = OSMFetcher()


def _get_cache(request: Request) -> CacheService:
    return request.app.state.cache


def _make_cache_key(handle: Optional[str], course_name: str, source: str = "osm") -> str:
    if handle:
        return f"{source}:bluegolf:{handle}"
    normalized = re.sub(r"[^a-z0-9]", "", course_name.lower())
    return f"{source}:name:{normalized}"


@router.post(
    "/course/geometry",
    response_model=CourseGeometryResponse,
    responses={404: {"model": ErrorResponse}, 503: {"model": ErrorResponse}},
)
async def get_course_geometry(
    request_body: CourseGeometryRequest,
    request: Request,
):
    """Extract golf course geometry.

    Pipeline priority:
    1. Cache hit
    2. OSM Overpass API — real polygon data (most accurate)
    3. Gemini AI satellite tracing (if GEMINI_API_KEY set)
    4. BlueGolf data + geometric estimation (last resort)
    """
    cache = _get_cache(request)
    course_name = request_body.course_name
    location = request_body.location

    # Step 1: Resolve BlueGolf handle (needed for coordinates)
    handle = request_body.bluegolf_handle
    if not handle:
        handle = await cache.get_handle(course_name)
    if not handle:
        handle = await course_lookup.resolve_handle(course_name, location)
        if handle:
            await cache.store_handle(course_name, handle)

    # Step 2: Check cache
    osm_key = _make_cache_key(handle, course_name, "osm")
    geo_key = _make_cache_key(handle, course_name, "geo")

    if not request_body.force_refresh:
        cached = await cache.get_geometry(osm_key)
        if cached:
            logger.info(f"Cache hit (OSM) for {osm_key}")
            return cached
        cached = await cache.get_geometry(geo_key)
        if cached:
            logger.info(f"Cache hit (geo) for {geo_key}")
            return cached

    # Step 3: Get course center coordinates from BlueGolf
    course_data = None
    center_lat, center_lon = None, None
    hole_count = 18

    if handle:
        try:
            course_data = await bluegolf_client.fetch_course_data(handle)
            hole_count = len(course_data.holes)
            if course_data.course and course_data.course.lat and course_data.course.lon:
                center_lat = course_data.course.lat
                center_lon = course_data.course.lon
            else:
                lats = [h.green.lat for h in course_data.holes if h.green and h.green.lat]
                lons = [h.green.lon for h in course_data.holes if h.green and h.green.lon]
                if lats:
                    center_lat = sum(lats) / len(lats)
                    center_lon = sum(lons) / len(lons)
        except BlueGolfNotFoundError:
            logger.info(f"BlueGolf has no data for '{handle}'")
        except Exception as e:
            logger.error(f"BlueGolf error for '{handle}': {e}", exc_info=True)

    # Step 4: Try OSM Overpass API (real polygon data — best quality)
    if center_lat and center_lon:
        try:
            osm_result = await osm_fetcher.fetch_course_features(
                center_lat, center_lon, course_name
            )
            if osm_result and len(osm_result.features) >= 10:
                osm_result.course_name = course_name
                await cache.store_geometry(osm_key, osm_result)
                logger.info(
                    f"OSM success: {len(osm_result.features)} features "
                    f"for '{course_name}'"
                )
                return osm_result
        except Exception as e:
            logger.error(f"OSM pipeline failed: {e}", exc_info=True)

    # Step 5: Try Gemini AI satellite tracing
    if center_lat and center_lon:
        ai_key = _make_cache_key(handle, course_name, "gemini")
        ai_result = await _try_ai_pipeline(
            course_name, center_lat, center_lon, hole_count
        )
        if ai_result:
            await cache.store_geometry(ai_key, ai_result)
            return ai_result

    # Step 6: Fall back to geometric estimation from BlueGolf points
    if course_data:
        try:
            result = geometry_estimator.estimate(course_data)
            await cache.store_geometry(geo_key, result)
            return result
        except Exception as e:
            logger.error(f"Estimation error: {e}", exc_info=True)

    raise HTTPException(
        status_code=404,
        detail={
            "error": "course_not_found",
            "message": f"Could not extract geometry for '{course_name}'",
            "suggestion": "Try providing the bluegolf_handle directly.",
        },
    )


async def _try_ai_pipeline(
    course_name: str,
    center_lat: float,
    center_lon: float,
    hole_count: int,
) -> Optional[CourseGeometryResponse]:
    """Gemini satellite tracing fallback. Returns None on failure."""
    from config import settings

    if not settings.gemini_api_key:
        return None

    try:
        from services.satellite_fetcher import SatelliteFetcher
        from services.gemini_tracer import GeminiTracer

        fetcher = SatelliteFetcher()
        image_bytes, bounds, img_w, img_h = await fetcher.fetch_course_image(
            center_lat, center_lon
        )

        tracer = GeminiTracer()
        holes = await tracer.trace_course(
            image_bytes, img_w, img_h, course_name
        )

        if not holes:
            return None

        from api.schemas import BoundsResponse, FeatureResponse
        import time

        latlon_features = tracer.generate_features(holes, bounds, img_w, img_h)
        if len(latlon_features) < 3:
            return None

        features = []
        all_lats, all_lons = [], []
        for feat in latlon_features:
            pts = feat["points"]
            c_lon = sum(p[0] for p in pts) / len(pts)
            c_lat = sum(p[1] for p in pts) / len(pts)
            features.append(FeatureResponse(
                type=feat["type"], points=pts,
                centroid=[c_lon, c_lat],
                hole_number=feat.get("hole_number"),
            ))
            all_lats.extend(p[1] for p in pts)
            all_lons.extend(p[0] for p in pts)

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
            source="gemini+satellite",
            course_name=course_name,
            hole_count=len(holes),
            confidence=0.7,
            metadata={"method": "gemini_satellite_tracing"},
        )
    except Exception as e:
        logger.error(f"AI pipeline failed: {e}", exc_info=True)
        return None


@router.get("/course/search", response_model=CourseSearchResponse)
async def search_courses(q: str, request: Request):
    """Search for golf courses by name."""
    if len(q) < 2:
        raise HTTPException(status_code=422, detail="Query too short")

    handle = await course_lookup.resolve_handle(q)
    results = []
    if handle:
        try:
            course_data = await bluegolf_client.fetch_course_data(handle)
            name = q
            loc = ""
            if course_data.course:
                name = course_data.course.name or q
                parts = [course_data.course.city, course_data.course.state]
                loc = ", ".join(p for p in parts if p)
            results.append(CourseSearchItem(
                handle=handle, name=name, location=loc,
                has_tour_data=len(course_data.holes) > 0, confidence=0.9,
            ))
        except BlueGolfNotFoundError:
            pass

    return CourseSearchResponse(results=results)


@router.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(status="ok", version="1.0.0")
