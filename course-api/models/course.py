from pydantic import BaseModel


class SearchResult(BaseModel):
    osm_id: int
    osm_type: str
    name: str
    location: str | None = None
    lat: float
    lon: float


class SearchResponse(BaseModel):
    results: list[SearchResult]


class CourseMetadata(BaseModel):
    name: str
    location: str | None = None
    holes: int | None = None
    par: int | None = None


class CourseResponse(BaseModel):
    metadata: CourseMetadata
    geojson: dict
