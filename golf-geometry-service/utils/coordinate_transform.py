"""Coordinate transformation utilities.

Pipeline: Vision [0,1] → lat/lon → SVG space
"""

import math


def image_normalized_to_latlon(
    points: list[list[float]],
    hole_lat: float,
    hole_lon: float,
    image_scale: float,
    rotation: float,
    lat2y: float,
    lon2x: float,
    image_width: int = 800,
    image_height: int = 800,
) -> list[tuple[float, float]]:
    """Convert normalized [0,1] image coordinates to geographic lat/lon.

    Args:
        points: List of [x, y] in [0,1] normalized space.
        hole_lat: Center latitude of the satellite image (from BlueGolf).
        hole_lon: Center longitude of the satellite image.
        image_scale: Meters per pixel scale factor (from BlueGolf).
        rotation: Image rotation in radians (from BlueGolf).
        lat2y: Latitude to Y conversion factor.
        lon2x: Longitude to X conversion factor.
        image_width: Satellite image width in pixels.
        image_height: Satellite image height in pixels.

    Returns:
        List of (lat, lon) tuples.
    """
    cx = image_width / 2
    cy = image_height / 2
    cos_a = math.cos(rotation)
    sin_a = math.sin(rotation)

    result = []
    for pt in points:
        # Pixel position
        px = pt[0] * image_width
        py = pt[1] * image_height

        # Offset from image center
        dx = px - cx
        dy = py - cy

        # Undo rotation
        rdx = dx * cos_a - dy * sin_a
        rdy = dx * sin_a + dy * cos_a

        # Convert pixel offset to geographic offset
        # image_scale = meters per pixel, lat2y/lon2x = meters per degree
        if lat2y != 0 and lon2x != 0:
            lat = hole_lat - (rdy * image_scale / lat2y)
            lon = hole_lon + (rdx * image_scale / lon2x)
        else:
            # Fallback: approximate using standard conversions
            meters_per_deg_lat = 111320.0
            meters_per_deg_lon = 111320.0 * math.cos(math.radians(hole_lat))
            lat = hole_lat - (rdy * image_scale / meters_per_deg_lat)
            lon = hole_lon + (rdx * image_scale / meters_per_deg_lon)

        result.append((lat, lon))
    return result


def latlon_to_svg(
    points: list[tuple[float, float]],
    min_lat: float,
    max_lat: float,
    min_lon: float,
    max_lon: float,
    svg_width: float = 800.0,
    svg_height: float = 1000.0,
) -> list[tuple[float, float]]:
    """Convert geographic lat/lon to SVG viewport coordinates.

    Args:
        points: List of (lat, lon) tuples.
        min_lat, max_lat, min_lon, max_lon: Bounding box.
        svg_width, svg_height: SVG viewport dimensions.

    Returns:
        List of (x, y) tuples in SVG space.
    """
    lat_range = max_lat - min_lat
    lon_range = max_lon - min_lon

    if lat_range == 0 or lon_range == 0:
        return [(svg_width / 2, svg_height / 2)] * len(points)

    # Maintain aspect ratio
    lat_scale = svg_height / lat_range
    lon_scale = svg_width / lon_range
    scale = min(lat_scale, lon_scale) * 0.9  # 90% of viewport with padding

    # Centering offsets
    actual_width = lon_range * scale
    actual_height = lat_range * scale
    x_offset = (svg_width - actual_width) / 2
    y_offset = (svg_height - actual_height) / 2

    result = []
    for lat, lon in points:
        x = (lon - min_lon) * scale + x_offset
        y = (max_lat - lat) * scale + y_offset  # Flip Y axis
        result.append((round(x, 2), round(y, 2)))
    return result


def compute_centroid(points: list[tuple[float, float]]) -> tuple[float, float]:
    """Compute the centroid of a polygon."""
    if not points:
        return (0.0, 0.0)
    x_sum = sum(p[0] for p in points)
    y_sum = sum(p[1] for p in points)
    n = len(points)
    return (round(x_sum / n, 2), round(y_sum / n, 2))


def compute_bounds_from_holes(
    holes_latlon: list[list[tuple[float, float]]],
) -> tuple[float, float, float, float]:
    """Compute bounding box from all hole coordinate lists.

    Returns (min_lat, max_lat, min_lon, max_lon).
    """
    all_lats = []
    all_lons = []
    for hole_points in holes_latlon:
        for lat, lon in hole_points:
            all_lats.append(lat)
            all_lons.append(lon)

    if not all_lats:
        return (0.0, 0.0, 0.0, 0.0)

    # Add small padding
    lat_pad = (max(all_lats) - min(all_lats)) * 0.05
    lon_pad = (max(all_lons) - min(all_lons)) * 0.05

    return (
        min(all_lats) - lat_pad,
        max(all_lats) + lat_pad,
        min(all_lons) - lon_pad,
        max(all_lons) + lon_pad,
    )
