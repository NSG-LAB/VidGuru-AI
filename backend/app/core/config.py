import os
from pathlib import Path

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
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "*",
    ]

settings = Settings()
settings.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
settings.AUDIO_DIR.mkdir(parents=True, exist_ok=True)
