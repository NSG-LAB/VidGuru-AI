# 🎓 VidGuru AI — Human-Like AI Educator That Teaches Through Video

> **VidGuru AI** is an intelligent, human-like AI educator that transforms textbooks, PDFs, lecture notes, slides, research papers, or any topic into a personalized, adaptive, interactive video-based classroom experience.

Unlike static chatbots that merely answer questions, **VidGuru AI behaves like a world-class 1-on-1 teacher**: it breaks concepts down step-by-step from first principles, dynamically illustrates ideas with synchronized blackboard visuals (LaTeX equations, Mermaid architecture diagrams, live code playgrounds, and real-world analogies), asks thought-provoking formative checkpoint questions, diagnoses cognitive misconceptions, adapts explanations in real-time with tailored remedial analogies, and provides a comprehensive learning report with a spaced repetition retention schedule.

---

## 🌟 Key Features & Capabilities

### 1. Pedagogical AI Teacher (Not Just a Chatbot)
- **Cognitive Science Foundations**: Implements structured curriculum progression based on Bloom's taxonomy (Intuition $\rightarrow$ Mental Models $\rightarrow$ Visual Breakdown $\rightarrow$ Formative Checkpoint $\rightarrow$ Misconception Diagnosis $\rightarrow$ Adaptive Remediation $\rightarrow$ Synthesis).
- **Misconception Diagnosis & Socratic Scaffolding**: Detects when a student has a cognitive flaw (e.g. confusing velocity with acceleration, string distances with embedding dot-products, reference with value types) and dynamically adapts by presenting targeted real-world analogies and step-down scaffolds.
- **Formative Checkpoint Questions**: Embedded within every lesson step with Voice (STT) or Text student response evaluation.

### 2. Interactive Video Classroom Studio & Talking Avatar
- **Emotion-Aware AI Teacher Avatar**: Dynamic animated avatar with 5 real-time emotion states (`explaining`, `thinking`, `celebrating`, `empathizing`, `inquiring`), natural blinking cycles, mouth lip-sync animations, and adjustable playback speeds ($0.75\times$ to $1.5\times$).
- **4 Teacher Personas**:
  - 🔬 **Dr. Nova**: Intuitive & concept-first educator (Analogy specialist).
  - 🏛️ **Prof. Aryan**: Deep Socratic & first-principles guide.
  - ⚡ **Maya**: Energetic & visual master instructor.
  - 💻 **Alex**: Hands-on systems & code architect.
- **Mini Picture-in-Picture (PiP) Mode**: Float the teacher avatar anywhere on screen while reviewing complex diagrams.
- **Full Lecture Video Recording & Export**: Built-in `MediaRecorder` video capture engine enabling one-click recording and download of the complete video masterclass (`.webm` / `.mp4`).

### 3. Synchronized Smart Blackboard
- **LaTeX Mathematical Formulas**: Rendered dynamically with KaTeX.
- **Mermaid Architecture Diagrams & Flowcharts**: Client-side interactive rendering.
- **Code Playgrounds**: Multi-language code snippets with one-click copy and syntax formatting.
- **Intuitive Analogy Cards & Key Takeaway Summaries**: Color-coded pedagogical visual cards.

### 4. High-Impact Animated Landing Page
- **Hero Particle & Glow Canvas**: Gradient headline with typewriter cursor effect and floating ambient glow orbs.
- **Live Stats Counters**: Animated count-up metrics for preset masterclasses, teacher personas, languages, and core features.
- **Feature Showcase Grid**: 6 color-coded cards with shimmer sweep effects and staggered entrance animations.
- **4-Step Workflow Pipeline**: Visual roadmap (`01 Upload` $\rightarrow$ `02 Profile` $\rightarrow$ `03 Classroom` $\rightarrow$ `04 Report`) with animated connector lines.
- **Live Classroom Mockup Preview**: Stylized interactive preview with feature overlay pills.

### 5. Multilingual & Code-Switching Support
- Supports **English, Hindi (हिन्दी), Hinglish (conversational mix of Hindi and English), and Spanish**.
- Localized pedagogical voice matching via neural speech synthesis.

### 6. Document Ingestion & RAG (Retrieval-Augmented Generation)
- Drag-and-drop ingestion of PDFs, Markdown notes, TXT files, and raw course syllabi.
- Hierarchical semantic chunking and BM25 hybrid similarity search for grounded teaching.

