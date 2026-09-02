import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Body, Depends
from app.models.schemas import (
    LessonStep,
    StudentAnswerSubmission,
    PedagogicalEvaluation
)
from app.services.pedagogical_agent import pedagogical_agent
from app.services.llm_service import llm_service
from app.core.security import enforce_generation_guard

router = APIRouter(prefix="/classroom", tags=["Classroom Teaching Loop"])
logger = logging.getLogger("ClassroomAPI")

@router.post("/step", response_model=LessonStep)
async def teach_step(
    plan_id: str = Body(..., embed=True),
    step_id: int = Body(..., embed=True),
    doc_id: Optional[str] = Body(None, embed=True),
    _guard: None = Depends(enforce_generation_guard),
):
    """Executes a teaching turn: generates conversational speech script, whiteboard visuals, audio, and checkpoint."""
    try:
        step = await pedagogical_agent.execute_teaching_step(
            plan_id=plan_id,
            step_id=step_id,
            doc_id=doc_id
        )
        return step
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception:
        logger.exception("Failed to execute teaching step for plan_id=%s step_id=%s", plan_id, step_id)
        raise HTTPException(status_code=500, detail="Failed to execute teaching step.")

@router.post("/evaluate", response_model=PedagogicalEvaluation)
async def evaluate_answer(
    submission: StudentAnswerSubmission,
    _guard: None = Depends(enforce_generation_guard)
):
    """Evaluates student answer, detects specific cognitive misconceptions, and produces adaptive remediation."""
    try:
        eval_result = await pedagogical_agent.evaluate_student_response(
            plan_id=submission.plan_id,
            step_id=submission.step_id,
            question_prompt=submission.question_prompt,
            student_response=submission.student_response
        )
        return eval_result
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception:
        logger.exception("Evaluation failed for plan_id=%s step_id=%s", submission.plan_id, submission.step_id)
        raise HTTPException(status_code=500, detail="Evaluation failed.")

@router.post("/doubt")
async def ask_classroom_doubt(
    plan_id: str = Body(..., embed=True),
    step_id: int = Body(..., embed=True),
    student_question: str = Body(..., embed=True),
    _guard: None = Depends(enforce_generation_guard),
):
    """Answers live student doubts within the context of the active lesson step."""
    if plan_id not in pedagogical_agent.active_plans:
        raise HTTPException(status_code=404, detail="Lesson plan not found")
    
    plan = pedagogical_agent.active_plans[plan_id]
    step = next((s for s in (plan.all_steps_flattened or []) if s.step_id == step_id), None)
    
    system_prompt = f"""You are {plan.student_profile.teacher_persona}, answering a live student doubt in 1-on-1 video class.
Language: {plan.student_profile.language}.
Grade Level: {plan.student_profile.grade_level}.
Be direct, deeply intuitive, use a punchy real-world analogy, and check if that resolved their doubt.
"""
    user_prompt = f"""Topic: {plan.topic_title}
Current Step: {step.title if step else ''}
Student Question / Doubt: "{student_question}"
"""
    try:
        answer = llm_service.generate_text(system_prompt, user_prompt)
    except Exception:
        logger.exception("Doubt resolution failed for plan_id=%s step_id=%s", plan_id, step_id)
        raise HTTPException(status_code=500, detail="Failed to answer classroom doubt.")
    return {
        "teacher_answer": answer,
        "persona": plan.student_profile.teacher_persona
    }
