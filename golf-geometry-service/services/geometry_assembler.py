"""Assembles final course geometry from BlueGolf data + Vision analysis results."""

import logging
import time
from typing import Optional

from api.schemas import BoundsResponse, CourseGeometryResponse, FeatureResponse
from models.bluegolf import BlueGolfHole, BlueGolfResponse
from models.geometry import HoleAnalysisResult
from utils.coordinate_transform import (
    compute_bounds_from_holes,
    compute_centroid,
    image_normalized_to_latlon,
    latlon_to_svg,
)
from utils.polygon_simplification import simplify_polygon
from config import settings

logger = logging.getLogger(__name__)


class GeometryAssembler:
    def assemble(
        self,
        course_data: BlueGolfResponse,
        hole_analyses: list[Optional[HoleAnalysisResult]],
    ) -> CourseGeometryResponse:
        """Combine BlueGolf structural data with Vision polygon analysis.

        Transforms per-hole normalized coordinates into a unified SVG-space
        coordinate system matching the React app's expected format.
        """
        # Step 1: Convert all vision features from [0,1] to lat/lon
        all_holes_latlon: list[list[tuple[float, float]]] = []
        hole_features: list[list[dict]] = []

        for i, (hole, analysis) in enumerate(
            zip(course_data.holes, hole_analyses)
        ):
            hole_latlon_points: list[tuple[float, float]] = []
            hole_feat_data: list[dict] = []

            if analysis is None:
                all_holes_latlon.append([])
                hole_features.append([])
                continue

            # Get hole's coordinate transform parameters
            hole_lat = self._get_hole_lat(hole, course_data)
            hole_lon = self._get_hole_lon(hole, course_data)
            image_scale = self._get_image_scale(hole)
            rotation = self._get_rotation(hole)
            lat2y = self._get_lat2y(hole)
            lon2x = self._get_lon2x(hole)

            for feature in analysis.features:
                geo_points = image_normalized_to_latlon(
                    points=feature.points,
                    hole_lat=hole_lat,
                    hole_lon=hole_lon,
                    image_scale=image_scale,
                    rotation=rotation,
                    lat2y=lat2y,
                    lon2x=lon2x,
                )
                hole_latlon_points.extend(geo_points)
                hole_feat_data.append({
                    "type": feature.type,
                    "geo_points": geo_points,
                    "confidence": feature.confidence,
                    "hole_number": i + 1,
                })

            all_holes_latlon.append(hole_latlon_points)
            hole_features.append(hole_feat_data)

        # Step 2: Compute global bounding box
        min_lat, max_lat, min_lon, max_lon = compute_bounds_from_holes(
            all_holes_latlon
        )

        # If bounds are degenerate, use course-level coordinates
        if max_lat - min_lat < 0.0001 or max_lon - min_lon < 0.0001:
            course_lat, course_lon = self._get_course_center(course_data)
            min_lat = course_lat - 0.01
            max_lat = course_lat + 0.01
            min_lon = course_lon - 0.01
            max_lon = course_lon + 0.01

        # Step 3: Convert all features to SVG space
        all_features: list[FeatureResponse] = []

        for hole_feats in hole_features:
            for feat in hole_feats:
                svg_points = latlon_to_svg(
                    feat["geo_points"],
                    min_lat, max_lat, min_lon, max_lon,
                    settings.svg_width, settings.svg_height,
                )

                # Simplify polygon
                svg_points = simplify_polygon(svg_points, tolerance=1.5)
                centroid = compute_centroid(svg_points)

                all_features.append(FeatureResponse(
                    type=feat["type"],
                    points=[list(p) for p in svg_points],
                    centroid=list(centroid),
                    hole_number=feat["hole_number"],
                ))

        # Compute confidence
        confidences = []
        for analysis in hole_analyses:
            if analysis:
                for f in analysis.features:
                    confidences.append(f.confidence)
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0

        course_name = ""
        if course_data.course and course_data.course.name:
            course_name = course_data.course.name

        return CourseGeometryResponse(
            features=all_features,
            bounds=BoundsResponse(
                minLat=min_lat,
                maxLat=max_lat,
                minLng=min_lon,
                maxLng=max_lon,
            ),
            timestamp=int(time.time() * 1000),
            source="bluegolf+vision",
            course_name=course_name,
            hole_count=len(course_data.holes),
            confidence=round(avg_confidence, 3),
            metadata={
                "holes_analyzed": sum(
                    1 for a in hole_analyses if a is not None
                ),
                "total_features": len(all_features),
            },
        )

    def assemble_from_vision_only(
        self,
        features: list,
        course_name: str,
        center_lat: float,
        center_lon: float,
    ) -> CourseGeometryResponse:
        """Assemble geometry from full-course vision analysis (no BlueGolf data)."""
        # For vision-only, features are already in [0,1] normalized space
        # Map directly to SVG space
        all_features: list[FeatureResponse] = []

        for feat in features:
            svg_points = [
                (
                    pt[0] * settings.svg_width,
                    pt[1] * settings.svg_height,
                )
                for pt in feat.points
            ]
            svg_points = simplify_polygon(svg_points, tolerance=1.5)
            centroid = compute_centroid(svg_points)

            all_features.append(FeatureResponse(
                type=feat.type,
                points=[list(p) for p in svg_points],
                centroid=list(centroid),
            ))

        # Approximate bounds from center point
        offset = 0.015  # ~1.5km radius
        return CourseGeometryResponse(
            features=all_features,
            bounds=BoundsResponse(
                minLat=center_lat - offset,
                maxLat=center_lat + offset,
                minLng=center_lon - offset,
                maxLng=center_lon + offset,
            ),
            timestamp=int(time.time() * 1000),
            source="google+vision",
            course_name=course_name,
            hole_count=0,
            confidence=0.5,
            metadata={"total_features": len(all_features)},
        )

    @staticmethod
    def _get_hole_lat(hole: BlueGolfHole, course: BlueGolfResponse) -> float:
        if hole.green and hole.green.lat:
            return hole.green.lat
        if course.course and course.course.lat:
            return course.course.lat
        return 0.0

    @staticmethod
    def _get_hole_lon(hole: BlueGolfHole, course: BlueGolfResponse) -> float:
        if hole.green and hole.green.lon:
            return hole.green.lon
        if course.course and course.course.lon:
            return course.course.lon
        return 0.0

    @staticmethod
    def _get_image_scale(hole: BlueGolfHole) -> float:
        if hole.green and hole.green.imageScale:
            return hole.green.imageScale
        return 0.5  # reasonable default meters/pixel

    @staticmethod
    def _get_rotation(hole: BlueGolfHole) -> float:
        if hole.green and hole.green.rotation:
            return hole.green.rotation
        return 0.0

    @staticmethod
    def _get_lat2y(hole: BlueGolfHole) -> float:
        if hole.green and hole.green.lat2y:
            return hole.green.lat2y
        return 111320.0  # meters per degree latitude

    @staticmethod
    def _get_lon2x(hole: BlueGolfHole) -> float:
        if hole.green and hole.green.lon2x:
            return hole.green.lon2x
        return 85000.0  # approximate meters per degree longitude at mid latitudes

    @staticmethod
    def _get_course_center(course: BlueGolfResponse) -> tuple[float, float]:
        if course.course and course.course.lat and course.course.lon:
            return (course.course.lat, course.course.lon)
        # Fallback: average of all hole green positions
        lats, lons = [], []
        for hole in course.holes:
            if hole.green and hole.green.lat and hole.green.lon:
                lats.append(hole.green.lat)
                lons.append(hole.green.lon)
        if lats:
            return (sum(lats) / len(lats), sum(lons) / len(lons))
        return (35.0, -80.0)  # default to central NC
