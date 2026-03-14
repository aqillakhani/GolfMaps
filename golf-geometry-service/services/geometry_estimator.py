"""Generate golf course geometry from BlueGolf structured point data.

Uses geometric estimation (ellipses, corridors, rectangles) instead of
AI vision analysis. This is free — no API keys required.
"""

import math
import logging
import time
from typing import Optional

from api.schemas import BoundsResponse, CourseGeometryResponse, FeatureResponse
from models.bluegolf import BlueGolfFeature, BlueGolfHole, BlueGolfResponse
from utils.coordinate_transform import (
    compute_bounds_from_holes,
    compute_centroid,
    latlon_to_svg,
)
from utils.polygon_simplification import simplify_polygon
from config import settings

logger = logging.getLogger(__name__)

# Typical golf feature sizes in meters
GREEN_RADIUS_M = 15.0       # ~16 yards, average green radius
GREEN_DEPTH_RATIO = 1.3     # greens are slightly elongated front-to-back
BUNKER_RADIUS_M = 8.0       # ~9 yards
TEE_LENGTH_M = 12.0         # ~13 yards long
TEE_WIDTH_M = 6.0           # ~7 yards wide
FAIRWAY_WIDTH_M = 35.0      # ~38 yards wide


def _ellipse_points(
    center_lat: float,
    center_lon: float,
    radius_lat: float,
    radius_lon: float,
    rotation: float = 0.0,
    n_points: int = 16,
) -> list[tuple[float, float]]:
    """Generate ellipse polygon points in lat/lon."""
    points = []
    cos_r = math.cos(rotation)
    sin_r = math.sin(rotation)
    for i in range(n_points):
        angle = 2 * math.pi * i / n_points
        x = radius_lon * math.cos(angle)
        y = radius_lat * math.sin(angle)
        # Rotate
        rx = x * cos_r - y * sin_r
        ry = x * sin_r + y * cos_r
        points.append((center_lat + ry, center_lon + rx))
    return points


def _rectangle_points(
    center_lat: float,
    center_lon: float,
    half_length_lat: float,
    half_width_lon: float,
    rotation: float = 0.0,
) -> list[tuple[float, float]]:
    """Generate rotated rectangle polygon points in lat/lon."""
    cos_r = math.cos(rotation)
    sin_r = math.sin(rotation)
    corners = [
        (-half_width_lon, -half_length_lat),
        (half_width_lon, -half_length_lat),
        (half_width_lon, half_length_lat),
        (-half_width_lon, half_length_lat),
    ]
    points = []
    for dx, dy in corners:
        rx = dx * cos_r - dy * sin_r
        ry = dx * sin_r + dy * cos_r
        points.append((center_lat + ry, center_lon + rx))
    return points


def _corridor_points(
    path: list[tuple[float, float]],
    width_lat: float,
    width_lon: float,
) -> list[tuple[float, float]]:
    """Generate a corridor polygon around a path of lat/lon points.

    Creates an offset on each side of the path to form a closed polygon.
    """
    if len(path) < 2:
        return []

    left_side = []
    right_side = []

    for i in range(len(path)):
        if i == 0:
            dx = path[1][1] - path[0][1]
            dy = path[1][0] - path[0][0]
        elif i == len(path) - 1:
            dx = path[i][1] - path[i - 1][1]
            dy = path[i][0] - path[i - 1][0]
        else:
            dx = path[i + 1][1] - path[i - 1][1]
            dy = path[i + 1][0] - path[i - 1][0]

        length = math.hypot(dx, dy)
        if length == 0:
            nx, ny = 0, 0
        else:
            # Normal vector (perpendicular to path direction)
            nx = -dy / length
            ny = dx / length

        # Taper the width: narrower at tee, wider in middle, narrower at green
        t = i / max(len(path) - 1, 1)
        # Bell curve taper: widest at 40% of the way
        taper = math.sin(math.pi * min(t * 1.5, 1.0)) * 0.8 + 0.2

        left_side.append((
            path[i][0] + nx * width_lat * taper,
            path[i][1] + ny * width_lon * taper,
        ))
        right_side.append((
            path[i][0] - nx * width_lat * taper,
            path[i][1] - ny * width_lon * taper,
        ))

    # Close the polygon: left side forward, right side backward
    return left_side + list(reversed(right_side))


