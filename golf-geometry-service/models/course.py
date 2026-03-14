"""Internal course domain models."""

from typing import Optional

from pydantic import BaseModel


class HoleImage(BaseModel):
    hole_number: int
    image_data: bytes
    width: int = 800
    height: int = 800

    model_config = {"arbitrary_types_allowed": True}


class CourseSearchResult(BaseModel):
    handle: str
    name: str
    location: str
    has_tour_data: bool
    confidence: float
