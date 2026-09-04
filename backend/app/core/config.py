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
    IMAGES_DIR: Path = DATA_DIR / "images"

    def __init__(self):
        # Auto-load .env from base directory or parent
        for env_path in [self.BASE_DIR / ".env", self.BASE_DIR.parent / ".env"]:
            if env_path.exists():
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k = k.strip()
                            v = v.strip().strip("'\"")
                            if k not in os.environ:
                                os.environ[k] = v

        self.GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
        self.OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
        self.GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
        self.GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
        self.OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        self.GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    
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
settings.IMAGES_DIR.mkdir(parents=True, exist_ok=True)
