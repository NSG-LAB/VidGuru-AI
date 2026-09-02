import os
from pathlib import Path
from typing import List


def _parse_csv_env(name: str, default: List[str]) -> List[str]:
    raw = os.getenv(name, "")
    if not raw.strip():
        return default
    return [item.strip() for item in raw.split(",") if item.strip()]

class Settings:
    PROJECT_NAME: str = "VidGuru AI"
    API_V1_STR: str = "/api/v1"
    
    # Base paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    UPLOADS_DIR: Path = DATA_DIR / "uploads"
    AUDIO_DIR: Path = DATA_DIR / "audio"
    
    # LLM API Keys (Supports Gemini, OpenAI, Groq)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    
    # LLM Models
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    
    # TTS Voices
    VOICE_EN_FEMALE: str = "en-US-JennyNeural"
    VOICE_EN_MALE: str = "en-US-GuyNeural"
    VOICE_HI_FEMALE: str = "hi-IN-SwaraNeural"
    VOICE_HI_MALE: str = "hi-IN-MadhurNeural"
    
    # CORS
    CORS_ORIGINS: list = _parse_csv_env("CORS_ORIGINS", [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ])

    # Security controls
    API_KEY: str = os.getenv("VIDGURU_API_KEY", "")
    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "15"))

settings = Settings()
settings.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
settings.AUDIO_DIR.mkdir(parents=True, exist_ok=True)