def _point_to_latlon(
    point_x: float,
    point_y: float,
    hole: BlueGolfHole,
) -> tuple[float, float]:
    """Convert a BlueGolf image-relative point to lat/lon using the hole's green as reference."""
    if not hole.green or not hole.green.lat or not hole.green.lon:
        return (0.0, 0.0)

    g = hole.green
    scale = g.imageScale or 1.0
    rotation = g.rotation or 0.0
    lat2y = g.lat2y or 110944.0
    lon2x = g.lon2x or 91000.0

    # Points are in image pixel coordinates relative to the green center
    cos_r = math.cos(rotation)
    sin_r = math.sin(rotation)

    # Undo rotation
    rx = point_x * cos_r - point_y * sin_r
    ry = point_x * sin_r + point_y * cos_r

    # Convert pixel offset to meters, then to degrees
    lat = g.lat - (ry * scale / lat2y)
    lon = g.lon + (rx * scale / lon2x)
    return (lat, lon)


def _meters_to_degrees(meters: float, lat: float) -> tuple[float, float]:
    """Convert meters to approximate degrees (lat_delta, lon_delta)."""
    lat_deg = meters / 110944.0
    lon_deg = meters / (110944.0 * math.cos(math.radians(lat)))
    return (lat_deg, lon_deg)


