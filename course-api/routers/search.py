from fastapi import APIRouter, Query
from models.course import SearchResponse, SearchResult
from services.overpass import search_courses

router = APIRouter()


@router.get("/search", response_model=SearchResponse)
async def search(q: str = Query(..., min_length=2), limit: int = Query(10, ge=1, le=25)):
    results = await search_courses(q, limit)
    return SearchResponse(results=[SearchResult(**r) for r in results])
