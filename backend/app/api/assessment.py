from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Body
from app.models.schemas import FinalQuiz, QuizSubmission, LearningReport
from app.services.pedagogical_agent import pedagogical_agent

router = APIRouter(prefix="/assessment", tags=["Assessment & Learning Analytics"])

# In-memory storage for generated quizzes and reports
saved_quizzes: Dict[str, FinalQuiz] = {}
saved_reports: Dict[str, LearningReport] = {}

@router.post("/quiz/{plan_id}", response_model=FinalQuiz)
async def generate_quiz(plan_id: str):
    """Generates an adaptive final quiz covering all modules and diagnosed weak spots."""
    try:
        quiz = pedagogical_agent.generate_final_assessment(plan_id)
        saved_quizzes[quiz.quiz_id] = quiz
        return quiz
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quiz generation failed: {str(e)}")

@router.post("/submit-quiz", response_model=LearningReport)
async def submit_quiz(
    plan_id: str = Body(..., embed=True),
    quiz_id: str = Body(..., embed=True),
    answers: Dict[str, int] = Body(..., embed=True),
    time_spent_seconds: int = Body(180, embed=True)
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
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")

@router.get("/report/{plan_id}", response_model=LearningReport)
async def get_report(plan_id: str):
    """Retrieves generated learning report for a lesson plan."""
    if plan_id not in saved_reports:
        # Generate default report if not yet submitted
        try:
            report = pedagogical_agent.generate_learning_report(plan_id=plan_id, quiz_score_pct=85.0)
            saved_reports[plan_id] = report
            return report
        except Exception as e:
            raise HTTPException(status_code=404, detail="Report not available")
    return saved_reports[plan_id]