### 7. Summative Assessment & Spaced Repetition Analytics
- **Adaptive Final Mastery Quiz**: 5-question mastery assessment with instant Socratic reasoning feedback.
- **Comprehensive Learning Report**:
  - Overall Mastery score & tier (**Novice**, **Developing**, **Proficient**, **Master**).
  - **Cognitive Misconceptions Log**: Matrix of misconceptions identified and resolved during class.
  - **Spaced Repetition Schedule**: Day 1, Day 3, Day 7 retention plan based on the Ebbinghaus forgetting curve.
  - **Downloadable Study Notes**: Full markdown study notes summary ready for export.

---

## 📋 Assessment Checklist (12/12 Features Verified)

| # | Feature Requirement | Status | Implementation Details |
|---|---|:---:|---|
| 1 | **Learning from Uploaded Material** | ✅ | PDF, TXT, MD parser with semantic chunking & RAG |
| 2 | **Topic-Based Teaching** | ✅ | Instant masterclass generator for any custom topic |
| 3 | **AI-Generated Lesson Structure** | ✅ | Time-budgeted cognitive roadmap based on Bloom's taxonomy |
| 4 | **Personalized Teaching** | ✅ | Grade levels, goals, languages, and teacher personas |
| 5 | **Human-Like Teaching Interaction** | ✅ | Conversational lecture turns, analogies, and Socratic hints |
| 6 | **Video-Based AI Presentation** | ✅ | Full video classroom + downloadable video masterclass export |
| 7 | **AI Voice** | ✅ | Multilingual neural Edge-TTS with 1-click browser unlock |
| 8 | **Human-Like AI Avatar** | ✅ | 5 emotion states, lip-sync, blinking, and PiP mode |
| 9 | **Multilingual Capability** | ✅ | English, Hindi, Hinglish, and Spanish |
| 10 | **Student Questioning & Assessment** | ✅ | Formative checkpoint questions + 5-question final quiz |
| 11 | **Adaptive Response to Performance** | ✅ | Misconception diagnosis engine + remedial analogies |
| 12 | **Working Prototype** | ✅ | Full-stack FastAPI + Next.js 14 application |

---

## 🏗️ Architecture & Technology Stack

```
VidGuru AI
├── frontend/ (Next.js + Tailwind CSS)
│   ├── src/app/
│   │   ├── page.tsx                  # Onboarding + lesson creation
│   │   ├── classroom/page.tsx        # Teaching step + answer evaluation
│   │   ├── report/page.tsx           # Learning report dashboard
│   │   └── globals.css
│   └── src/lib/
│       ├── api.ts                    # Frontend API integration helpers
│       └── types.ts                  # Shared TypeScript types
│
└── backend/ (FastAPI + Python + RAG + Neural TTS)
    ├── app/
    │   ├── api/
    │   │   ├── classroom.py          # Teaching turns, Socratic evaluation, doubts
    │   │   ├── documents.py          # PDF / notes upload & RAG indexing
    │   │   ├── lesson_plan.py        # Adaptive syllabus generator
    │   │   ├── voice.py              # Edge-TTS audio + OpenAI Whisper STT fallback
    │   │   ├── assessment.py         # Quiz & learning report generation
    │   │   └── health.py             # Service health & provider detection
    │   ├── core/
    │   │   └── config.py             # Application configuration & CORS
    │   ├── services/
    │   │   ├── pedagogical_agent.py  # Socratic AI teacher engine
    │   │   ├── rag_engine.py         # Document parser, chunker & hybrid retrieval
    │   │   ├── llm_service.py        # Multi-provider LLM (Gemini, OpenAI, Fallbacks)
    │   │   └── tts_engine.py         # Multilingual neural speech synthesis
    │   └── main.py                   # FastAPI entrypoint
    ├── test_integration.py           # 7-step automated test suite
    └── requirements.txt
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js 18+

### One-Command Start
```bash
./start.sh
```
This boots both the FastAPI backend (port `8005`) and the Next.js frontend (port `3000`).

---

### Manual Startup

#### 1. Start Backend (Port 8005)
```bash
./run_backend.sh
```
*Backend API docs available at `http://localhost:8005/docs`.*

#### 2. Start Frontend (Port 3000)
```bash
./run_frontend.sh
```
*Classroom interface available at `http://localhost:3000`.*

---

## 🧪 Automated Testing

Run the complete 7-step end-to-end integration test suite:
```bash
python backend/test_integration.py
```

**Verification Steps Covered:**
1. Health check & provider detection.
2. PDF / Document parsing and semantic chunking.
3. Personalized lesson plan generation.
4. Spoken lecture turn execution, LaTeX/Mermaid visuals, and audio generation.
5. Socratic misconception diagnosis and remedial trigger.
6. Progressive difficulty final mastery quiz generation.
7. Comprehensive learning report and Day 1/3/7 spaced repetition plan generation.

---

## 📜 License
MIT License • Built for the Round 2 Technical Assessment.
