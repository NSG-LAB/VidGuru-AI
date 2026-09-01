# 🎓 VidGuru AI — Human-Like AI Educator Walkthrough

VidGuru AI is an intelligent, human-like AI educator that transforms textbooks, PDFs, notes, slides, research papers, or any topic into a personalized, adaptive, interactive video-based classroom experience.

---

## 🌟 What Was Built

### 1. Pedagogical AI Teaching Brain (Not a Chatbot)
- **Cognitive Science Foundations**: Implements structured curriculum progression based on Bloom's taxonomy (Intuition $\rightarrow$ Mental Models $\rightarrow$ Visual Breakdown $\rightarrow$ Formative Checkpoint $\rightarrow$ Misconception Diagnosis $\rightarrow$ Adaptive Remediation $\rightarrow$ Synthesis).
- **Misconception Diagnosis & Socratic Scaffolding**: Detects when a student has a cognitive flaw (e.g. confusing velocity with acceleration, string distances with embedding dot-products, reference with value types) and dynamically adapts by presenting targeted real-world analogies and step-down scaffolds.
- **Multilingual Code-Switching**: English, Hindi, Hinglish (mix of Hindi and English), and Spanish.

### 2. Interactive Video Classroom Studio
- **Animated AI Teacher Avatar**: Dynamic talking head with real-time lip-sync waveforms, emotion states, neural audio synthesis playback, and personality presets (**Dr. Nova**, **Prof. Aryan**, **Maya**, **Alex**).
- **Synchronized Smart Blackboard**: Dynamic canvas rendering:
  - **LaTeX Mathematical Formulas** (rendered via KaTeX)
  - **Mermaid Architecture Diagrams & Flowcharts** (rendered client-side)
  - **Interactive Code Snippets & Syntax Boxes**
  - **Analogy Boxes & Concept Takeaways**
- **Socratic Interaction Console**:
  - Voice STT input (Web Speech / Whisper integration) with live waveform.
  - Socratic hint triggers and live interactive doubts drawer.
- **Adaptive Remediation Pivot Alert**: Distinct visual alert displaying the diagnosed misconception, why students make the mistake, the tailored analogy, and a scaffolded follow-up question.
- **Curriculum Roadmap Timeline**: Progress tracker with completion badges and step navigation.

### 3. Document Ingestion & RAG Engine
- Fast text extraction from PDF, Markdown, TXT, and Code files.
- Hierarchical semantic chunking and BM25 hybrid vector retrieval.

### 4. Summative Assessment & Spaced Repetition Analytics
- **Adaptive Final Quiz**: 5-question mastery assessment with instant reasoning explanations.
- **Mastery Learning Report**:
  - Overall Mastery score & tier (**Novice**, **Developing**, **Proficient**, **Master**).
  - **Cognitive Misconceptions Log**: Matrix of misconceptions identified and resolved during class.
  - **Spaced Repetition Schedule**: Day 1, Day 3, Day 7 retention plan to prevent forgetting.
  - **Downloadable Study Notes**: Formatted Markdown notes summary ready for export.

---

## 🏗️ Project Architecture

```
VidGuru AI
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── classroom.py      # Teaching turns, Socratic evaluation, doubts
│   │   │   ├── documents.py      # PDF / notes upload & RAG indexing
│   │   │   ├── lesson_plan.py    # Adaptive syllabus generator
│   │   │   ├── voice.py          # Edge-TTS audio stream & STT
│   │   │   ├── assessment.py     # Quiz & learning report generation
│   │   │   └── health.py         # Service health & provider detection
│   │   ├── core/
│   │   │   └── config.py         # Settings & environment keys
│   │   ├── models/
│   │   │   └── schemas.py        # Pydantic schemas
│   │   ├── services/
│   │   │   ├── pedagogical_agent.py # Socratic AI teacher engine
│   │   │   ├── rag_engine.py     # Document parser, chunker & hybrid retrieval
│   │   │   ├── llm_service.py    # Multi-provider LLM (Gemini, OpenAI, Fallbacks)
│   │   │   └── tts_engine.py     # Multilingual neural speech synthesis
│   │   └── main.py               # FastAPI entrypoint
│   ├── test_integration.py       # End-to-end automated test suite
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx          # Landing & Onboarding Hub
│   │   │   ├── classroom/page.tsx# Interactive Video Classroom
│   │   │   ├── report/page.tsx   # Learning Analytics & Notes
│   │   │   └── globals.css       # Glassmorphism & custom animations
│   │   ├── components/
│   │   │   ├── classroom/
│   │   │   │   ├── TeacherAvatar.tsx   # Animated talking AI avatar
│   │   │   │   ├── SmartWhiteboard.tsx # LaTeX, Mermaid, Code blackboard
│   │   │   │   ├── InteractionPanel.tsx# Voice/Text Socratic console
│   │   │   │   ├── RemediationAlert.tsx# Misconception pivot banner
│   │   │   │   └── LessonTimeline.tsx  # Curriculum roadmap
│   │   │   ├── onboarding/
│   │   │   │   ├── DocumentUploader.tsx
│   │   │   │   └── PersonaSelector.tsx
│   │   │   └── assessment/
│   │   │       ├── QuizEngine.tsx
│   │   │       └── LearningReportView.tsx
│   │   └── lib/
│   │       ├── api.ts            # Typed API client
│   │       └── types.ts          # TypeScript interfaces
│   └── package.json
├── run_backend.sh
├── run_frontend.sh
├── start.sh
└── README.md
```

---

## 🧪 Verification Results

### 1. Automated Integration Tests (`test_integration.py`)
Ran full 7-step pedagogical test suite verifying:
- `Health check`: 200 OK
- `RAG Document Ingestion`: Text extraction and chunking verified
- `Personalized Lesson Plan`: Custom syllabus generation (Hinglish + Undergrad) verified
- `Teaching Step Execution`: Generated spoken transcript, whiteboard visuals, and neural voice audio file (`/api/v1/voice/audio/speech_*.mp3`)
- `Socratic Misconception Diagnosis`: Correctly diagnosed cognitive flaws and returned remediation triggers
- `Final Quiz Generation`: Progressive difficulty quiz created
- `Learning Report Generation`: Score, mastery tier, and spaced repetition plan generated

```
🎉 ALL 7 END-TO-END PEDAGOGICAL PIPELINE TESTS PASSED PERFECTLY!
```

### 2. Frontend Production Build Verification
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (7/7)
✓ Finalizing page optimization
```

---

## 🚀 How to Run Locally

```bash
# 1. Start everything with one command:
./start.sh

# Or start individually:
# Backend on http://localhost:8005
./run_backend.sh

# Frontend on http://localhost:3000
./run_frontend.sh
```
