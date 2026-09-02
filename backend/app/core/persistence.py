import json
import logging
from pathlib import Path
from typing import Any, Dict
from app.core.config import settings

logger = logging.getLogger("Persistence")

STATE_DIR = settings.DATA_DIR / "state"
STATE_DIR.mkdir(parents=True, exist_ok=True)


def load_json_state(filename: str, default: Dict[str, Any] | None = None) -> Dict[str, Any]:
    path = STATE_DIR / filename
    if not path.exists():
        return default or {}
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as exc:
        logger.warning("Failed loading state file %s: %s", path, exc)
        return default or {}


def save_json_state(filename: str, payload: Dict[str, Any]) -> None:
    path = STATE_DIR / filename
    temp_path = path.with_suffix(path.suffix + ".tmp")
    with open(temp_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False)
    temp_path.replace(path)
