import json
import logging
import uuid
from typing import Dict, Any, List, Optional
from app.models.schemas import (
    StudentProfile,
    LessonPlan,
    LessonModule,
    LessonStep,
    VisualContent,
    FormativeQuestion,
    PedagogicalEvaluation,
    AdaptiveRemediation,
    FinalQuiz,
    QuizQuestion,
    LearningReport,
    MisconceptionLog
)
from app.core.config import settings
from app.services.llm_service import llm_service
from app.services.rag_engine import rag_engine
from app.services.tts_engine import tts_engine
from app.services.image_generator import image_generator

logger = logging.getLogger("PedagogicalAgent")

class PedagogicalAgent:
    def __init__(self):
        self._active_plans: Dict[str, LessonPlan] = {}
        self.misconception_history: Dict[str, List[MisconceptionLog]] = {}
        self.plans_dir = settings.DATA_DIR / "plans"
        self.plans_dir.mkdir(parents=True, exist_ok=True)

    @property
    def active_plans(self) -> Dict[str, LessonPlan]:
        """Dynamically provides active plans from memory and disk storage."""
        if hasattr(self, "plans_dir") and self.plans_dir.exists():
            for p in self.plans_dir.glob("*.json"):
                pid = p.stem
                if pid not in self._active_plans:
                    try:
                        self._active_plans[pid] = LessonPlan.model_validate_json(p.read_text(encoding="utf-8"))
                    except Exception:
                        pass
        return self._active_plans

    def save_plan(self, plan: LessonPlan):
        """Persists lesson plan in memory and on disk."""
        self._active_plans[plan.plan_id] = plan
        try:
            plan_file = self.plans_dir / f"{plan.plan_id}.json"
            plan_file.write_text(plan.model_dump_json(indent=2), encoding="utf-8")
        except Exception as e:
            logger.warning(f"Failed to persist lesson plan to disk: {e}")


    def create_lesson_plan(
        self,
        topic: str,
        profile: StudentProfile,
        doc_id: Optional[str] = None,
        raw_notes: Optional[str] = ""
    ) -> LessonPlan:
        """Plans an adaptive, pedagogical curriculum based on student level, time, and goal."""
        # 1. Retrieve RAG context if doc_id provided
        rag_context = ""
        if doc_id:
            rag_context = rag_engine.get_all_context(doc_id, max_chars=8000)
        elif raw_notes:
            rag_context = raw_notes[:8000]

        # Calculate target number of modules based on time budget
        if profile.time_budget_mins <= 5:
            num_modules = 2
            steps_per_module = 2
        elif profile.time_budget_mins <= 15:
            num_modules = 3
            steps_per_module = 2
        else:
            num_modules = 4
            steps_per_module = 3

        system_prompt = f"""You are an elite, world-class pedagogical architect and curriculum designer.
You design step-by-step masterclasses that build deep intuition from first principles.
Student Profile:
- Grade Level: {profile.grade_level}
- Target Language: {profile.language}. CRITICAL: If 'Hindi', all module titles, step titles, overview, and concept summaries MUST be written in fluent Hindi (Devanagari script हिन्दी) or natural bilingual Hindi so that the student learns in Hindi. If 'Hinglish', write natural conversational Hinglish using Roman script like 'Iska matlab yeh hai ki...'.
- Learning Goal: {profile.learning_goal}
- Available Time: {profile.time_budget_mins} minutes
- Learning Style: {profile.learning_style}
- Teacher Persona: {profile.teacher_persona}

Rules:
1. Divide into exactly {num_modules} cohesive modules with {steps_per_module} steps each.
2. Step types must be chosen from: ['introduction', 'concept_breakdown', 'visual_deep_dive', 'practical_demo', 'checkpoint', 'adaptive_pivot', 'synthesis'].
3. Keep cognitive load progressive (Bloom's taxonomy).
4. Return ONLY a valid JSON object matching the LessonPlan schema.
"""

        user_prompt = f"""Design a personalized lesson plan for topic: "{topic}".
Reference Material/Notes:
{rag_context if rag_context else 'None provided, use authoritative first-principles knowledge.'}

JSON Format Example:
{{
  "topic_title": "Understanding Neural Networks: From Perceptron to Backprop",
  "overview": "Clear 2-sentence summary of the learning journey.",
  "total_estimated_mins": {profile.time_budget_mins},
  "modules": [
    {{
      "module_id": 1,
      "title": "Mental Models & Intuition",
      "description": "Building the visual intuition of neurons.",
      "steps": [
        {{
          "step_id": 1,
          "step_type": "introduction",
          "title": "The Biological Analogy",
          "concept_summary": "How biological neurons inspired artificial nodes.",
          "estimated_duration_seconds": 120
        }},
        {{
          "step_id": 2,
          "step_type": "concept_breakdown",
          "title": "Weights, Biases & Activation",
          "concept_summary": "Why weights scale signals and biases shift the decision boundary.",
          "estimated_duration_seconds": 180
        }}
      ]
    }}
  ]
}}
"""

        plan_data = llm_service.generate_json(system_prompt, user_prompt)
        
        # Build structured LessonPlan object
        plan_id = str(uuid.uuid4())
        modules = []
        flattened_steps = []
        
        raw_modules = plan_data.get("modules", [])
        for m_idx, m_data in enumerate(raw_modules):
            steps = []
            for s_idx, s_data in enumerate(m_data.get("steps", [])):
                step_obj = LessonStep(
                    step_id=len(flattened_steps) + 1,
                    step_type=s_data.get("step_type", "concept_breakdown"),
                    title=s_data.get("title", f"Step {len(flattened_steps)+1}"),
                    concept_summary=s_data.get("concept_summary", ""),
                    estimated_duration_seconds=s_data.get("estimated_duration_seconds", 150),
                    is_completed=False
                )
                steps.append(step_obj)
                flattened_steps.append(step_obj)

            module_obj = LessonModule(
                module_id=m_idx + 1,
                title=m_data.get("title", f"Module {m_idx+1}"),
                description=m_data.get("description", ""),
                steps=steps
            )
            modules.append(module_obj)

        if not modules:
            # Fallback module if parsing was empty
            step1 = LessonStep(step_id=1, step_type="introduction", title=f"Introduction to {topic}", concept_summary="Intuition and foundations")
            step2 = LessonStep(step_id=2, step_type="checkpoint", title="Core Checkpoint Challenge", concept_summary="Testing understanding")
            modules = [LessonModule(module_id=1, title="Foundations", description="Core concepts", steps=[step1, step2])]
            flattened_steps = [step1, step2]

        lesson_plan = LessonPlan(
            plan_id=plan_id,
            topic_title=plan_data.get("topic_title", topic),
            overview=plan_data.get("overview", f"Interactive masterclass on {topic}"),
            student_profile=profile,
            total_estimated_mins=profile.time_budget_mins,
            modules=modules,
            all_steps_flattened=flattened_steps
        )

        self.save_plan(lesson_plan)
        self.misconception_history[plan_id] = []
        return lesson_plan

    async def execute_teaching_step(
        self,
        plan_id: str,
        step_id: int,
        doc_id: Optional[str] = None
    ) -> LessonStep:
        """Generates conversational spoken teacher script, whiteboard visuals, and formative question for a step."""
        if plan_id not in self.active_plans:
            raise ValueError("Lesson plan not found")

        plan = self.active_plans[plan_id]
        step = next((s for s in (plan.all_steps_flattened or []) if s.step_id == step_id), None)
        if not step:
            raise ValueError(f"Step {step_id} not found in plan")

        # RAG context for this specific step query
        rag_chunks = []
        if doc_id:
            rag_chunks = rag_engine.retrieve(doc_id, f"{step.title} {step.concept_summary}", top_k=3)
        context_str = "\n".join([c["text"] for c in rag_chunks]) if rag_chunks else ""

        system_prompt = f"""You are {plan.student_profile.teacher_persona}, a world-renowned human-like educator.
You are currently delivering a 1-on-1 personalized video lecture.
- Tone & Persona Rules:
- Empathy, enthusiasm, crystal-clear analogies, and Socratic scaffolding.
- Language: {plan.student_profile.language}. CRITICAL: If 'Hindi', the "teacher_script" MUST be spoken entirely in fluent Hindi (Devanagari script हिन्दी) so that the audio synthesizer speaks pure Hindi to the student! All visual explanations and formative checkpoint questions must also be in Hindi. If 'Hinglish', talk naturally in Romanized Hinglish (mix Hindi and English seamlessly like an Indian professor: 'Dhyan se samjho, yahan critical point yeh hai...').
- Target Level: {plan.student_profile.grade_level}.
- NEVER dump walls of text. Speak directly to the student as if you are on camera.
- You must produce dynamic whiteboard visuals (choose from latex formulas, mermaid diagrams, code snippets, key takeaways, analogy cards, AND educational images/illustrations).
- You MUST include at least ONE visual of type "image" with an "image_prompt" field that describes a clear, educational illustration to generate (e.g., "A labeled diagram showing the structure of a neuron with dendrites, axon, and synaptic terminals", "A visual comparison of DNA double helix vs RNA single strand with labeled base pairs"). This image will be generated by an AI image model.
- You MUST end the step with a thought-provoking Formative Checkpoint Question to test if the student truly internalized the concept before moving forward.
"""

        user_prompt = f"""Topic: {plan.topic_title}
Module & Step: Step {step.step_id} - "{step.title}"
Concept Summary: {step.concept_summary}
Reference Material: {context_str if context_str else 'Use first-principles expert knowledge.'}

Generate JSON with:
1. "teacher_script": Conversational transcript spoken by the teacher (approx 120-250 words, conversational, warm, engaging).
2. "visuals": Array of whiteboard elements. Example types:
   - "image": Educational illustration (MUST include "image_prompt" field with a detailed visual description for AI image generation, e.g. "A labeled anatomical diagram of the human heart showing all four chambers, valves, and blood flow direction with arrows")
   - "latex": LaTeX equation (e.g. "f(x) = \\sigma(W^T x + b)")
   - "mermaid": Mermaid diagram syntax (e.g. "graph TD\\n  A[Input] --> B[Hidden Layer] --> C[Output]")
   - "code": Code block with language
   - "analogy_box": Real world analogy summary
   - "key_takeaways": 2-3 bullet point summary
   IMPORTANT: Always include at least one "image" type visual with a descriptive "image_prompt".
3. "formative_question": A checkpoint question.
   - "prompt": The question text.
   - "question_type": "open_ended_voice_or_text" or "multiple_choice"
   - "options": List of options if multiple choice, or null for open-ended
   - "correct_answer": The core reasoning or correct answer
   - "bloom_level": "Understand", "Apply", or "Analyze"
   - "hints": [Hint 1, Hint 2]
   - "common_misconceptions": [Misconception 1, Misconception 2]
"""

        response_data = llm_service.generate_json(system_prompt, user_prompt)

        # Parse visuals
        visuals = []
        for v in response_data.get("visuals", []):
            vis = VisualContent(
                type=v.get("type", "concept_card"),
                title=v.get("title", "Concept Visual"),
                content=v.get("content", ""),
                explanation=v.get("explanation", ""),
                language=v.get("language"),
                image_prompt=v.get("image_prompt")
            )
            visuals.append(vis)

        # Generate AI images for visuals with type='image'
        for vis in visuals:
            if vis.type == "image" and vis.image_prompt:
                try:
                    img_url = await image_generator.generate_educational_image(
                        image_prompt=vis.image_prompt,
                        topic=plan.topic_title,
                        step_title=step.title
                    )
                    if img_url:
                        vis.image_url = img_url
                        logger.info(f"Generated image for step {step.step_id}: {img_url}")
                    else:
                        logger.warning(f"Image generation returned None for step {step.step_id}, keeping as concept_card")
                        vis.type = "concept_card"  # Fallback to concept card if image fails
                except Exception as e:
                    logger.error(f"Image generation error for step {step.step_id}: {e}")
                    vis.type = "concept_card"  # Graceful fallback

        # Default visual if none produced
        if not visuals:
            visuals.append(VisualContent(
                type="concept_card",
                title=step.title,
                content=step.concept_summary,
                explanation="Core mental model"
            ))

        # Parse formative question
        fq_data = response_data.get("formative_question", {})
        formative_q = FormativeQuestion(
            id=str(uuid.uuid4())[:8],
            prompt=fq_data.get("prompt", f"In your own words, how would you explain the core mechanism of {step.title}?"),
            options=fq_data.get("options"),
            correct_answer=fq_data.get("correct_answer", "Accurate conceptual explanation"),
            question_type=fq_data.get("question_type", "open_ended_voice_or_text"),
            bloom_level=fq_data.get("bloom_level", "Apply"),
            hints=fq_data.get("hints", ["Think about the cause and effect.", "Recall the analogy we just discussed."]),
            common_misconceptions=fq_data.get("common_misconceptions", [])
        )

        teacher_script = response_data.get("teacher_script", f"Welcome to this step on {step.title}. Let us explore the core intuition together!")

        # Generate Audio with TTS Engine
        audio_url = await tts_engine.generate_speech_file(
            text=teacher_script,
            persona=plan.student_profile.teacher_persona,
            language=plan.student_profile.language
        )

        step.teacher_script = teacher_script
        step.visuals = visuals
        step.formative_question = formative_q
        step.audio_url = audio_url

        self.save_plan(plan)
        return step

    async def evaluate_student_response(
        self,
        plan_id: str,
        step_id: int,
        question_prompt: str,
        student_response: str
    ) -> PedagogicalEvaluation:
        """Evaluates student answer, diagnoses misconceptions, and generates adaptive remediation if needed."""
        if plan_id not in self.active_plans:
            raise ValueError("Lesson plan not found")

        plan = self.active_plans[plan_id]
        step = next((s for s in (plan.all_steps_flattened or []) if s.step_id == step_id), None)
        
        system_prompt = f"""You are {plan.student_profile.teacher_persona}, evaluating a student's answer in a 1-on-1 tutoring session.
Language: {plan.student_profile.language}. CRITICAL: If 'Hindi', evaluate and provide all feedback, encouragement, and remediation entirely in Hindi (Devanagari script हिन्दी). If 'Hinglish', use conversational Romanized Hinglish.
Student Level: {plan.student_profile.grade_level}.

Your Pedagogical Goals:
1. Determine if the student's answer demonstrates true conceptual understanding (is_correct: true/false).
2. DIAGNOSE COGNITIVE MISCONCEPTIONS: If incorrect or partially flawed, pinpoint the EXACT misconception (e.g. 'Confusing correlation with causation', 'Assuming constant acceleration means constant velocity', 'Treating array indexing as 1-based').
3. If incorrect or flawed:
   - Provide gentle, warm Socratic feedback without making them feel bad.
   - Design a Remedial Analogy that makes the concept instantly click.
   - Formulate a simplified scaffolding explanation and a follow-up step-down question.
4. If correct:
   - Celebrate their insight, highlight what made their reasoning sharp, and set up the next breakthrough.
"""

        user_prompt = f"""Topic: {plan.topic_title}
Current Concept: {step.title if step else ''}
Teacher Question: {question_prompt}
Student Response: "{student_response}"

Return JSON matching this exact structure:
{{
  "is_correct": true | false,
  "confidence_score": 0.85,
  "socratic_feedback": "Detailed encouraging feedback directly addressing the student.",
  "diagnosed_misconception": "Specific misconception name or null if correct",
  "needs_remediation": true | false,
  "remediation_package": {{
    "misconception_diagnosed": "Name of misconception",
    "why_it_happens": "Why students commonly make this mistake",
    "remedial_analogy": "A brilliant everyday real-world analogy to clarify the distinction",
    "scaffolded_explanation": "Clear step-by-step breakdown clarifying the concept",
    "refresher_visual": {{
      "type": "analogy_box",
      "title": "Key Distinction",
      "content": "Visual breakdown of the fix"
    }},
    "follow_up_question": {{
      "prompt": "Simpler follow-up check question",
      "question_type": "multiple_choice" or "open_ended_voice_or_text",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "Option or answer"
    }}
  }} or null,
  "encouragement_note": "A warm, energizing teacher remark",
  "next_action": "proceed_next_step" | "trigger_remediation" | "give_hint" | "retry"
}}
"""

        eval_data = llm_service.generate_json(system_prompt, user_prompt)
        is_correct = eval_data.get("is_correct", False)
        diagnosed_misc = eval_data.get("diagnosed_misconception")

        # Log misconception for reporting
        if diagnosed_misc and not is_correct:
            log_entry = MisconceptionLog(
                concept=step.title if step else plan.topic_title,
                misconception=diagnosed_misc,
                status="needs_practice",
                remedy_applied=eval_data.get("remediation_package", {}).get("remedial_analogy", "Analogy and scaffolded explanation") if eval_data.get("remediation_package") else "Scaffolding"
            )
            self.misconception_history[plan_id].append(log_entry)
        elif is_correct and step:
            step.is_completed = True

        remediation_pkg = None
        if eval_data.get("remediation_package"):
            rp = eval_data["remediation_package"]
            ref_vis = None
            if rp.get("refresher_visual"):
                ref_vis = VisualContent(
                    type=rp["refresher_visual"].get("type", "analogy_box"),
                    title=rp["refresher_visual"].get("title", "Clarification"),
                    content=rp["refresher_visual"].get("content", ""),
                    explanation=rp["refresher_visual"].get("explanation")
                )
            
            fq_data = rp.get("follow_up_question", {})
            follow_up_q = FormativeQuestion(
                id=str(uuid.uuid4())[:8],
                prompt=fq_data.get("prompt", "Let's check with this simpler case: what happens now?"),
                options=fq_data.get("options"),
                correct_answer=fq_data.get("correct_answer"),
                question_type=fq_data.get("question_type", "multiple_choice")
            )

            remediation_pkg = AdaptiveRemediation(
                misconception_diagnosed=rp.get("misconception_diagnosed", "Misconception"),
                why_it_happens=rp.get("why_it_happens", ""),
                remedial_analogy=rp.get("remedial_analogy", ""),
                scaffolded_explanation=rp.get("scaffolded_explanation", ""),
                refresher_visual=ref_vis,
                follow_up_question=follow_up_q
            )

        return PedagogicalEvaluation(
            is_correct=is_correct,
            confidence_score=eval_data.get("confidence_score", 0.8),
            socratic_feedback=eval_data.get("socratic_feedback", "Great effort! Let's examine this carefully."),
            diagnosed_misconception=diagnosed_misc,
            needs_remediation=eval_data.get("needs_remediation", not is_correct),
            remediation_package=remediation_pkg,
            encouragement_note=eval_data.get("encouragement_note", "Keep asking questions and exploring!"),
            next_action=eval_data.get("next_action", "proceed_next_step" if is_correct else "trigger_remediation")
        )

    def generate_final_assessment(self, plan_id: str) -> FinalQuiz:
        """Generates an adaptive final quiz testing all taught concepts and diagnosed weak spots."""
        if plan_id not in self.active_plans:
            raise ValueError("Lesson plan not found")

        plan = self.active_plans[plan_id]
        misc_logs = self.misconception_history.get(plan_id, [])
        misc_summary = ", ".join([m.misconception for m in misc_logs]) if misc_logs else "None recorded."

        system_prompt = f"""You are a master psychometrician and educator creating a final mastery quiz.
Target Level: {plan.student_profile.grade_level}.
Language: {plan.student_profile.language}.
Topic: {plan.topic_title}
Misconceptions Identified during class: {misc_summary}

Create a 5-question multiple choice mastery quiz with progressive difficulty:
- Question 1: Intuition & Foundations (Easy)
- Question 2: Mechanism & Calculation/Application (Medium)
- Question 3: Specifically testing the identified misconception trap (Medium)
- Question 4: Deep Edge Case / Analytical problem (Hard)
- Question 5: Real-world Synthesis (Medium-Hard)

Return strictly JSON matching the FinalQuiz schema.
"""

        user_prompt = f"""Topic: {plan.topic_title}
Modules Covered: {[m.title for m in plan.modules]}

Format:
{{
  "topic": "{plan.topic_title}",
  "total_questions": 5,
  "questions": [
    {{
      "id": "q1",
      "question": "Question text here...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_option_index": 1,
      "explanation": "Why B is correct and others are wrong...",
      "concept_tested": "Concept Name",
      "difficulty": "easy"
    }}
  ]
}}
"""

        quiz_data = llm_service.generate_json(system_prompt, user_prompt)
        questions = []
        for idx, q in enumerate(quiz_data.get("questions", [])):
            diff_raw = str(q.get("difficulty", "medium")).lower()
            if "easy" in diff_raw or "basic" in diff_raw:
                clean_diff = "easy"
            elif "hard" in diff_raw or "adv" in diff_raw or "difficult" in diff_raw:
                clean_diff = "hard"
            else:
                clean_diff = "medium"

            questions.append(QuizQuestion(
                id=q.get("id", f"q{idx+1}"),
                question=q.get("question", f"Question {idx+1}"),
                options=q.get("options", ["Option A", "Option B", "Option C", "Option D"]),
                correct_option_index=q.get("correct_option_index", 0),
                explanation=q.get("explanation", ""),
                concept_tested=q.get("concept_tested", plan.topic_title),
                difficulty=clean_diff
            ))

        if not questions:
            # Fallback question
            questions = [
                QuizQuestion(
                    id="q1",
                    question=f"What is the foundational principle behind {plan.topic_title}?",
                    options=["Optimization & First Principles", "Random Search", "Static Heuristics", "None of the above"],
                    correct_option_index=0,
                    explanation="Optimization and first-principles reasoning form the core architecture.",
                    concept_tested="Foundations",
                    difficulty="easy"
                )
            ]

        return FinalQuiz(
            quiz_id=str(uuid.uuid4()),
            topic=plan.topic_title,
            questions=questions,
            total_questions=len(questions)
        )

    def generate_learning_report(
        self,
        plan_id: str,
        quiz_score_pct: float,
        quiz_details: Optional[Dict[str, Any]] = None
    ) -> LearningReport:
        """Generates a comprehensive mastery analytics report with spaced repetition schedule and study notes."""
        if plan_id not in self.active_plans:
            raise ValueError("Lesson plan not found")

        plan = self.active_plans[plan_id]
        misc_logs = self.misconception_history.get(plan_id, [])

        # Determine mastery tier
        if quiz_score_pct >= 90:
            mastery = "Master"
        elif quiz_score_pct >= 75:
            mastery = "Proficient"
        elif quiz_score_pct >= 50:
            mastery = "Developing"
        else:
            mastery = "Novice"

        # Generate lecture notes in markdown
        notes_md = f"""# Masterclass Study Notes: {plan.topic_title}
**Educator Persona**: {plan.student_profile.teacher_persona}  
**Mastery Achieved**: {mastery} ({quiz_score_pct:.1f}%)

---

## 1. Executive Summary & Intuition
{plan.overview}

## 2. Core Concepts & Whiteboard Formulas
"""
        for mod in plan.modules:
            notes_md += f"\n### {mod.title}\n{mod.description}\n"
            for stp in mod.steps:
                notes_md += f"- **{stp.title}**: {stp.concept_summary}\n"
                if stp.visuals:
                    for vis in stp.visuals:
                        if vis.type == "latex":
                            notes_md += f"  $$\n  {vis.content}\n  $$\n"
                        elif vis.type == "code":
                            notes_md += f"  ```{vis.language or 'text'}\n{vis.content}\n  ```\n"

        notes_md += f"""
---

## 3. Misconception Traps & Clarifications
"""
        if misc_logs:
            for m in misc_logs:
                notes_md += f"- **Trap**: {m.misconception}\n  - *Key Clarification*: {m.remedy_applied}\n"
        else:
            notes_md += "- No critical misconceptions detected! Solid conceptual foundation demonstrated.\n"

        spaced_plan = [
            {"day": "Day 1 (Tomorrow)", "action": "5-Minute Quick Recall: Re-read the core formulas and draw the concept architecture from memory."},
            {"day": "Day 3", "action": "Active Socratic Retrieval: Explain the primary mechanism out loud to someone else using the analogy."},
            {"day": "Day 7", "action": "Edge Case Challenge: Solve a hard problem combining this topic with adjacent domain principles."}
        ]

        strengths = [
            f"Strong grasp of {plan.topic_title} fundamentals",
            "Engaged deeply with formative checkpoints",
            "Active Socratic inquiry and dialogue"
        ]
        growth = [
            "Review edge-case boundary conditions",
            "Practice formula derivations under timed conditions"
        ]

        return LearningReport(
            report_id=str(uuid.uuid4()),
            topic=plan.topic_title,
            student_profile=plan.student_profile,
            overall_score_pct=quiz_score_pct,
            mastery_level=mastery,
            strengths=strengths,
            areas_for_growth=growth,
            misconceptions_log=misc_logs,
            key_takeaways_summary=f"Mastered core fundamentals of {plan.topic_title} with {mastery} level competence.",
            spaced_repetition_plan=spaced_plan,
            downloadable_notes_md=notes_md
        )

pedagogical_agent = PedagogicalAgent()
