import hashlib
import json
from pathlib import Path
from typing import Any, Optional


CACHE_DIR = Path("cache")
CACHE_FILE = CACHE_DIR / "ai_cache.json"


def _load_cache() -> dict:
    CACHE_DIR.mkdir(exist_ok=True)

    if not CACHE_FILE.exists():
        return {}

    try:
        return json.loads(CACHE_FILE.read_text())
    except Exception:
        return {}


def _save_cache(cache: dict) -> None:
    CACHE_DIR.mkdir(exist_ok=True)
    CACHE_FILE.write_text(json.dumps(cache, indent=2, ensure_ascii=False))


def cache_key(namespace: str, payload: str) -> str:
    digest = hashlib.sha256(payload.encode("utf-8")).hexdigest()
    return f"{namespace}:{digest}"


def get_cached(namespace: str, payload: str) -> Optional[Any]:
    cache = _load_cache()
    return cache.get(cache_key(namespace, payload))


def set_cached(namespace: str, payload: str, value: Any) -> None:
    cache = _load_cache()
    cache[cache_key(namespace, payload)] = value
    _save_cache(cache)
