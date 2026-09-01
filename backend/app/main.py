import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.api.documents import router as documents_router
from app.api.lesson_plan import router as lesson_plan_router
from app.api.classroom import router as classroom_router
from app.api.voice import router as voice_router
from app.api.assessment import router as assessment_router
from app.api.health import router as health_router

app = FastAPI(
    title="VidGuru AI API",
    description="Human-Like AI Educator that Teaches Through Video, Dynamic Whiteboard, and Socratic Dialogue",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
api_prefix = settings.API_V1_STR
app.include_router(health_router, prefix=api_prefix)
app.include_router(documents_router, prefix=api_prefix)
app.include_router(lesson_plan_router, prefix=api_prefix)
app.include_router(classroom_router, prefix=api_prefix)
app.include_router(voice_router, prefix=api_prefix)
app.include_router(assessment_router, prefix=api_prefix)

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
