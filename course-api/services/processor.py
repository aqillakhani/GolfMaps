import statistics

from shapely.geometry import shape, mapping, Polygon, MultiPolygon, LineString, Point
from shapely.ops import unary_union
from shapely.validation import make_valid

TAG_CLASSIFICATION = [
    (lambda t: t.get("golf") == "fairway", "fairway"),
    (lambda t: t.get("golf") == "green" or t.get("golf") == "putting_green", "green"),
    (lambda t: t.get("golf") == "bunker" or t.get("natural") == "sand", "bunker"),
    (lambda t: t.get("golf") == "tee", "tee"),
    (lambda t: t.get("golf") == "water_hazard" or t.get("natural") == "water", "water"),
    (lambda t: t.get("golf") == "rough", "rough"),
    (lambda t: t.get("golf") == "hole", "hole"),
    # boundary kept for metadata extraction only — geometry excluded from output
    (lambda t: t.get("leisure") == "golf_course", "boundary"),
]

# Feature types to include in rendered GeoJSON output
RENDERABLE_TYPES = {"fairway", "green", "bunker", "tee", "water", "rough", "hole"}
# Note: "hole" features are included for labeling (hole numbers) even though
# they aren't rendered as visible paths in the frontend LAYER_ORDER.


def _element_to_geometry(element: dict) -> dict | None:
    """Convert OSM element with inline geometry to GeoJSON geometry."""
    el_type = element.get("type")

    if el_type == "node":
        if "lat" in element and "lon" in element:
            return {"type": "Point", "coordinates": [element["lon"], element["lat"]]}
        return None

    if el_type == "way":
        geom = element.get("geometry", [])
        if len(geom) < 2:
            return None
        coords = [[pt["lon"], pt["lat"]] for pt in geom]
        # If first == last and >= 4 points, it's a polygon
        if len(coords) >= 4 and coords[0] == coords[-1]:
            return {"type": "Polygon", "coordinates": [coords]}
        return {"type": "LineString", "coordinates": coords}

    if el_type == "relation":
        members = element.get("members", [])
        outers = []
        inners = []
        for member in members:
            if member.get("type") != "way" or "geometry" not in member:
                continue
            coords = [[pt["lon"], pt["lat"]] for pt in member["geometry"]]
            if len(coords) < 3:
                continue
            # Close ring if needed
            if coords[0] != coords[-1]:
                coords.append(coords[0])
            role = member.get("role", "outer")
            if role == "inner":
                inners.append(coords)
            else:
                outers.append(coords)

        if not outers:
            return None

        if len(outers) == 1:
            return {"type": "Polygon", "coordinates": [outers[0]] + inners}

        # Multiple outers = MultiPolygon
        # Simple approach: each outer gets no inners (could be improved)
        polygons = [[outer] for outer in outers]
        return {"type": "MultiPolygon", "coordinates": polygons}

    return None


def _classify(tags: dict) -> str | None:
    for predicate, feature_type in TAG_CLASSIFICATION:
        if predicate(tags):
            return feature_type
    return None


def _validate_geometry(geojson_geom: dict) -> dict | None:
    """Validate and fix geometry using Shapely."""
    try:
        geom = shape(geojson_geom)
        if geom.is_empty:
            return None
        if not geom.is_valid:
            geom = make_valid(geom)
        if geom.is_empty:
            return None
        return mapping(geom)
    except Exception:
        return None


def process_osm_data(raw_data: dict) -> dict:
    """Convert raw Overpass JSON to classified GeoJSON FeatureCollection."""
    features = []
    metadata = {"name": None, "location": None, "holes": None, "par": None}

    for element in raw_data.get("elements", []):
        tags = element.get("tags", {})
        feature_type = _classify(tags)
        if feature_type is None:
            continue

        geojson_geom = _element_to_geometry(element)
        if geojson_geom is None:
            continue

        validated = _validate_geometry(geojson_geom)
        if validated is None:
            continue

        # Extract metadata from boundary
        if feature_type == "boundary":
            metadata["name"] = tags.get("name", metadata["name"])
            addr = tags
            location_parts = [addr.get("addr:city", ""), addr.get("addr:state", ""), addr.get("addr:country", "")]
            loc = ", ".join(p for p in location_parts if p)
            if loc:
                metadata["location"] = loc
            if tags.get("golf:holes"):
                try:
                    metadata["holes"] = int(tags["golf:holes"])
                except ValueError:
                    pass
            if tags.get("golf:par"):
                try:
                    metadata["par"] = int(tags["golf:par"])
                except ValueError:
                    pass

        # Extract hole number from ref tag
        properties = {"type": feature_type}
        if tags.get("ref"):
            properties["ref"] = tags["ref"]
        if tags.get("name"):
            properties["name"] = tags["name"]
        if tags.get("par"):
            properties["par"] = tags["par"]
        if tags.get("handicap"):
            properties["handicap"] = tags["handicap"]
        if tags.get("distance"):
            properties["distance"] = tags["distance"]

        features.append({
            "type": "Feature",
            "geometry": validated,
            "properties": properties,
        })

    # Exclude boundary geometry from output — it inflates the projection
    # for resort complexes (e.g. Pinehurst with 9 courses)
    rendered_features = [f for f in features if f["properties"]["type"] in RENDERABLE_TYPES]

    # Remove geographic outliers (practice facilities, adjacent courses, etc.)
    rendered_features = _remove_outliers(rendered_features)

    return {
        "metadata": metadata,
        "geojson": {
            "type": "FeatureCollection",
            "features": rendered_features,
        },
    }


