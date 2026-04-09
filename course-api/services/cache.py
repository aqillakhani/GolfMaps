"""Disk-backed cache for processed course geometry.

Silently degrades to no-op if the cache directory is read-only — this
happens on Fly machines where the image filesystem is read-only by default
and no persistent volume is attached. The service is still correct without
the cache, just slightly slower on cache misses.
"""

import json
import logging
import os
import time

logger = logging.getLogger(__name__)

CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "cache")
TTL_SECONDS = 7 * 24 * 60 * 60  # 7 days

# Tracks whether we've already complained about the cache being unwritable so
# we don't spam logs on every request.
_write_warning_emitted = False


def _ensure_cache_dir() -> bool:
    """Return True if the cache dir exists and is usable, False otherwise."""
    try:
        os.makedirs(CACHE_DIR, exist_ok=True)
        return True
    except OSError:
        return False


def get(key: str) -> dict | None:
    if not _ensure_cache_dir():
        return None
    path = os.path.join(CACHE_DIR, f"{key}.json")
    try:
        if not os.path.exists(path):
            return None
        if time.time() - os.path.getmtime(path) > TTL_SECONDS:
            os.remove(path)
            return None
        with open(path, "r") as f:
            return json.load(f)
    except OSError:
        return None
    except json.JSONDecodeError:
        # Corrupt cache entry — remove and treat as miss.
        try:
            os.remove(path)
        except OSError:
            pass
        return None


def put(key: str, data: dict) -> None:
    """Best-effort cache write. Never raises — failures are logged once."""
    global _write_warning_emitted
    if not _ensure_cache_dir():
        if not _write_warning_emitted:
            logger.warning("Cache directory is not writable; proceeding without disk cache.")
            _write_warning_emitted = True
        return
    path = os.path.join(CACHE_DIR, f"{key}.json")
    try:
        # Write to a temp file first then rename so readers never see a
        # half-written JSON file.
        tmp_path = f"{path}.tmp"
        with open(tmp_path, "w") as f:
            json.dump(data, f)
        os.replace(tmp_path, path)
    except OSError as exc:
        if not _write_warning_emitted:
            logger.warning("Cache write failed (%s); proceeding without disk cache.", exc)
            _write_warning_emitted = True
