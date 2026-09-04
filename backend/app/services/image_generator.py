import os
import uuid
import base64
import logging
import httpx
from pathlib import Path
from typing import Optional
from app.core.config import settings

logger = logging.getLogger("ImageGenerator")

# Model priority list: try newer models first, fall back to older ones
IMAGE_MODELS = ["gpt-image-1", "dall-e-3", "dall-e-2"]


class ImageGenerator:
    """Generates educational images using OpenAI Image Generation API."""

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
        quality: str = "auto"
    ) -> Optional[str]:
        """
        Generates an educational image using OpenAI image generation models.

        Tries models in priority order: gpt-image-1 -> dall-e-3 -> dall-e-2.

        Returns:
            The relative URL path to serve the image (e.g., /api/v1/images/img_abc123.png),
            or None if generation fails.
        """
        if not self.client:
            logger.warning("OpenAI client not available for image generation. Skipping.")
            return None

        enhanced_prompt = self._build_enhanced_prompt(image_prompt, topic, step_title)

        for model in IMAGE_MODELS:
            try:
                logger.info(f"Generating image with {model} for: {step_title}")

                # gpt-image models return b64_json, older dall-e models return URLs
                if model.startswith("gpt-image"):
                    local_path = await self._generate_with_gpt_image(model, enhanced_prompt, size, quality)
                else:
                    local_path = await self._generate_with_dalle(model, enhanced_prompt, size, quality)

                if local_path:
                    logger.info(f"Image generated successfully with {model}: {local_path.name}")
                    return f"/api/v1/images/{local_path.name}"

            except Exception as e:
                logger.warning(f"Image generation with {model} failed: {e}")
                continue

        logger.error("All image generation models failed")
        return None

    async def _generate_with_gpt_image(self, model: str, prompt: str, size: str, quality: str) -> Optional[Path]:
        """Generate image using gpt-image-1 (returns base64)."""
        response = self.client.images.generate(
            model=model,
            prompt=prompt,
            size=size,
            quality=quality,
            n=1
        )

        if not response.data:
            return None

        image_data = response.data[0]

        # gpt-image-1 returns b64_json by default
        if hasattr(image_data, 'b64_json') and image_data.b64_json:
            return self._save_base64_image(image_data.b64_json)
        elif hasattr(image_data, 'url') and image_data.url:
            return await self._download_and_save(image_data.url)

        return None

    async def _generate_with_dalle(self, model: str, prompt: str, size: str, quality: str) -> Optional[Path]:
        """Generate image using dall-e-2/3 (returns URL)."""
        kwargs = {
            "model": model,
            "prompt": prompt,
            "size": size,
            "n": 1
        }
        # dall-e-3 supports quality param, dall-e-2 does not
        if model == "dall-e-3":
            kwargs["quality"] = "standard"

        response = self.client.images.generate(**kwargs)

        if not response.data:
            return None

        image_data = response.data[0]
        if hasattr(image_data, 'url') and image_data.url:
            return await self._download_and_save(image_data.url)
        elif hasattr(image_data, 'b64_json') and image_data.b64_json:
            return self._save_base64_image(image_data.b64_json)

        return None

    def _build_enhanced_prompt(self, image_prompt: str, topic: str, step_title: str) -> str:
        """Builds an enhanced prompt optimized for educational illustrations."""
        parts = [
            "Create a clean, professional educational illustration suitable for a classroom whiteboard.",
            "Style: Modern, visually clear, infographic-quality with labeled annotations.",
            "Background: Clean white or light background for readability.",
            "NO watermarks, NO stock photo aesthetics.",
        ]

        if topic:
            parts.append(f"Subject Area: {topic}.")
        if step_title:
            parts.append(f"Concept Being Taught: {step_title}.")

        parts.append(f"Visual Description: {image_prompt}")

        return " ".join(parts)

    def _save_base64_image(self, b64_data: str) -> Optional[Path]:
        """Decodes base64 image data and saves it locally."""
        try:
            filename = f"img_{uuid.uuid4().hex[:12]}.png"
            filepath = self.images_dir / filename

            image_bytes = base64.b64decode(b64_data)
            with open(filepath, "wb") as f:
                f.write(image_bytes)

            file_size = filepath.stat().st_size
            logger.info(f"Image saved (b64): {filename} ({file_size:,} bytes)")
            return filepath

        except Exception as e:
            logger.error(f"Failed to save base64 image: {e}")
            return None

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
            logger.info(f"Image saved (url): {filename} ({file_size:,} bytes)")
            return filepath

        except Exception as e:
            logger.error(f"Failed to download/save image: {e}")
            return None


# Singleton instance
image_generator = ImageGenerator()
