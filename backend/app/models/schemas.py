from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field, field_validator
import uuid

# ----------------------------------------------------
# Student Profile & Persona
# ----------------------------------------------------
class StudentProfile(BaseModel):
    grade_level: str = Field(
        default="undergraduate",
        description="Learning level: 'elementary', 'middle_school', 'high_school', 'undergraduate', 'advanced_research', 'layman'"
    )
    language: str = Field(
        default="English",
        description="Preferred language: 'English', 'Hindi', 'Hinglish', 'Spanish', 'French'"
    )
    learning_goal: str = Field(
        default="deep_conceptual",
        description="Goal: 'deep_conceptual', 'exam_cram', 'quick_revision', 'practical_coding', 'intuitive_first_principles'"
    )
    time_budget_mins: int = Field(
        default=15,
        description="Total available time in minutes (5, 10, 15, 30, 45)"
    )
    learning_style: str = Field(
        default="visual_analogies",
        description="Style: 'visual_analogies', 'socratic_inquiry', 'mathematical_rigor', 'code_first', 'storytelling'"
    )
    teacher_persona: str = Field(
        default="Dr. Nova (Intuitive & Warm)",
        description="AI Teacher Persona: 'Dr. Nova (Intuitive & Warm)', 'Prof. Aryan (Deep & Socratic)', 'Maya (Energetic & Visual)', 'Alex (Code & Engineering)'"
    )

# ----------------------------------------------------
# Document & RAG Schemas
# ----------------------------------------------------
class DocumentUploadResponse(BaseModel):
    doc_id: str
    filename: str
    num_pages: int
    num_chunks: int
    summary: str
    key_topics: List[str]

class TopicInputRequest(BaseModel):
    topic: str
    notes_or_context: Optional[str] = ""
    student_profile: Optional[StudentProfile] = None

# ----------------------------------------------------
# Visual Content for Dynamic Whiteboard
# ----------------------------------------------------
class VisualContent(BaseModel):
    type: Literal["latex", "mermaid", "code", "concept_card", "key_takeaways", "chart_data", "analogy_box"]
    title: str
    content: str
    explanation: Optional[str] = None
    language: Optional[str] = None  # for code: python, javascript, etc.

# ----------------------------------------------------
# Formative Checkpoint Question
# ----------------------------------------------------
class FormativeQuestion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    prompt: str
    options: Optional[List[str]] = None  # None if open-ended voice/text question
    correct_answer: Optional[str] = None
    question_type: Literal["multiple_choice", "open_ended_voice_or_text", "code_puzzle", "true_false"] = "open_ended_voice_or_text"
    bloom_level: str = "Apply"  # Remember, Understand, Apply, Analyze, Evaluate
    hints: List[str] = Field(default_factory=list)
    common_misconceptions: List[str] = Field(default_factory=list)

# ----------------------------------------------------
# Lesson Plan & Steps
# ----------------------------------------------------
class LessonStep(BaseModel):
    step_id: int
    step_type: Literal["introduction", "concept_breakdown", "visual_deep_dive", "practical_demo", "checkpoint", "adaptive_pivot", "synthesis"]
    title: str
    concept_summary: str
    estimated_duration_seconds: int = 120
    is_completed: bool = False
    
    # Teaching output generated on-the-fly or pre-planned
    teacher_script: Optional[str] = None
    visuals: Optional[List[VisualContent]] = None
    formative_question: Optional[FormativeQuestion] = None
    audio_url: Optional[str] = None

class LessonModule(BaseModel):
    module_id: int
    title: str
    description: str
    steps: List[LessonStep]

class LessonPlan(BaseModel):
    plan_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    topic_title: str
    overview: str
    student_profile: StudentProfile
    total_estimated_mins: int
    modules: List[LessonModule]
    all_steps_flattened: Optional[List[LessonStep]] = None

# ----------------------------------------------------
# Student Interaction & Adaptive Diagnosis
# ----------------------------------------------------
class StudentAnswerSubmission(BaseModel):
    plan_id: str
    step_id: int
    question_prompt: str
    student_response: str
    is_audio: bool = False

class AdaptiveRemediation(BaseModel):
    misconception_diagnosed: str
    why_it_happens: str
    remedial_analogy: str
    scaffolded_explanation: str
    refresher_visual: Optional[VisualContent] = None
    follow_up_question: FormativeQuestion

class PedagogicalEvaluation(BaseModel):
    is_correct: bool
    confidence_score: float  # 0.0 to 1.0
    socratic_feedback: str
    diagnosed_misconception: Optional[str] = None
    needs_remediation: bool = False
    remediation_package: Optional[AdaptiveRemediation] = None
    encouragement_note: str
    next_action: Literal["proceed_next_step", "trigger_remediation", "give_hint", "retry"] = "proceed_next_step"

    @field_validator("next_action", mode="before")
    @classmethod
    def normalize_next_action(cls, v: Any) -> str:
        s = str(v).lower()
        if "remediat" in s or "clarif" in s or "wrong" in s:
            return "trigger_remediation"
        if "hint" in s:
            return "give_hint"
        if "retry" in s or "retest" in s:
            return "retry"
        return "proceed_next_step"

# ----------------------------------------------------
# Final Assessment & Learning Report
# ----------------------------------------------------
class QuizQuestion(BaseModel):
    id: str
    question: str
    options: List[str]
    correct_option_index: int
    explanation: str
    concept_tested: str
    difficulty: Literal["easy", "medium", "hard"] = "medium"

    @field_validator("difficulty", mode="before")
    @classmethod
    def normalize_difficulty(cls, v: Any) -> str:
        s = str(v).lower()
        if "easy" in s or "basic" in s:
            return "easy"
        if "hard" in s or "advanced" in s or "difficult" in s:
            return "hard"
        return "medium"

class FinalQuiz(BaseModel):
    quiz_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    topic: str
    questions: List[QuizQuestion]
    total_questions: int

class QuizSubmission(BaseModel):
    quiz_id: str
    answers: Dict[str, int]  # question_id -> selected_option_index
    time_spent_seconds: int

class MisconceptionLog(BaseModel):
    concept: str
    misconception: str
    status: Literal["resolved", "needs_practice", "mastered"]
    remedy_applied: str

class LearningReport(BaseModel):
    report_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    topic: str
    student_profile: StudentProfile
    overall_score_pct: float
    mastery_level: Literal["Novice", "Developing", "Proficient", "Master"]
    strengths: List[str]
    areas_for_growth: List[str]
    misconceptions_log: List[MisconceptionLog]
    key_takeaways_summary: str
    spaced_repetition_plan: List[Dict[str, str]]  # Day 1, Day 3, Day 7 revision tips
    downloadable_notes_md: str
