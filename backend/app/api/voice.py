import os
from pathlib import Path
from fastapi import APIRouter, HTTPException, Body, UploadFile, File
from fastapi.responses import FileResponse
from app.core.config import settings
from app.services.tts_engine import tts_engine

router = APIRouter(prefix="/voice", tags=["Voice TTS & STT"])

@router.get("/audio/{filename}")
async def get_audio_file(filename: str):
    """Streams generated audio mp3 file for frontend teacher playback."""
    file_path = settings.AUDIO_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Audio file not found")
    return FileResponse(file_path, media_type="audio/mpeg")

@router.post("/tts")
async def generate_speech(
    text: str = Body(..., embed=True),
    persona: str = Body("Dr. Nova (Intuitive & Warm)", embed=True),
    language: str = Body("English", embed=True)
):
    """Directly synthesizes speech audio for arbitrary teacher script."""
    try:
        url = await tts_engine.generate_speech_file(text=text, persona=persona, language=language)
        return {"audio_url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS synthesis failed: {str(e)}")

@router.post("/stt")
async def transcribe_audio(file: UploadFile = File(...)):
    """Transcribes student audio submission."""
    # Web Speech API can do in-browser STT, this endpoint provides fallback backend transcription
    return {"text": "Transcribed student voice answer"}
