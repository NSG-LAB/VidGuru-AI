import logging
from pathlib import Path
from fastapi import APIRouter, HTTPException

try:
    from starlette.responses import FileResponse
except ImportError:
    from fastapi.responses import FileResponse

from app.core.config import settings

logger = logging.getLogger("ImagesAPI")
router = APIRouter(prefix="/images", tags=["Generated Images"])


@router.api_route("/{filename}", methods=["GET", "HEAD", "OPTIONS"])
async def get_image_file(filename: str):
    """Serves AI-generated educational images for the Smart Whiteboard."""
    file_path = settings.IMAGES_DIR / filename
    if not file_path.exists() or file_path.stat().st_size == 0:
        raise HTTPException(status_code=404, detail="Image file not found or empty")

    # Determine media type from extension
    suffix = file_path.suffix.lower()
    media_types = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp",
        ".gif": "image/gif",
    }
    media_type = media_types.get(suffix, "image/png")

    return FileResponse(
        file_path,
        media_type=media_type,
        headers={
            "Cache-Control": "public, max-age=86400",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        },
    )
