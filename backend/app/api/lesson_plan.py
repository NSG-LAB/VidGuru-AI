from typing import Optional
from fastapi import APIRouter, HTTPException, Body
from app.models.schemas import LessonPlan, StudentProfile
from app.services.pedagogical_agent import pedagogical_agent

router = APIRouter(prefix="/lesson-plan", tags=["Lesson Plan"])

class CreatePlanRequest:
    pass

@router.post("/create", response_model=LessonPlan)
async def create_lesson_plan(
    topic: str = Body(..., embed=True),
    student_profile: StudentProfile = Body(...),
    doc_id: Optional[str] = Body(None, embed=True),
    raw_notes: Optional[str] = Body(None, embed=True),
):
    """Generates an adaptive, personalized lesson plan tailored to student profile and material."""
    try:
        plan = pedagogical_agent.create_lesson_plan(
            topic=topic,
            profile=student_profile,
            doc_id=doc_id,
            raw_notes=raw_notes or ""
        )
        return plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create lesson plan: {str(e)}")

@router.get("/{plan_id}", response_model=LessonPlan)
async def get_lesson_plan(plan_id: str):
    """Retrieves an existing lesson plan by ID."""
    if plan_id not in pedagogical_agent.active_plans:
        raise HTTPException(status_code=404, detail="Lesson plan not found")
    return pedagogical_agent.active_plans[plan_id]
