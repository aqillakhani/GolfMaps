"""API request/response schemas."""

from typing import Literal, Optional

from pydantic import BaseModel


class CourseGeometryRequest(BaseModel):
    course_name: str
    location: Optional[str] = None
    bluegolf_handle: Optional[str] = None
    force_refresh: bool = False


class FeatureResponse(BaseModel):
    type: Literal["fairway", "green", "bunker", "water", "tee"]
    points: list[list[float]]  # [[x, y], ...]
    centroid: list[float]  # [x, y]
    hole_number: Optional[int] = None


class BoundsResponse(BaseModel):
    minLat: float
    maxLat: float
    minLng: float
    maxLng: float


class CourseGeometryResponse(BaseModel):
    features: list[FeatureResponse]
    bounds: BoundsResponse
    timestamp: int
    source: str
    course_name: str
    hole_count: int
    confidence: float
    metadata: dict = {}


class CourseSearchResponse(BaseModel):
    results: list["CourseSearchItem"]


class CourseSearchItem(BaseModel):
    handle: str
    name: str
    location: str
    has_tour_data: bool
    confidence: float


class HealthResponse(BaseModel):
    status: str
    version: str


class ErrorResponse(BaseModel):
    error: str
    message: str
    suggestion: Optional[str] = None
