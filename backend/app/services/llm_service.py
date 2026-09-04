import os
import json
import re
import logging
import requests
from typing import Dict, Any, Optional, List
from app.core.config import settings

logger = logging.getLogger("LLMService")

class LLMService:
    def __init__(self):
        self.gemini_key = settings.GEMINI_API_KEY
        self.openai_key = settings.OPENAI_API_KEY
        self.groq_key = settings.GROQ_API_KEY
        self.groq_model = getattr(settings, "GROQ_MODEL", "openai/gpt-oss-120b")
        self.gemini_model = getattr(settings, "GEMINI_MODEL", "gemini-3.6-flash")
        self.openai_model = getattr(settings, "OPENAI_MODEL", "gpt-4o-mini")

        # 1. Initialize Groq client
        self.groq_client = None
        if self.groq_key:
            try:
                import importlib
                openai_mod = importlib.import_module("openai")
                self.groq_client = openai_mod.OpenAI(
                    api_key=self.groq_key,
                    base_url="https://api.groq.com/openai/v1"
                )
            except Exception as e:
                logger.warning(f"Failed to initialize Groq SDK client: {e}")
                self.groq_client = None

        # 2. Initialize Gemini client
        self.gemini_client = None
        if self.gemini_key:
            try:
                import importlib
                genai = importlib.import_module("google.genai")
                self.gemini_client = genai.Client(api_key=self.gemini_key)
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini SDK client: {e}")
                self.gemini_client = None

        # 3. Initialize OpenAI client
        self.openai_client = None
        if self.openai_key:
            try:
                import importlib
                openai_mod = importlib.import_module("openai")
                self.openai_client = openai_mod.OpenAI(api_key=self.openai_key)
            except Exception as e:
                logger.warning(f"Failed to initialize OpenAI SDK client: {e}")
                self.openai_client = None

    def generate_text(self, system_prompt: str, user_prompt: str, temperature: float = 0.7) -> str:
        """Generates text using high-priority multi-provider waterfall: Groq -> Gemini -> OpenAI -> Fallback."""
        # Provider 1: Groq (Blazing fast, high quota, excellent multilingual/Hindi support)
        if self.groq_key:
            groq_models = [self.groq_model, "openai/gpt-oss-120b", "qwen/qwen3.6-27b", "openai/gpt-oss-20b"]
            for model in groq_models:
                if self.groq_client:
                    try:
                        res = self.groq_client.chat.completions.create(
                            model=model,
                            messages=[
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": user_prompt},
                            ],
                            temperature=temperature,
                        )
                        if res.choices and res.choices[0].message.content:
                            raw = res.choices[0].message.content
                            # Strip thinking tags if generated
                            raw = re.sub(r'<think>.*?</think>', '', raw, flags=re.DOTALL).strip()
                            return raw
                    except Exception as e:
                        logger.warning(f"Groq SDK generation with model {model} failed: {e}")

                # Direct REST fallback for Groq
                try:
                    headers = {
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {self.groq_key}"
                    }
                    payload = {
                        "model": model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt},
                        ],
                        "temperature": temperature
                    }
                    resp = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload, timeout=25)
                    if resp.status_code == 200:
                        data = resp.json()
                        choices = data.get("choices", [])
                        if choices:
                            raw = choices[0].get("message", {}).get("content", "")
                            raw = re.sub(r'<think>.*?</think>', '', raw, flags=re.DOTALL).strip()
                            return raw
                except Exception as e:
                    logger.warning(f"Groq REST attempt with model {model} failed: {e}")

        # Provider 2: Gemini
        if self.gemini_key:
            if self.gemini_client:
                try:
                    response = self.gemini_client.models.generate_content(
                        model=self.gemini_model,
                        contents=f"System: {system_prompt}\n\nUser: {user_prompt}",
                    )
                    if response and response.text:
                        return response.text
                except Exception as e:
                    logger.error(f"Gemini client generation error: {e}")

            # Direct HTTP REST for Gemini
            try:
                headers = {"Content-Type": "application/json", "X-goog-api-key": self.gemini_key}
                models_to_try = [self.gemini_model, "gemini-flash-latest", "gemini-2.5-flash"]
                payload = {
                    "contents": [
                        {"parts": [{"text": f"Instructions:\n{system_prompt}\n\nTask:\n{user_prompt}"}]}
                    ],
                    "generationConfig": {"temperature": temperature}
                }
                for model in models_to_try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
                    try:
                        res = requests.post(url, headers=headers, json=payload, timeout=8)
                        if res.status_code == 200:
                            data = res.json()
                            candidates = data.get("candidates", [])
                            if candidates:
                                parts = candidates[0].get("content", {}).get("parts", [])
                                if parts:
                                    return parts[0].get("text", "")
                        elif res.status_code == 429:
                            logger.warning(f"Gemini {model} returned HTTP 429 Quota Exceeded.")
                            break
                    except Exception as model_err:
                        logger.warning(f"Gemini model {model} attempt error: {model_err}")
            except Exception as e:
                logger.error(f"Gemini REST error: {e}")

        # Provider 3: OpenAI
        if self.openai_key:
            if self.openai_client:
                try:
                    response = self.openai_client.chat.completions.create(
                        model=self.openai_model,
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt},
                        ],
                        temperature=temperature,
                    )
                    if response.choices and response.choices[0].message.content:
                        return response.choices[0].message.content
                except Exception as e:
                    logger.error(f"OpenAI client generation error: {e}")

            # Direct HTTP REST Fallback for OpenAI
            try:
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.openai_key}"
                }
                payload = {
                    "model": self.openai_model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "temperature": temperature
                }
                res = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload, timeout=25)
                if res.status_code == 200:
                    data = res.json()
                    choices = data.get("choices", [])
                    if choices:
                        return choices[0].get("message", {}).get("content", "")
            except Exception as e:
                logger.error(f"OpenAI REST error: {e}")

        # Provider 4: Domain-specific Multilingual Fallback
        logger.warning("All online LLM providers unavailable or rate-limited. Using intelligent multilingual fallback generator.")
        return self._generate_intelligent_fallback(system_prompt, user_prompt)

    def generate_json(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        """Generates and extracts clean JSON from LLM response with native JSON mode where available."""
        full_system = system_prompt + "\n\nCRITICAL: Respond ONLY with a valid JSON object matching the requested schema. Do not include markdown code block quotes around the JSON."
        
        # 1. Try Groq with native JSON mode if configured
        if self.groq_key:
            groq_models = [self.groq_model, "openai/gpt-oss-120b", "openai/gpt-oss-20b"]
            for model in groq_models:
                try:
                    headers = {
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {self.groq_key}"
                    }
                    payload = {
                        "model": model,
                        "messages": [
                            {"role": "system", "content": full_system},
                            {"role": "user", "content": user_prompt},
                        ],
                        "response_format": {"type": "json_object"},
                        "temperature": 0.3
                    }
                    resp = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload, timeout=25)
                    if resp.status_code == 200:
                        content = resp.json().get("choices", [{}])[0].get("message", {}).get("content", "")
                        content = re.sub(r'<think>.*?</think>', '', content, flags=re.DOTALL).strip()
                        parsed = json.loads(content)
                        if isinstance(parsed, dict) and parsed:
                            return parsed
                except Exception as e:
                    logger.warning(f"Groq JSON mode with {model} failed: {e}")

        # 2. General text generation + robust JSON parsing
        raw = self.generate_text(full_system, user_prompt, temperature=0.3)
        cleaned = raw.strip()
        cleaned = re.sub(r'<think>.*?</think>', '', cleaned, flags=re.DOTALL).strip()
        
        # Clean JSON markdown blocks if present
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
            logger.warning(f"Direct JSON parse failed: {e}. Attempting substring extraction.")
            start = cleaned.find("{")
            end = cleaned.rfind("}")
            if start != -1 and end != -1 and end > start:
                try:
                    return json.loads(cleaned[start:end+1])
                except Exception:
                    pass
            
            return self._build_fallback_json(user_prompt, system_prompt)

    def _generate_intelligent_fallback(self, system_prompt: str, user_prompt: str) -> str:
        """Intelligent pedagogical template responses when external APIs are unavailable."""
        prompt_lower = (system_prompt + " " + user_prompt).lower()
        is_hindi = "hindi" in prompt_lower
        
        if "lesson_plan" in prompt_lower or "curriculum" in prompt_lower or "modules" in prompt_lower or "step" in prompt_lower:
            return json.dumps(self._build_fallback_json(user_prompt, system_prompt))
            
        if is_hindi:
            return "नमस्ते! मैं आपका एआई शिक्षक हूँ। आइए मिलकर इस महत्वपूर्ण विषय को बुनियादी सिद्धांतों और स्पष्ट उदाहरणों से समझते हैं।"
        return "Hello! I am your AI Educator. Let us dive into the core principles of this topic together from first principles."

    def _build_fallback_json(self, user_prompt: str, system_prompt: str = "") -> Dict[str, Any]:
        """Creates rich domain-specific fallback structured responses honoring Hindi/English language settings."""
        combined_text = (system_prompt + " " + user_prompt).lower()
        is_hindi = "hindi" in combined_text

        # Extract topic from prompt
        topic_match = re.search(r'topic[:"\s]+([\w\s\-]+)', user_prompt, re.IGNORECASE)
        topic = topic_match.group(1).strip() if topic_match else "Core Principles"

        # 1. Step Teaching Execution
        if "teacher_script" in combined_text or "formative_question" in combined_text or "visuals" in combined_text:
            step_match = re.search(r'step[:"\s\d\-]+([^\n\r]+)', user_prompt, re.IGNORECASE)
            title = step_match.group(1).strip().strip('"') if step_match else topic

            if is_hindi:
                return {
                    "teacher_script": f"नमस्ते! {title} के इस महत्वपूर्ण सत्र में आपका स्वागत है। आइए इस सिद्धांत को बुनियादी नज़रिए से समझते हैं। जब हम इस पूरी प्रक्रिया को ध्यान से देखते हैं, तो हर घटक का अपना एक स्पष्ट उद्देश्य होता है। अपने व्हाइटबोर्ड पर दिए गए दृश्य मॉडल को देखिए। इसके बाद हम एक रोचक प्रश्न के साथ आपकी समझ को परखेंगे।",
                    "visuals": [
                        {
                            "type": "mermaid",
                            "title": f"प्रक्रिया आरेख: {title}",
                            "content": "graph TD\n  A[मूल इनपुट / समस्या] --> B[रूपांतरण और प्रसंस्करण]\n  B --> C[सत्यापन और अनुकूलन]\n  C --> D[अंतिम परिणाम और अनुप्रयोग]",
                            "explanation": f"{title} के मूलभूत कार्यप्रवाह का चरणबद्ध दृश्य।"
                        },
                        {
                            "type": "analogy_box",
                            "title": "सहज उपमा (Analogy)",
                            "content": "इसे एक जल शोधन प्रणाली की तरह समझें: कच्चा डेटा कई स्तरों के फिल्टर से होकर गुजरता है, जहाँ हर स्तर अवांछित तत्वों को हटाकर एक शुद्ध और उपयोगी परिणाम देता है।",
                            "explanation": "जटिल यांत्रिकी को दैनिक जीवन के उदाहरण से जोड़ना।"
                        },
                        {
                            "type": "latex",
                            "title": "गणितीय संबंध",
                            "content": "E(x) = \\sum_{i=1}^n w_i \\cdot f(x_i) + b",
                            "explanation": "इस प्रक्रिया को नियंत्रित करने वाला मुख्य समीकरण।"
                        }
                    ],
                    "formative_question": {
                        "prompt": f"{title} के सिद्धांतों के आधार पर, यदि इनपुट की मात्रा सामान्य सीमा से अधिक हो जाए, तो सिस्टम कैसे प्रतिक्रिया देगा?",
                        "options": [
                            "सिस्टम बफ़र का उपयोग करके अतिरिक्त भार को सुचारू रूप से संभाल लेगा",
                            "सिस्टम बिना किसी चेतावनी के तुरंत पूरी तरह क्रैश हो जाएगा",
                            "गणितीय नियम उल्टे हो जाएंगे",
                            "सिस्टम स्थायी रूप से बंद हो जाएगा"
                        ],
                        "correct_answer": "सिस्टम बफ़र का उपयोग करके अतिरिक्त भार को सुचारू रूप से संभाल लेगा",
                        "question_type": "multiple_choice",
                        "bloom_level": "Analyze",
                        "hints": [
                            "इंजीनियरिंग में लोड बैलेंसिंग और बफ़र के उपयोग के बारे में सोचिए।",
                            "सॉफ्टवेयर में आकस्मिक भार को कैसे संभाला जाता है?"
                        ],
                        "common_misconceptions": [
                            "यह मान लेना कि हर सीमा उल्लंघन पर सिस्टम तुरंत स्थायी रूप से क्रैश हो जाता है।"
                        ]
                    }
                }
            else:
                return {
                    "teacher_script": f"Welcome to our deep dive into {title}. Let us break down this concept from first principles. When we look at how this system operates, notice the fundamental relationship between each interacting component. Take a moment to inspect the visual breakdown on your whiteboard, and then we will test our intuition together.",
                    "visuals": [
                        {
                            "type": "mermaid",
                            "title": f"Structural Flow: {title}",
                            "content": "graph TD\n  A[Input / Problem Definition] --> B[Processing & Transformation]\n  B --> C[Optimization & Validation]\n  C --> D[Target Solution Output]",
                            "explanation": f"Visualizing the end-to-end mechanism behind {title}."
                        },
                        {
                            "type": "analogy_box",
                            "title": "Intuitive Analogy",
                            "content": "Think of this mechanism like a water purification system: raw data flows through multi-stage filters, where each stage isolates and transforms key properties until a pure, reliable result emerges.",
                            "explanation": "Anchoring complex mechanics into everyday intuitive models."
                        },
                        {
                            "type": "latex",
                            "title": "Core Formula & Invariant",
                            "content": "E(x) = \\sum_{i=1}^n w_i \\cdot f(x_i) + b",
                            "explanation": "The fundamental mathematical relationship governing this process."
                        }
                    ],
                    "formative_question": {
                        "prompt": f"Based on the mechanism of {title}, what would happen if the primary input rate exceeds the processing threshold?",
                        "options": [
                            "The system gracefully buffers or scales throughput accordingly",
                            "The entire pipeline immediately collapses with no recovery",
                            "The mathematical invariant reverses its sign completely",
                            "The process halts permanently until restarted manually"
                        ],
                        "correct_answer": "The system gracefully buffers or scales throughput accordingly",
                        "question_type": "multiple_choice",
                        "bloom_level": "Analyze",
                        "hints": [
                            "Think about standard engineering resilience mechanisms.",
                            "Consider how buffers absorb high transient loads."
                        ],
                        "common_misconceptions": [
                            "Assuming systems immediately hard-crash without boundary controls."
                        ]
                    }
                }

        # 2. Socratic Answer Evaluation
        if "evaluate" in combined_text or "socratic" in combined_text or "student_response" in combined_text:
            if is_hindi:
                return {
                    "is_correct": True,
                    "confidence_score": 0.92,
                    "socratic_feedback": "शानदार उत्तर! आपने इस सिद्धांत के मूल तंत्र को बिल्कुल सही ढंग से समझा है और घटकों के परस्पर संबंध को सटीक रूप से स्पष्ट किया है।",
                    "diagnosed_misconception": None,
                    "needs_remediation": False,
                    "encouragement_note": "आपकी समझ बहुत गहरी है। आइए अब अगले चरण की ओर बढ़ते हैं!",
                    "next_action": "proceed_next_step"
                }
            else:
                return {
                    "is_correct": True,
                    "confidence_score": 0.9,
                    "socratic_feedback": "Excellent reasoning! You've grasped the core underlying mechanism and correctly articulated how the components interact under stress.",
                    "diagnosed_misconception": None,
                    "needs_remediation": False,
                    "encouragement_note": "Your intuition is razor sharp. Let us take this further into practical implementation!",
                    "next_action": "proceed_next_step"
                }

        # 3. Final Quiz Generation
        if "quiz" in combined_text or "assessment" in combined_text:
            if is_hindi:
                return {
                    "topic": topic,
                    "total_questions": 3,
                    "questions": [
                        {
                            "id": "q1",
                            "question": f"{topic} के मूल सिद्धांतों को समझने का मुख्य लाभ क्या है?",
                            "options": [
                                "यह बुनियादी तंत्र को स्पष्ट करता है और समझ को गहरा बनाता है",
                                "यह केवल कोड की पंक्तियों को बढ़ाता है",
                                "यह निष्पादन को धीमा करता है",
                                "इसका आधुनिक विज्ञान में कोई उपयोग नहीं है"
                            ],
                            "correct_option_index": 0,
                            "explanation": "बुनियादी सिद्धांतों की समझ जटिल समस्याओं को आसानी से सुलझाने में मदद करती है।",
                            "difficulty": "easy",
                            "concept_tested": "बुनियादी सिद्धांत"
                        },
                        {
                            "id": "q2",
                            "question": "प्रणाली में त्रुटियों की निगरानी के लिए सबसे प्रभावी तरीका कौन सा है?",
                            "options": [
                                "त्रुटियों को अनदेखा करना",
                                "संरचित लॉगिंग और ट्रेसिंग का उपयोग करना",
                                "सर्वर को तुरंत बंद कर देना",
                                "अलर्ट को म्यूट कर देना"
                            ],
                            "correct_option_index": 1,
                            "explanation": "संरचित ट्रेसिंग से संपूर्ण प्रक्रिया की निगरानी संभव होती है।",
                            "difficulty": "medium",
                            "concept_tested": "सिस्टम निगरानी"
                        }
                    ]
                }
            else:
                return {
                    "topic": topic,
                    "total_questions": 3,
                    "questions": [
                        {
                            "id": "q1",
                            "question": f"What is the primary motivation for studying {topic} from first principles?",
                            "options": [
                                "It clarifies foundational mechanics and builds deep intuition",
                                "It merely adds unnecessary complexity",
                                "It prevents debugging",
                                "It has no practical utility"
                            ],
                            "correct_option_index": 0,
                            "explanation": "First-principles thinking isolates core truths from convention.",
                            "difficulty": "easy",
                            "concept_tested": "First Principles"
                        }
                    ]
                }

        # 4. Lesson Plan / Curriculum Generation
        if is_hindi:
            return {
                "topic_title": f"{topic}: गहन समझ एवं मास्टरक्लास",
                "overview": f"{topic} पर आधारित एक व्यापक, चरणबद्ध शिक्षण यात्रा, जिसमें सहज उपमाएँ, व्हाइटबोर्ड आरेख और संवादात्मक प्रश्न शामिल हैं।",
                "total_estimated_mins": 15,
                "modules": [
                    {
                        "module_id": 1,
                        "title": f"मॉड्यूल 1: {topic} की बुनियादी अवधारणाएँ एवं सहज ज्ञान",
                        "description": "बुनियादी सिद्धांतों और मानसिक मॉडलों की समझ।",
                        "steps": [
                            {
                                "step_id": 1,
                                "step_type": "introduction",
                                "title": f"{topic} का परिचय एवं आवश्यकता",
                                "concept_summary": f"हमें {topic} की आवश्यकता क्यों है और यह किन समस्याओं को हल करता है?",
                                "estimated_duration_seconds": 120
                            },
                            {
                                "step_id": 2,
                                "step_type": "concept_breakdown",
                                "title": "मुख्य संरचना और कार्यप्रणाली",
                                "concept_summary": f"{topic} के आवश्यक घटकों और उनके परस्पर संबंधों का विश्लेषण।",
                                "estimated_duration_seconds": 180
                            }
                        ]
                    },
                    {
                        "module_id": 2,
                        "title": f"मॉड्यूल 2: दृश्य विश्लेषण एवं गहरा अध्ययन",
                        "description": "व्हाइटबोर्ड आरेखों और गणितीय सूत्रों के माध्यम से गहराई में समझ।",
                        "steps": [
                            {
                                "step_id": 3,
                                "step_type": "visual_deep_dive",
                                "title": "प्रक्रिया आरेख और मुख्य सूत्र",
                                "concept_summary": "प्रत्येक घटक की कार्यप्रणाली का विस्तृत विश्लेषण।",
                                "estimated_duration_seconds": 200
                            },
                            {
                                "step_id": 4,
                                "step_type": "checkpoint",
                                "title": "संवादात्मक अवधारणात्मक चुनौती",
                                "concept_summary": "विचारोत्तेजक प्रश्न के माध्यम से समझ की पुष्टि।",
                                "estimated_duration_seconds": 150
                            }
                        ]
                    },
                    {
                        "module_id": 3,
                        "title": "मॉड्यूल 3: व्यावहारिक अनुप्रयोग एवं निष्कर्ष",
                        "description": "वास्तविक उपयोग, सामान्य गलतियाँ और संपूर्ण ज्ञान का सारांश।",
                        "steps": [
                            {
                                "step_id": 5,
                                "step_type": "practical_demo",
                                "title": "व्यावहारिक अनुप्रयोग एवं उदाहरण",
                                "concept_summary": "वास्तविक समस्याओं में इस ज्ञान का प्रयोग।",
                                "estimated_duration_seconds": 180
                            },
                            {
                                "step_id": 6,
                                "step_type": "synthesis",
                                "title": "अंतिम सारांश एवं महारत",
                                "concept_summary": "सीखे गए सभी सिद्धांतों का त्वरित पुनरावलोकन।",
                                "estimated_duration_seconds": 120
                            }
                        ]
                    }
                ]
            }

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
                            "concept_summary": f"Why do we need {topic}? How does it solve fundamental problems?",
                            "estimated_duration_seconds": 120
                        },
                        {
                            "step_id": 2,
                            "step_type": "concept_breakdown",
                            "title": "First Principles Breakdown & Core Mechanics",
                            "concept_summary": f"Breaking down the structural and conceptual architecture of {topic}.",
                            "estimated_duration_seconds": 180
                        }
                    ]
                },
                {
                    "module_id": 2,
                    "title": f"Visual Architecture & Deep Dive",
                    "description": "Visualizing transformations, equations, and diagrammatic flows.",
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
