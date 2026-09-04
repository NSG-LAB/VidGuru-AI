import os
import uuid
import logging
from pathlib import Path
from typing import Optional
from app.core.config import settings

logger = logging.getLogger("TTSEngine")

class TTSEngine:
    def __init__(self):
        self.audio_dir = settings.AUDIO_DIR
        self.audio_dir.mkdir(parents=True, exist_ok=True)
        
        # Voice maps for personas & languages
        self.voice_map = {
            # English
            ("Dr. Nova (Intuitive & Warm)", "English"): "en-US-JennyNeural",
            ("Prof. Aryan (Deep & Socratic)", "English"): "en-US-GuyNeural",
            ("Maya (Energetic & Visual)", "English"): "en-US-AriaNeural",
            ("Alex (Code & Engineering)", "English"): "en-US-ChristopherNeural",
            
            # Hindi
            ("Dr. Nova (Intuitive & Warm)", "Hindi"): "hi-IN-SwaraNeural",
            ("Prof. Aryan (Deep & Socratic)", "Hindi"): "hi-IN-MadhurNeural",
            ("Maya (Energetic & Visual)", "Hindi"): "hi-IN-SwaraNeural",
            ("Alex (Code & Engineering)", "Hindi"): "hi-IN-MadhurNeural",
            
            # Hinglish
            ("Dr. Nova (Intuitive & Warm)", "Hinglish"): "hi-IN-SwaraNeural",
            ("Prof. Aryan (Deep & Socratic)", "Hinglish"): "hi-IN-MadhurNeural",
            ("Maya (Energetic & Visual)", "Hinglish"): "en-IN-NeerjaNeural",
            ("Alex (Code & Engineering)", "Hinglish"): "en-IN-PrabhatNeural",
            
            # Spanish
            ("Dr. Nova (Intuitive & Warm)", "Spanish"): "es-ES-ElviraNeural",
            ("Prof. Aryan (Deep & Socratic)", "Spanish"): "es-ES-AlvaroNeural",
        }

    def _get_voice_for_persona(self, persona: str, language: str) -> str:
        key = (persona, language)
        if key in self.voice_map:
            return self.voice_map[key]
        
        # Fallbacks based on language
        if language.lower() in ["hindi", "hinglish"]:
            return "hi-IN-SwaraNeural"
        elif language.lower() == "spanish":
            return "es-ES-ElviraNeural"
        else:
            return "en-US-JennyNeural"

    async def generate_speech_file(self, text: str, persona: str = "Dr. Nova (Intuitive & Warm)", language: str = "English") -> str:
        """Generates an MP3 file using Edge-TTS with fallback voices and retries."""
        import edge_tts

        clean_text = text.replace("*", "").replace("#", "").replace("`", "").replace("_", "").strip()
        if not clean_text:
            clean_text = "Let's explore this concept together."
        
        # Limit spoken text to avoid extreme lengths in a single turn
        clean_text = clean_text[:2000]

        file_id = f"speech_{uuid.uuid4().hex[:12]}.mp3"
        output_path = self.audio_dir / file_id

        primary_voice = self._get_voice_for_persona(persona, language)
        lang_lower = language.lower()
        if lang_lower in ["hindi", "hinglish"]:
            fallback_voices = [primary_voice, "hi-IN-SwaraNeural", "hi-IN-MadhurNeural"]
        elif lang_lower == "spanish":
            fallback_voices = [primary_voice, "es-ES-ElviraNeural", "es-ES-AlvaroNeural"]
        else:
            fallback_voices = [primary_voice, "en-US-JennyNeural", "en-US-GuyNeural"]
        
        # Deduplicate while preserving order
        voices_to_try = []
        for v in fallback_voices:
            if v not in voices_to_try:
                voices_to_try.append(v)

        for attempt, voice in enumerate(voices_to_try):
            try:
                communicate = edge_tts.Communicate(clean_text, voice, rate="+0%", pitch="+0Hz")
                await communicate.save(str(output_path))
                if output_path.exists() and output_path.stat().st_size > 100:
                    return f"/api/v1/voice/audio/{file_id}"
                else:
                    if output_path.exists():
                        output_path.unlink(missing_ok=True)
            except Exception as e:
                logger.warning(f"TTS attempt {attempt + 1} with voice '{voice}' failed: {e}")
                if output_path.exists():
                    output_path.unlink(missing_ok=True)
        
        logger.error("All Edge-TTS voice attempts failed.")
        return ""

tts_engine = TTSEngine()

