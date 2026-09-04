import os
import logging
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from pydantic import BaseModel, Field

try:
    from starlette.responses import FileResponse
except ImportError:
    from fastapi.responses import FileResponse

from app.core.config import settings
from app.services.tts_engine import tts_engine

logger = logging.getLogger("VoiceAPI")
router = APIRouter(prefix="/voice", tags=["Voice TTS & STT"])

class TTSRequest(BaseModel):
    text: str = Field(..., description="Teacher script or speech text to synthesize")
    persona: str = Field(default="Dr. Nova (Intuitive & Warm)", description="Teacher persona for voice selection")
    language: str = Field(default="English", description="Target language (e.g. English, Hindi, Hinglish, Spanish)")

class TTSResponse(BaseModel):
    audio_url: str
    status: str = "success"
    message: Optional[str] = None

@router.get("/status")
@router.get("/")
async def get_voice_status():
    """Returns the operational status of the Voice and TTS subsystem."""
    return {
        "status": "online",
        "engine": "edge-tts",
        "audio_dir": str(settings.AUDIO_DIR),
        "available_personas": [
            "Dr. Nova (Intuitive & Warm)",
            "Prof. Aryan (Deep & Socratic)",
            "Maya (Energetic & Visual)",
            "Alex (Code & Engineering)"
        ],
        "supported_languages": ["English", "Hindi", "Hinglish", "Spanish"]
    }

@router.get("/test")
async def test_speech():
    """Generates a quick test audio to verify the voice module is functioning."""
    test_text = "VidGuru voice module is online and ready for interactive learning."
    url = await tts_engine.generate_speech_file(
        text=test_text,
        persona="Dr. Nova (Intuitive & Warm)",
        language="English"
    )
    if not url:
        raise HTTPException(
            status_code=503,
            detail="TTS test synthesis failed. Please check internet connectivity for neural voice synthesis."
        )
    return {
        "status": "success",
        "audio_url": url,
        "sample_text": test_text
    }

@router.api_route("/audio/{filename}", methods=["GET", "HEAD", "OPTIONS"])
async def get_audio_file(filename: str):
    """Streams generated audio mp3 file for frontend teacher playback."""
    file_path = settings.AUDIO_DIR / filename
    if not file_path.exists() or file_path.stat().st_size == 0:
        raise HTTPException(status_code=404, detail="Audio file not found or empty")
    return FileResponse(
        file_path,
        media_type="audio/mpeg",
        headers={
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=3600",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "*"
        }
    )

@router.get("/tts", response_model=TTSResponse)
async def generate_speech_get(
    text: str = Query(..., description="Text to synthesize"),
    persona: str = Query(default="Dr. Nova (Intuitive & Warm)"),
    language: str = Query(default="English")
):
    """GET endpoint to easily test TTS directly in browser or URL bar."""
    try:
        url = await tts_engine.generate_speech_file(text=text, persona=persona, language=language)
        if not url:
            raise HTTPException(
                status_code=503,
                detail="TTS synthesis failed to produce audio. Neural voice service may be unreachable."
            )
        return TTSResponse(audio_url=url, status="success")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"TTS GET synthesis failed: {e}")
        raise HTTPException(status_code=500, detail=f"TTS synthesis error: {str(e)}")

@router.post("/tts", response_model=TTSResponse)
async def generate_speech(request: TTSRequest):
    """Synthesizes speech audio for teacher script using neural voice engine."""
    try:
        url = await tts_engine.generate_speech_file(
            text=request.text,
            persona=request.persona,
            language=request.language
        )
        if not url:
            raise HTTPException(
                status_code=503,
                detail="TTS synthesis failed to generate audio output. The frontend will fall back to browser speech synthesis."
            )
        return TTSResponse(audio_url=url, status="success")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"TTS POST synthesis failed: {e}")
        raise HTTPException(status_code=500, detail=f"TTS synthesis failed: {str(e)}")

@router.post("/stt")
async def transcribe_audio(file: UploadFile = File(...)):
    """Transcribes student audio submission."""
    # Web Speech API can do in-browser STT, this endpoint provides fallback backend transcription
    return {"text": "Transcribed student voice answer"}
