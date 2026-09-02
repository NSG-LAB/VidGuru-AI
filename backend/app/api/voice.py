import logging
import tempfile
from pathlib import Path
from fastapi import APIRouter, HTTPException, Body, UploadFile, File, Depends
from fastapi.responses import FileResponse
from app.core.config import settings
from app.core.security import enforce_generation_guard
from app.services.llm_service import llm_service
from app.services.tts_engine import tts_engine

router = APIRouter(prefix="/voice", tags=["Voice TTS & STT"])
logger = logging.getLogger("VoiceAPI")

@router.api_route("/audio/{filename}", methods=["GET", "HEAD"])
async def get_audio_file(filename: str):
    """Streams generated audio mp3 file for frontend teacher playback."""
    file_path = settings.AUDIO_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Audio file not found")
    return FileResponse(file_path, media_type="audio/mpeg", headers={"Accept-Ranges": "bytes", "Cache-Control": "public, max-age=3600"})

@router.post("/tts")
async def generate_speech(
    text: str = Body(..., embed=True),
    persona: str = Body("Dr. Nova (Intuitive & Warm)", embed=True),
    language: str = Body("English", embed=True),
    _guard: None = Depends(enforce_generation_guard),
):
    """Directly synthesizes speech audio for arbitrary teacher script."""
    try:
        url = await tts_engine.generate_speech_file(text=text, persona=persona, language=language)
        return {"audio_url": url}
    except Exception:
        logger.exception("TTS synthesis failed")
        raise HTTPException(status_code=500, detail="TTS synthesis failed.")

@router.post("/stt")
async def transcribe_audio(
    file: UploadFile = File(...),
    _guard: None = Depends(enforce_generation_guard),
):
    """Transcribes student audio submission using configured provider."""
    if not llm_service.openai_client:
        raise HTTPException(
            status_code=503,
            detail="STT provider is not configured. Use browser STT or set OPENAI_API_KEY."
        )

    allowed_content_types = {
        "audio/mpeg",
        "audio/mp3",
        "audio/wav",
        "audio/x-wav",
        "audio/webm",
        "audio/ogg",
        "application/octet-stream",
    }
    if file.content_type and file.content_type.lower() not in allowed_content_types:
        raise HTTPException(status_code=400, detail="Unsupported audio format.")

    raw_bytes = await file.read()
    if not raw_bytes:
        raise HTTPException(status_code=400, detail="Uploaded audio file is empty.")

    suffix = Path(file.filename or "audio.webm").suffix or ".webm"
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(raw_bytes)
            tmp_path = Path(tmp.name)

        with open(tmp_path, "rb") as audio_file:
            response = llm_service.openai_client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
            )

        text = getattr(response, "text", "") or ""
        if not text.strip():
            raise HTTPException(status_code=422, detail="No speech could be transcribed from audio.")
        return {"text": text.strip()}
    except HTTPException:
        raise
    except Exception:
        logger.exception("STT transcription failed")
        raise HTTPException(status_code=502, detail="Failed to transcribe audio.")
    finally:
        if tmp_path and tmp_path.exists():
            tmp_path.unlink(missing_ok=True)
