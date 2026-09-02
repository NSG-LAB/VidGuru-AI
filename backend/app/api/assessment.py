import logging
from typing import Dict
from fastapi import APIRouter, HTTPException, Body, Depends
from app.models.schemas import FinalQuiz, LearningReport
from app.services.pedagogical_agent import pedagogical_agent
from app.core.persistence import load_json_state, save_json_state
from app.core.security import enforce_generation_guard

router = APIRouter(prefix="/assessment", tags=["Assessment & Learning Analytics"])
logger = logging.getLogger("AssessmentAPI")

# In-memory storage for generated quizzes and reports
_assessment_state = load_json_state("assessment_state.json")
saved_quizzes: Dict[str, FinalQuiz] = {}
saved_reports: Dict[str, LearningReport] = {}
for key, value in _assessment_state.get("saved_quizzes", {}).items():
    try:
        saved_quizzes[key] = FinalQuiz.model_validate(value)
    except Exception:
        logger.warning("Skipping invalid saved quiz state for key=%s", key)
for key, value in _assessment_state.get("saved_reports", {}).items():
    try:
        saved_reports[key] = LearningReport.model_validate(value)
    except Exception:
        logger.warning("Skipping invalid saved report state for key=%s", key)


def _persist_assessment_state() -> None:
    save_json_state(
        "assessment_state.json",
        {
            "saved_quizzes": {
                key: value.model_dump(mode="json")
                for key, value in saved_quizzes.items()
            },
            "saved_reports": {
                key: value.model_dump(mode="json")
                for key, value in saved_reports.items()
            },
        },
    )

@router.post("/quiz/{plan_id}", response_model=FinalQuiz)
async def generate_quiz(
    plan_id: str,
    _guard: None = Depends(enforce_generation_guard)
):
    """Generates an adaptive final quiz covering all modules and diagnosed weak spots."""
    try:
        quiz = pedagogical_agent.generate_final_assessment(plan_id)
        saved_quizzes[quiz.quiz_id] = quiz
        _persist_assessment_state()
        return quiz
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception:
        logger.exception("Quiz generation failed for plan_id=%s", plan_id)
        raise HTTPException(status_code=500, detail="Quiz generation failed.")

@router.post("/submit-quiz", response_model=LearningReport)
async def submit_quiz(
    plan_id: str = Body(..., embed=True),
    quiz_id: str = Body(..., embed=True),
    answers: Dict[str, int] = Body(..., embed=True),
    time_spent_seconds: int = Body(180, embed=True),
    _guard: None = Depends(enforce_generation_guard),
):
    """Evaluates final quiz submission and generates the comprehensive Learning Mastery Report."""
    if quiz_id not in saved_quizzes:
        raise HTTPException(status_code=404, detail="Quiz session not found")

    quiz = saved_quizzes[quiz_id]
    correct_count = 0
    total = len(quiz.questions)

    for q in quiz.questions:
        if q.id in answers and answers[q.id] == q.correct_option_index:
            correct_count += 1

    score_pct = (correct_count / total * 100.0) if total > 0 else 0.0

    try:
        report = pedagogical_agent.generate_learning_report(
            plan_id=plan_id,
            quiz_score_pct=score_pct,
            quiz_details={"total": total, "correct": correct_count, "time": time_spent_seconds}
        )
        saved_reports[plan_id] = report
        _persist_assessment_state()
        return report
    except Exception:
        logger.exception("Report generation failed for plan_id=%s", plan_id)
        raise HTTPException(status_code=500, detail="Report generation failed.")

@router.get("/report/{plan_id}", response_model=LearningReport)
async def get_report(plan_id: str):
    """Retrieves generated learning report for a lesson plan."""
    if plan_id not in saved_reports:
        # Generate default report if not yet submitted
        try:
            report = pedagogical_agent.generate_learning_report(plan_id=plan_id, quiz_score_pct=85.0)
            saved_reports[plan_id] = report
            _persist_assessment_state()
            return report
        except Exception:
            raise HTTPException(status_code=404, detail="Report not available")
    return saved_reports[plan_id]
