from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.router import router
from services.cache_service import CacheService
from config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    cache = CacheService(settings.cache_db_path)
    await cache.init_db()
    app.state.cache = cache
    yield
    await cache.close()


app = FastAPI(
    title="Golf Geometry Service",
    description="Extracts accurate golf course geometry from satellite imagery",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:8080"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")
