from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    gemini_api_key: str = ""
    google_maps_api_key: str = ""
    google_cse_api_key: str = ""
    google_cse_cx: str = ""

    bluegolf_base_url: str = "https://app.bluegolf.com/bluegolf/app/course"
    satellite_zoom: int = 16
    satellite_grid_size: int = 5
    cache_db_path: str = "cache/courses.db"
    cache_geometry_ttl_days: int = 90
    cache_handle_ttl_days: int = 30
    memory_cache_size: int = 500
    memory_cache_ttl_seconds: int = 3600

    vision_model: str = "claude-sonnet-4-5-20250514"
    vision_max_concurrent: int = 5
    vision_max_tokens: int = 4096

    svg_width: float = 800.0
    svg_height: float = 1000.0

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