class GeometryEstimator:
    """Generates course geometry from BlueGolf point data using geometric shapes."""

    def estimate(self, course_data: BlueGolfResponse) -> CourseGeometryResponse:
        """Generate geometry for all holes without AI."""
        all_features_latlon: list[dict] = []
        all_latlon_points: list[list[tuple[float, float]]] = []

        for i, hole in enumerate(course_data.holes):
            hole_num = i + 1
            hole_points: list[tuple[float, float]] = []

            # Get the hole's reference latitude for degree conversions
            ref_lat = 35.0  # default
            if hole.green and hole.green.lat:
                ref_lat = hole.green.lat

            # 1. Generate GREEN polygon
            green_pts = self._estimate_green(hole, ref_lat)
            if green_pts:
                all_features_latlon.append({
                    "type": "green",
                    "points": green_pts,
                    "hole_number": hole_num,
                })
                hole_points.extend(green_pts)

            # 2. Generate FAIRWAY corridor
            fairway_pts = self._estimate_fairway(hole, ref_lat)
            if fairway_pts:
                all_features_latlon.append({
                    "type": "fairway",
                    "points": fairway_pts,
                    "hole_number": hole_num,
                })
                hole_points.extend(fairway_pts)

            # 3. Generate TEE rectangle
            tee_pts = self._estimate_tee(hole, ref_lat)
            if tee_pts:
                all_features_latlon.append({
                    "type": "tee",
                    "points": tee_pts,
                    "hole_number": hole_num,
                })
                hole_points.extend(tee_pts)

            # 4. Generate BUNKER ellipses from features
            for feat in hole.features:
                feat_type = feat.type.lower() if feat.type else ""
                if "bunker" in feat_type:
                    bunker_pts = self._estimate_bunker(feat, ref_lat)
                    if bunker_pts:
                        all_features_latlon.append({
                            "type": "bunker",
                            "points": bunker_pts,
                            "hole_number": hole_num,
                        })
                        hole_points.extend(bunker_pts)
                elif any(w in feat_type for w in ["water", "lateral", "pond", "creek", "lake", "stream"]):
                    water_pts = self._estimate_water(feat, ref_lat)
                    if water_pts:
                        all_features_latlon.append({
                            "type": "water",
                            "points": water_pts,
                            "hole_number": hole_num,
                        })
                        hole_points.extend(water_pts)

            all_latlon_points.append(hole_points)

        # Compute global bounds
        min_lat, max_lat, min_lon, max_lon = compute_bounds_from_holes(
            all_latlon_points
        )

        if max_lat - min_lat < 0.0001 or max_lon - min_lon < 0.0001:
            center = self._get_course_center(course_data)
            min_lat, max_lat = center[0] - 0.01, center[0] + 0.01
            min_lon, max_lon = center[1] - 0.01, center[1] + 0.01

        # Return features with [lon, lat] GPS coordinates
        # (React app handles SVG projection via projectToSVG/autoFitToCanvas)
        geo_features: list[FeatureResponse] = []
        for feat in all_features_latlon:
            # Convert (lat, lon) tuples to [lon, lat] pairs (GeoJSON/OSM convention)
            lonlat_pts = [[lon, lat] for lat, lon in feat["points"]]
            centroid_lat = sum(p[0] for p in feat["points"]) / len(feat["points"])
            centroid_lon = sum(p[1] for p in feat["points"]) / len(feat["points"])

            geo_features.append(FeatureResponse(
                type=feat["type"],
                points=lonlat_pts,
                centroid=[centroid_lon, centroid_lat],
                hole_number=feat["hole_number"],
            ))

        course_name = ""
        if course_data.course and course_data.course.name:
            course_name = course_data.course.name

        return CourseGeometryResponse(
            features=geo_features,
            bounds=BoundsResponse(
                minLat=min_lat, maxLat=max_lat,
                minLng=min_lon, maxLng=max_lon,
            ),
            timestamp=int(time.time() * 1000),
            source="bluegolf+estimation",
            course_name=course_name,
            hole_count=len(course_data.holes),
            confidence=0.7,
            metadata={
                "method": "geometric_estimation",
                "total_features": len(geo_features),
            },
        )

    def _estimate_green(
        self, hole: BlueGolfHole, ref_lat: float
    ) -> Optional[list[tuple[float, float]]]:
        """Generate a green ellipse from front/center/back points."""
        # Try to use feature lat/lon first
        green_feat = None
        for f in hole.features:
            if f.type and f.type.lower() == "green":
                green_feat = f
                break

        if green_feat and green_feat.frontlat and green_feat.backlat:
            center_lat = (green_feat.frontlat + green_feat.backlat) / 2
            center_lon = (green_feat.frontlon + green_feat.backlon) / 2
            # Depth from front to back
            depth_m = math.hypot(
                (green_feat.backlat - green_feat.frontlat) * 110944,
                (green_feat.backlon - green_feat.frontlon) * 110944 * math.cos(math.radians(ref_lat)),
            )
            depth_m = max(depth_m, 10.0)  # minimum 10m
            # Direction from front to back
            angle = math.atan2(
                green_feat.backlon - green_feat.frontlon,
                green_feat.backlat - green_feat.frontlat,
            )
        elif hole.green and hole.green.lat and hole.green.lon:
            center_lat = hole.green.lat
            center_lon = hole.green.lon
            depth_m = (hole.green.depth or 30.0) * 0.3048  # feet to meters
            angle = hole.green.rotation or 0.0
        else:
            return None

        width_m = depth_m * 0.8  # greens are slightly narrower than deep
        lat_r, lon_r = _meters_to_degrees(depth_m / 2, ref_lat)
        lat_w, lon_w = _meters_to_degrees(width_m / 2, ref_lat)

        return _ellipse_points(center_lat, center_lon, lat_r, lon_w, angle, 16)

    def _estimate_fairway(
        self, hole: BlueGolfHole, ref_lat: float
    ) -> Optional[list[tuple[float, float]]]:
        """Generate a fairway corridor from tee → dogleg → green path."""
        if not hole.green or not hole.green.lat:
            return None

        # Build path from hole points
        path_points: list[tuple[float, float]] = []

        point_map = {p.name: p for p in hole.points}

        # Start from tee (but offset a bit forward as a landing zone)
        tee_pt = point_map.get("tee")
        dogleg_pt = point_map.get("dogleg") or point_map.get("catleg")
        green_front_pt = point_map.get("green_front")

        if tee_pt:
            tee_ll = _point_to_latlon(tee_pt.x, tee_pt.y, hole)
            # Landing zone: 40% from tee toward dogleg/green
            if dogleg_pt:
                dogleg_ll = _point_to_latlon(dogleg_pt.x, dogleg_pt.y, hole)
                landing_lat = tee_ll[0] + 0.4 * (dogleg_ll[0] - tee_ll[0])
                landing_lon = tee_ll[1] + 0.4 * (dogleg_ll[1] - tee_ll[1])
                path_points.append((landing_lat, landing_lon))
            else:
                path_points.append(tee_ll)

        if dogleg_pt:
            path_points.append(_point_to_latlon(dogleg_pt.x, dogleg_pt.y, hole))

        if green_front_pt:
            path_points.append(_point_to_latlon(green_front_pt.x, green_front_pt.y, hole))

        if len(path_points) < 2:
            return None

        # Fairway width in degrees
        width_lat, width_lon = _meters_to_degrees(FAIRWAY_WIDTH_M / 2, ref_lat)

        return _corridor_points(path_points, width_lat, width_lon)

    def _estimate_tee(
        self, hole: BlueGolfHole, ref_lat: float
    ) -> Optional[list[tuple[float, float]]]:
        """Generate a tee box rectangle."""
        point_map = {p.name: p for p in hole.points}
        tee_pt = point_map.get("tee")
        if not tee_pt or not hole.green:
            return None

        tee_ll = _point_to_latlon(tee_pt.x, tee_pt.y, hole)

        # Direction from tee toward dogleg/green for orientation
        dogleg_pt = point_map.get("dogleg")
        if dogleg_pt:
            target_ll = _point_to_latlon(dogleg_pt.x, dogleg_pt.y, hole)
        else:
            target_ll = (hole.green.lat or tee_ll[0], hole.green.lon or tee_ll[1])

        angle = math.atan2(
            target_ll[1] - tee_ll[1],
            target_ll[0] - tee_ll[0],
        )

        half_len_lat, half_len_lon = _meters_to_degrees(TEE_LENGTH_M / 2, ref_lat)
        half_wid_lat, half_wid_lon = _meters_to_degrees(TEE_WIDTH_M / 2, ref_lat)

        return _rectangle_points(tee_ll[0], tee_ll[1], half_len_lat, half_wid_lon, angle)

    def _estimate_bunker(
        self, feat: BlueGolfFeature, ref_lat: float
    ) -> Optional[list[tuple[float, float]]]:
        """Generate a bunker ellipse from feature coordinates."""
        if feat.centerlat and feat.centerlon:
            center = (feat.centerlat, feat.centerlon)
        elif feat.frontlat and feat.frontlon:
            if feat.backlat and feat.backlon:
                center = (
                    (feat.frontlat + feat.backlat) / 2,
                    (feat.frontlon + feat.backlon) / 2,
                )
            else:
                center = (feat.frontlat, feat.frontlon)
        else:
            return None

        radius_m = BUNKER_RADIUS_M
        # If we have front/back, use distance as size hint
        if feat.frontlat and feat.backlat:
            dist = math.hypot(
                (feat.backlat - feat.frontlat) * 110944,
                (feat.backlon - feat.frontlon) * 110944 * math.cos(math.radians(ref_lat)),
            )
            if dist > 2:
                radius_m = dist / 2

        lat_r, lon_r = _meters_to_degrees(radius_m, ref_lat)
        # Bunkers are often elongated
        return _ellipse_points(center[0], center[1], lat_r, lon_r * 1.3, 0.0, 10)

    def _estimate_water(
        self, feat: BlueGolfFeature, ref_lat: float
    ) -> Optional[list[tuple[float, float]]]:
        """Generate a water feature shape."""
        if feat.centerlat and feat.centerlon:
            center = (feat.centerlat, feat.centerlon)
        elif feat.frontlat and feat.frontlon:
            center = (feat.frontlat, feat.frontlon)
        else:
            return None

        # Water features are typically larger than bunkers
        radius_m = 15.0
        lat_r, lon_r = _meters_to_degrees(radius_m, ref_lat)
        return _ellipse_points(center[0], center[1], lat_r, lon_r * 1.5, 0.0, 12)

    @staticmethod
    def _get_course_center(course: BlueGolfResponse) -> tuple[float, float]:
        if course.course and course.course.lat and course.course.lon:
            return (course.course.lat, course.course.lon)
        lats, lons = [], []
        for hole in course.holes:
            if hole.green and hole.green.lat and hole.green.lon:
                lats.append(hole.green.lat)
                lons.append(hole.green.lon)
        if lats:
            return (sum(lats) / len(lats), sum(lons) / len(lons))
        return (35.0, -80.0)
