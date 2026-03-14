import json
import os
import time

CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "cache")
TTL_SECONDS = 7 * 24 * 60 * 60  # 7 days


def _ensure_cache_dir():
    os.makedirs(CACHE_DIR, exist_ok=True)


def get(key: str) -> dict | None:
    _ensure_cache_dir()
    path = os.path.join(CACHE_DIR, f"{key}.json")
    if not os.path.exists(path):
        return None
    if time.time() - os.path.getmtime(path) > TTL_SECONDS:
        os.remove(path)
        return None
    with open(path, "r") as f:
        return json.load(f)


def put(key: str, data: dict):
    _ensure_cache_dir()
    path = os.path.join(CACHE_DIR, f"{key}.json")
    with open(path, "w") as f:
        json.dump(data, f)
