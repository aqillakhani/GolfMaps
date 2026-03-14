from shapely.geometry import shape, mapping, Polygon, MultiPolygon, LineString, Point
from shapely.validation import make_valid

TAG_CLASSIFICATION = [
    (lambda t: t.get("golf") == "fairway", "fairway"),
    (lambda t: t.get("golf") == "green" or t.get("golf") == "putting_green", "green"),
    (lambda t: t.get("golf") == "bunker" or t.get("natural") == "sand", "bunker"),
    (lambda t: t.get("golf") == "tee", "tee"),
    (lambda t: t.get("golf") == "water_hazard" or t.get("natural") == "water", "water"),
    (lambda t: t.get("golf") == "rough", "rough"),
    (lambda t: t.get("golf") == "hole", "hole"),
    (lambda t: t.get("natural") == "wood" or t.get("landuse") == "forest", "trees"),
    (lambda t: t.get("leisure") == "golf_course", "boundary"),
]


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

    return {
        "metadata": metadata,
        "geojson": {
            "type": "FeatureCollection",
            "features": features,
        },
    }
