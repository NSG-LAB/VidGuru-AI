import os
import uuid
import logging
import httpx
from pathlib import Path
from typing import Optional
from app.core.config import settings

logger = logging.getLogger("ImageGenerator")


class ImageGenerator:
    """Generates educational images using OpenAI DALL-E 3 API."""

    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.images_dir = settings.IMAGES_DIR
        self.images_dir.mkdir(parents=True, exist_ok=True)
        self._client = None

    @property
    def client(self):
        """Lazy-initialize the OpenAI client."""
        if self._client is None and self.api_key:
            try:
                import openai
                self._client = openai.OpenAI(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Failed to initialize OpenAI client for image generation: {e}")
        return self._client

    async def generate_educational_image(
        self,
        image_prompt: str,
        topic: str = "",
        step_title: str = "",
        size: str = "1024x1024",
        quality: str = "standard"
    ) -> Optional[str]:
        """
        Generates an educational image using DALL-E 3.

        Args:
            image_prompt: The descriptive prompt for image generation (from LLM).
            topic: The lesson topic for context enrichment.
            step_title: The current step title.
            size: Image resolution (1024x1024, 1024x1792, 1792x1024).
            quality: 'standard' or 'hd'.

        Returns:
            The relative URL path to serve the image (e.g., /api/v1/images/img_abc123.png),
            or None if generation fails.
        """
        if not self.client:
            logger.warning("OpenAI client not available for image generation. Skipping.")
            return None

        # Enhance the prompt for educational context
        enhanced_prompt = self._build_enhanced_prompt(image_prompt, topic, step_title)

        try:
            logger.info(f"Generating DALL-E image for: {step_title} | prompt length: {len(enhanced_prompt)}")

            response = self.client.images.generate(
                model="dall-e-3",
                prompt=enhanced_prompt,
                size=size,
                quality=quality,
                n=1
            )

            if not response.data or not response.data[0].url:
                logger.warning("DALL-E returned empty response")
                return None

            image_url = response.data[0].url

            # Download and save the image locally
            local_path = await self._download_and_save(image_url)
            if local_path:
                return f"/api/v1/images/{local_path.name}"

            return None

        except Exception as e:
            logger.error(f"DALL-E image generation failed: {e}")
            return None

    def _build_enhanced_prompt(self, image_prompt: str, topic: str, step_title: str) -> str:
        """Builds an enhanced prompt optimized for educational illustrations."""
        parts = [
            "Create a clean, professional educational illustration suitable for a classroom whiteboard.",
            "Style: Modern, visually clear, infographic-quality with labeled annotations.",
            "Background: Clean white or light background for readability.",
            "NO text overlays, NO watermarks, NO stock photo aesthetics.",
        ]

        if topic:
            parts.append(f"Subject Area: {topic}.")
        if step_title:
            parts.append(f"Concept Being Taught: {step_title}.")

        parts.append(f"Visual Description: {image_prompt}")

        return " ".join(parts)

    async def _download_and_save(self, url: str) -> Optional[Path]:
        """Downloads an image from URL and saves it locally."""
        try:
            filename = f"img_{uuid.uuid4().hex[:12]}.png"
            filepath = self.images_dir / filename

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url)
                response.raise_for_status()

                with open(filepath, "wb") as f:
                    f.write(response.content)

            file_size = filepath.stat().st_size
            logger.info(f"Image saved: {filename} ({file_size:,} bytes)")
            return filepath

        except Exception as e:
            logger.error(f"Failed to download/save DALL-E image: {e}")
            return None


# Singleton instance
image_generator = ImageGenerator()
