import os
import json
import re
import logging
from typing import Dict, Any, Optional, List
from app.core.config import settings

logger = logging.getLogger("LLMService")

class LLMService:
    def __init__(self):
        self.gemini_key = settings.GEMINI_API_KEY
        self.openai_key = settings.OPENAI_API_KEY
        self.groq_key = settings.GROQ_API_KEY
        
        self.gemini_client = None
        if self.gemini_key:
            try:
                from google import genai
                self.gemini_client = genai.Client(api_key=self.gemini_key)
            except Exception as e:
                logger.warning(f"Failed to initialize Google GenAI client: {e}")

        self.openai_client = None
        if self.openai_key:
            try:
                from openai import OpenAI
                self.openai_client = OpenAI(api_key=self.openai_key)
            except Exception as e:
                logger.warning(f"Failed to initialize OpenAI client: {e}")

    def generate_text(self, system_prompt: str, user_prompt: str, temperature: float = 0.7) -> str:
        """Generates text from available LLM provider with fallback handling."""
        # 1. Try Gemini
        if self.gemini_key:
            if self.gemini_client:
                try:
                    response = self.gemini_client.models.generate_content(
                        model=settings.GEMINI_MODEL,
                        contents=f"System: {system_prompt}\n\nUser: {user_prompt}",
                    )
                    if response and response.text:
                        return response.text
                except Exception as e:
                    logger.error(f"Gemini client generation error: {e}")

            # Direct HTTP REST Fallback for Gemini
            try:
                import requests
                headers = {"Content-Type": "application/json", "X-goog-api-key": self.gemini_key}
                models_to_try = [settings.GEMINI_MODEL, "gemini-3.6-flash", "gemini-flash-latest"]
                payload = {
                    "contents": [
                        {"parts": [{"text": f"Instructions:\n{system_prompt}\n\nTask:\n{user_prompt}"}]}
                    ],
                    "generationConfig": {"temperature": temperature}
                }
                for model in models_to_try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
                    try:
                        res = requests.post(url, headers=headers, json=payload, timeout=45)
                        if res.status_code == 200:
                            data = res.json()
                            candidates = data.get("candidates", [])
                            if candidates:
                                parts = candidates[0].get("content", {}).get("parts", [])
                                if parts:
                                    return parts[0].get("text", "")
                        else:
                            logger.warning(f"Gemini {model} returned HTTP {res.status_code}: {res.text[:120]}")
                    except Exception as model_err:
                        logger.warning(f"Gemini model {model} attempt error: {model_err}")
            except Exception as e:
                logger.error(f"Gemini REST error: {e}")

        # 2. Try OpenAI
        if self.openai_client:
            try:
                response = self.openai_client.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    temperature=temperature,
                )
                if response.choices and response.choices[0].message.content:
                    return response.choices[0].message.content
            except Exception as e:
                logger.error(f"OpenAI generation error: {e}")

        # 3. Fallback educational response generator
        return self._generate_intelligent_fallback(system_prompt, user_prompt)

    def generate_json(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        """Generates and extracts clean JSON from LLM response."""
        full_system = system_prompt + "\n\nCRITICAL: Respond ONLY with a valid JSON object matching the requested schema. Do not include markdown quotes around the JSON unless using ```json ```."
        raw = self.generate_text(full_system, user_prompt, temperature=0.3)
        
        # Clean JSON markdown blocks if present
        cleaned = raw.strip()
        if "```json" in cleaned:
            match = re.search(r'```json\s*(.*?)\s*```', cleaned, re.DOTALL)
            if match:
                cleaned = match.group(1)
        elif "```" in cleaned:
            match = re.search(r'```\s*(.*?)\s*```', cleaned, re.DOTALL)
            if match:
                cleaned = match.group(1)

        try:
            return json.loads(cleaned)
        except Exception as e:
            logger.warning(f"Direct JSON parse failed: {e}. Raw content: {cleaned[:200]}")
            start = cleaned.find("{")
            end = cleaned.rfind("}")
            if start != -1 and end != -1 and end > start:
                try:
                    return json.loads(cleaned[start:end+1])
                except Exception:
                    pass
            
            return self._build_fallback_json(user_prompt)

    def _generate_intelligent_fallback(self, system_prompt: str, user_prompt: str) -> str:
        """High quality pedagogical template responses when no API key is set."""
        if "lesson_plan" in user_prompt.lower() or "curriculum" in user_prompt.lower():
            return json.dumps(self._build_fallback_json(user_prompt))
        return "Hello! I am your AI Educator. Let us dive into the core principles of this topic together."

    def _build_fallback_json(self, user_prompt: str) -> Dict[str, Any]:
        """Creates rich domain-specific fallback structured responses for instant testing."""
        topic_match = re.search(r'topic[:"\s]+([\w\s]+)', user_prompt, re.IGNORECASE)
        topic = topic_match.group(1).strip() if topic_match else "Core Subject Concepts"

        return {
            "topic_title": f"Mastering {topic}",
            "overview": f"A comprehensive, first-principles deep dive into {topic}, designed with interactive checkpoints, visual intuitions, and real-world examples.",
            "total_estimated_mins": 15,
            "modules": [
                {
                    "module_id": 1,
                    "title": f"Foundations & Intuition of {topic}",
                    "description": "Understanding the core mental model and why this concept exists.",
                    "steps": [
                        {
                            "step_id": 1,
                            "step_type": "introduction",
                            "title": "The Big Picture & Real-World Motivation",
                            "concept_summary": f"Why do we need {topic}? How does it solve fundamental problems in science and computing?",
                            "estimated_duration_seconds": 120
                        },
                        {
                            "step_id": 2,
                            "step_type": "concept_breakdown",
                            "title": "First Principles Breakdown & Core Mechanics",
                            "concept_summary": f"Breaking down the mathematical and conceptual architecture of {topic}.",
                            "estimated_duration_seconds": 180
                        }
                    ]
                },
                {
                    "module_id": 2,
                    "title": f"Visual Architecture & Deep Dive",
                    "description": "Visualizing transformations, equations, and code implementations.",
                    "steps": [
                        {
                            "step_id": 3,
                            "step_type": "visual_deep_dive",
                            "title": "Visual Diagram & Mathematical Formula",
                            "concept_summary": "Step-by-step walkthrough of the underlying mechanism and formula.",
                            "estimated_duration_seconds": 200
                        },
                        {
                            "step_id": 4,
                            "step_type": "checkpoint",
                            "title": "Interactive Socratic Challenge",
                            "concept_summary": "Testing deep conceptual understanding with a hands-on reasoning question.",
                            "estimated_duration_seconds": 150
                        }
                    ]
                },
                {
                    "module_id": 3,
                    "title": "Synthesis, Pitfalls & Mastery",
                    "description": "Connecting the dots, avoiding common misconceptions, and practical applications.",
                    "steps": [
                        {
                            "step_id": 5,
                            "step_type": "practical_demo",
                            "title": "Applied Walkthrough & Edge Cases",
                            "concept_summary": "Real-world application, trade-offs, and critical edge cases.",
                            "estimated_duration_seconds": 180
                        },
                        {
                            "step_id": 6,
                            "step_type": "synthesis",
                            "title": "Mastery Review & Final Synthesis",
                            "concept_summary": "Synthesizing everything learned into lasting long-term memory.",
                            "estimated_duration_seconds": 120
                        }
                    ]
                }
            ]
        }

llm_service = LLMService()
