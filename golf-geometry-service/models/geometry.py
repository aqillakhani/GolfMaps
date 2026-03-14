"""Internal geometry models."""

from typing import Literal, Optional

from pydantic import BaseModel


FeatureType = Literal["fairway", "green", "bunker", "water", "tee"]


class CourseFeature(BaseModel):
    type: FeatureType
    points: list[tuple[float, float]]
    centroid: tuple[float, float]
    hole_number: Optional[int] = None
    confidence: float = 1.0


class CourseBounds(BaseModel):
    min_lat: float
    max_lat: float
    min_lon: float
    max_lon: float


class HoleVisionFeature(BaseModel):
    """A single feature extracted by Claude Vision from a hole image."""
    type: FeatureType
    points: list[list[float]]  # [[x, y], ...] in normalized [0,1] space
    confidence: float


class HoleAnalysisResult(BaseModel):
    """Claude Vision analysis result for a single hole."""
    hole_number: int
    features: list[HoleVisionFeature]
