"""Pydantic models for BlueGolf API responses."""

from typing import Optional

from pydantic import BaseModel, ConfigDict


class _Flexible(BaseModel):
    model_config = ConfigDict(extra="ignore")


class BlueGolfPoint(_Flexible):
    x: float
    y: float
    name: str  # "tee", "dogleg", "catleg", "green_front", "green_center", "green_back"


class BlueGolfFeature(_Flexible):
    type: str  # "green", "fairwaybunker", "greensidebunker", "water", etc.
    icon: Optional[str] = None
    descrip: Optional[str] = None
    frontlat: Optional[float] = None
    frontlon: Optional[float] = None
    backlat: Optional[float] = None
    backlon: Optional[float] = None
    centerlat: Optional[float] = None
    centerlon: Optional[float] = None


class BlueGolfBlurb(_Flexible):
    allowedit: bool = False
    text: Optional[str] = None


class BlueGolfGreenPoints(_Flexible):
    x: float
    y: float
    name: str


class BlueGolfGreen(_Flexible):
    image: Optional[str] = None
    image2x: Optional[str] = None
    maskScale: Optional[float] = None
    rotation: Optional[float] = None
    lon: Optional[float] = None
    lat: Optional[float] = None
    lon2x: Optional[float] = None
    lat2y: Optional[float] = None
    lunit: Optional[float] = None
    imageScale: Optional[float] = None
    depth: Optional[float] = None
    blurb: Optional[BlueGolfBlurb] = None
    points: list[BlueGolfGreenPoints] = []


class BlueGolfHole(_Flexible):
    par: int
    distance: int
    handicap: Optional[int] = None
    image: Optional[str] = None
    image2x: Optional[str] = None
    green: Optional[BlueGolfGreen] = None
    blurb: Optional[BlueGolfBlurb] = None
    points: list[BlueGolfPoint] = []
    features: list[BlueGolfFeature] = []


class BlueGolfTee(_Flexible):
    name: Optional[str] = None
    color: Optional[str] = None
    rating: Optional[float] = None
    slope: Optional[int] = None
    distance: Optional[int] = None


class BlueGolfCourseInfo(_Flexible):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None


class BlueGolfResponse(_Flexible):
    """Top-level BlueGolf overview.json response."""
    robot: Optional[bool] = None
    path: Optional[str] = None
    allowgps: Optional[bool] = None
    allowShots: Optional[bool] = None
    course: Optional[BlueGolfCourseInfo] = None
    holes: list[BlueGolfHole] = []
