import statistics

from shapely.geometry import shape, mapping, Polygon, MultiPolygon, LineString, Point
from shapely.ops import unary_union
from shapely.validation import make_valid

TAG_CLASSIFICATION = [
    (lambda t: t.get("golf") == "fairway", "fairway"),
    (lambda t: t.get("golf") == "green" or t.get("golf") == "putting_green", "green"),
    (lambda t: t.get("golf") == "bunker" or t.get("natural") == "sand", "bunker"),
    (lambda t: t.get("golf") == "tee", "tee"),
    (lambda t: t.get("golf") in ("water_hazard", "lateral_water_hazard") or t.get("natural") == "water", "water"),
    (lambda t: t.get("golf") == "rough", "rough"),
    (lambda t: t.get("golf") == "hole", "hole"),
    # boundary kept for metadata extraction and outline fallback
    (lambda t: t.get("leisure") == "golf_course", "boundary"),
]

# Feature types to include in rendered GeoJSON output
RENDERABLE_TYPES = {"fairway", "green", "bunker", "tee", "water", "rough", "hole", "outline"}
# Note: "hole" features are included for labeling (hole numbers) even though
# they aren't rendered as visible paths in the frontend LAYER_ORDER.
# "outline" is used as a fallback when no golf sub-features exist.


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
    """Validate and fix geometry using Shapely.

    If Shapely returns a GeometryCollection (e.g., from make_valid on a
    self-intersecting polygon), extract the largest Polygon/MultiPolygon
    from it so D3 can render it as a path.
    """
    try:
        geom = shape(geojson_geom)
        if geom.is_empty:
            return None
        if not geom.is_valid:
            geom = make_valid(geom)
        if geom.is_empty:
            return None
        # Decompose GeometryCollection → largest polygon
        result = mapping(geom)
        if result.get("type") == "GeometryCollection":
            best = _extract_largest_polygon(geom)
            if best is None:
                return None
            result = mapping(best)
        return result
    except Exception:
        return None


def _extract_largest_polygon(geom) -> Polygon | MultiPolygon | None:
    """Extract the largest Polygon/MultiPolygon from a GeometryCollection."""
    from shapely.geometry import GeometryCollection as GC
    best = None
    best_area = 0.0
    for g in getattr(geom, "geoms", []):
        if isinstance(g, (Polygon, MultiPolygon)) and g.area > best_area:
            best = g
            best_area = g.area
    return best


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

    # Fallback: if no golf sub-features exist, promote boundary to outline
    # so the course shape is still visible on the poster.
    if not rendered_features:
        boundary_features = [f for f in features if f["properties"]["type"] == "boundary"]
        for bf in boundary_features:
            outline = {
                "type": "Feature",
                "geometry": bf["geometry"],
                "properties": {**bf["properties"], "type": "outline"},
            }
            rendered_features.append(outline)

    # Remove geographic outliers when the bbox query pulled in features from
    # adjacent/secondary courses. Two signals trigger filtering:
    #   1. Multiple leisure=golf_course boundaries (resort complex).
    #   2. Duplicate hole refs in the 1-9 range — indicates a par-3 or practice
    #      course mixed in alongside the main 18 (e.g. Augusta's Par 3 Course).
    # Single-facility 36-hole layouts like LaFortune don't have duplicate refs
    # for the same hole number, so they're unaffected.
    boundary_count = sum(
        1 for f in features if f["properties"]["type"] == "boundary"
    )
    hole_refs_1_9: dict[str, int] = {}
    for f in rendered_features:
        if f["properties"]["type"] == "hole":
            ref = f["properties"].get("ref", "")
            if ref.isdigit() and 1 <= int(ref) <= 9:
                hole_refs_1_9[ref] = hole_refs_1_9.get(ref, 0) + 1
    has_duplicate_holes = any(count > 1 for count in hole_refs_1_9.values())

    if (boundary_count > 1 or has_duplicate_holes) and len(rendered_features) >= 5:
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

    # Track which specific hole features belong to the main course so we can
    # drop duplicates from secondary (par-3 / practice) courses explicitly.
    main_hole_ids: set[int] = set()
    for ref_num in range(10, 19):
        for f in by_ref.get(str(ref_num), []):
            main_hole_ids.add(id(f))
    for ref_num in range(1, 10):
        candidates = by_ref.get(str(ref_num), [])
        if not candidates:
            continue
        if len(candidates) == 1 or anchor_center is None:
            main_hole_ids.add(id(candidates[0]))
        else:
            best_f = None
            best_dist = float("inf")
            for f in candidates:
                geom = _shapely_geom(f["geometry"])
                if geom:
                    dist = geom.centroid.distance(anchor_center)
                    if dist < best_dist:
                        best_dist = dist
                        best_f = f
            if best_f is not None:
                main_hole_ids.add(id(best_f))

    # Build a tight keep-zone: convex hull of all main holes, then buffer by
    # ~15% of the hull's diagonal. This envelops fairways/greens/bunkers that
    # flank each hole but excludes spatially separated clusters like Augusta's
    # Par 3 Course, which sits adjacent to but outside the main routing.
    hull = unary_union(main_geoms).convex_hull
    minx, miny, maxx, maxy = hull.bounds
    diag = ((maxx - minx) ** 2 + (maxy - miny) ** 2) ** 0.5
    buffer_dist = diag * 0.05
    keep_zone = hull.buffer(buffer_dist)

    result = []
    for f in features:
        # Drop duplicate hole features that belong to a secondary course.
        if f["properties"]["type"] == "hole":
            ref = f["properties"].get("ref", "")
            if ref.isdigit() and id(f) not in main_hole_ids:
                continue
            result.append(f)
            continue
        geom = _shapely_geom(f["geometry"])
        if geom is None:
            result.append(f)
            continue
        # Use centroid-in-keep-zone: a feature's centroid tells us where it
        # "lives" better than intersection, which can be tricked by large
        # features (e.g. a water hazard stretching between courses).
        if keep_zone.contains(geom.centroid) or keep_zone.intersects(geom):
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