def _shapely_geom(geojson_geom: dict):
    """Convert GeoJSON geometry dict to a Shapely geometry, or None."""
    try:
        geom = shape(geojson_geom)
        return geom if not geom.is_empty else None
    except Exception:
        return None


def _remove_outliers(features: list[dict]) -> list[dict]:
    """Remove features outside the main 18-hole course footprint.

    Strategy:
    1. If hole features with ref numbers exist, identify the 18 main-course holes
       (refs 1-18), build a convex hull around them, and keep only features that
       intersect with a buffered version of that hull.
    2. Otherwise, fall back to IQR-based outlier detection on fairway+green centroids.

    This eliminates practice facilities, par-3 courses, driving ranges, and
    adjacent course features that share the same OSM boundary.
    """
    if len(features) < 5:
        return features

    result = _filter_by_hole_routing(features)
    if result is not None:
        return result

    return _filter_by_iqr(features)


def _filter_by_hole_routing(features: list[dict]) -> list[dict] | None:
    """Use hole features (ref 1-18) to define the main course footprint.

    When duplicate refs exist (e.g., main course + par-3 course both have holes 1-9),
    uses the back 9 (refs 10-18) as anchors to disambiguate which set of front-9
    holes belong to the main course.
    """
    hole_features = [
        f for f in features
        if f["properties"]["type"] == "hole" and f["properties"].get("ref", "").isdigit()
    ]
    if len(hole_features) < 9:
        return None

    # Group holes by ref number
    by_ref: dict[str, list] = {}
    for f in hole_features:
        ref = f["properties"]["ref"]
        by_ref.setdefault(ref, []).append(f)

    # Back 9 holes (10-18) are unique to the main course — use as anchors
    back9_geoms = []
    for ref_num in range(10, 19):
        ref = str(ref_num)
        if ref in by_ref:
            for f in by_ref[ref]:
                geom = _shapely_geom(f["geometry"])
                if geom:
                    back9_geoms.append(geom)

    # Compute back-9 center for disambiguation
    if back9_geoms:
        back9_union = unary_union(back9_geoms)
        anchor_center = back9_union.centroid
    else:
        anchor_center = None

    # Select one hole per ref for front 9, preferring the one closest to back-9 center
    main_geoms = list(back9_geoms)
    for ref_num in range(1, 10):
        ref = str(ref_num)
        candidates = by_ref.get(ref, [])
        if not candidates:
            continue
        if len(candidates) == 1 or anchor_center is None:
            geom = _shapely_geom(candidates[0]["geometry"])
            if geom:
                main_geoms.append(geom)
        else:
            # Pick the candidate closest to the back-9 center
            best_geom = None
            best_dist = float("inf")
            for f in candidates:
                geom = _shapely_geom(f["geometry"])
                if geom:
                    dist = geom.centroid.distance(anchor_center)
                    if dist < best_dist:
                        best_dist = dist
                        best_geom = geom
            if best_geom:
                main_geoms.append(best_geom)

    if len(main_geoms) < 9:
        return None

    # Buffer each hole line individually to create corridor zones.
    # Use ~30% of the average hole length as buffer width — wide enough to
    # capture fairways, greens, bunkers, and water hazards flanking each hole,
    # but tight enough to exclude features from adjacent par-3 courses or
    # practice facilities that sit between main-course holes.
    lengths = [g.length for g in main_geoms if g.length > 0]
    avg_length = sum(lengths) / len(lengths) if lengths else 0.003
    buffer_dist = avg_length * 0.30

    # Union of all buffered hole corridors
    corridors = unary_union([g.buffer(buffer_dist) for g in main_geoms])

    # Keep features that intersect the corridor zones
    result = []
    for f in features:
        geom = _shapely_geom(f["geometry"])
        if geom is None:
            result.append(f)
            continue
        if corridors.intersects(geom):
            result.append(f)

    # Safety: don't remove too many features
    if len(result) < len(features) * 0.4:
        return None

    return result


def _filter_by_iqr(features: list[dict]) -> list[dict]:
    """Fallback: IQR-based outlier removal using fairway+green centroids."""
    CORE_TYPES = {"fairway", "green"}
    core_centroids: list[tuple[float, float]] = []
    for f in features:
        if f["properties"]["type"] in CORE_TYPES:
            geom = _shapely_geom(f["geometry"])
            if geom:
                c = geom.centroid
                core_centroids.append((c.x, c.y))

    if len(core_centroids) < 3:
        return features

    med_lon = statistics.median(c[0] for c in core_centroids)
    med_lat = statistics.median(c[1] for c in core_centroids)

    core_dists = sorted(
        ((lon - med_lon) ** 2 + (lat - med_lat) ** 2) ** 0.5
        for lon, lat in core_centroids
    )
    n = len(core_dists)
    q1 = core_dists[n // 4]
    q3 = core_dists[(3 * n) // 4]
    iqr = q3 - q1
    threshold = q3 + 2.0 * iqr

    if threshold < 1e-6:
        return features

    result = []
    for f in features:
        geom = _shapely_geom(f["geometry"])
        if geom is None:
            result.append(f)
            continue
        c = geom.centroid
        dist = ((c.x - med_lon) ** 2 + (c.y - med_lat) ** 2) ** 0.5
        if dist <= threshold:
            result.append(f)

    if len(result) < len(features) * 0.6:
        return features

    return result
