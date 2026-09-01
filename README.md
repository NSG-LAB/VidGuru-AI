# 🎓 VidGuru AI — Human-Like AI Educator That Teaches Through Video

> **VidGuru AI** is an intelligent, human-like AI educator that transforms textbooks, PDFs, lecture notes, research papers, or any topic into a personalized, adaptive, interactive video-based classroom experience.

Unlike static chatbots that merely answer questions, **VidGuru AI behaves like a world-class 1-on-1 teacher**: it breaks concepts down step-by-step from first principles, dynamically illustrates ideas with synchronized blackboard visuals (LaTeX equations, Mermaid architecture diagrams, live code snippets, and real-world analogies), asks thought-provoking formative checkpoint questions, diagnoses cognitive misconceptions, adapts explanations in real-time with tailored remedial analogies, and provides a comprehensive learning report with a spaced repetition retention schedule.

---

## 🌟 Key Features

1. **Pedagogical AI Teacher (Not Just a Chatbot)**:
   - Follows cognitive science principles (Bloom's Taxonomy & Socratic Inquiry).
   - Explains one cohesive mental model at a time with progressive cognitive load.
   - Diagnoses exact misconceptions (e.g. confusing velocity with acceleration, reference vs value types, correlation vs causation).
   - Automatically pivots with tailored real-world analogies and scaffolding before progressing.

2. **Interactive Video & AI Avatar Classroom**:
   - Animated AI Teacher Avatar with dynamic speaking lip-sync waveforms and personality presets (Dr. Nova, Prof. Aryan, Maya, Alex).
   - Synchronized dynamic blackboard with real-time LaTeX math formula rendering, Mermaid diagrams, and code snippets.
   - High-fidelity neural voice synthesis with multilingual speech support.

3. **Multilingual & Code-Switching Support**:
   - Supports **English, Hindi (हिन्दी), Hinglish (conversational mix of Hindi and English), and Spanish**.
   - Natural pedagogical code-switching suitable for Indian and global classrooms.

4. **Personalized Learner Profiles**:
   - **Grade Levels**: Middle School (EL5), High School, Undergraduate, Advanced / Pro.
   - **Learning Goals**: Deep Conceptual Understanding, Exam Cram & Derivations, Quick Revision, Practical Coding.
   - **Time Budgets**: 5 min Micro-lesson, 15 min Standard Masterclass, 30 min Deep Dive.

5. **Document Ingestion & RAG (Retrieval-Augmented Generation)**:
   - Drag-and-drop ingestion of PDFs, lecture slides, research papers, and notes.
   - Hierarchical semantic chunking and BM25/hybrid retrieval.

6. **Summative Assessment & Spaced Repetition Retention**:
   - Adaptive final mastery quiz with instant Socratic reasoning feedback.
   - Comprehensive Learning Report: Mastery Level (Novice -> Master), Cognitive Misconception Resolution Matrix, Strengths & Growth Areas, Spaced Repetition Schedule (Day 1, Day 3, Day 7), and Downloadable Study Notes in Markdown.

---

## 🏗️ Architecture & Technology Stack

```
VidGuru AI Architecture
├── Frontend (Next.js 14 + Tailwind CSS + Lucide + KaTeX + Mermaid)
│   ├── Interactive AI Teacher Avatar & Audio Waveform Player
│   ├── Synchronized Dynamic Blackboard (LaTeX, Mermaid, Code, Analogy Cards)
│   ├── Socratic Interaction Console (Voice STT / Text / Live Doubts)
│   ├── Adaptive Misconception Remediation Banner
│   └── Summative Quiz Engine & Learning Analytics Dashboard
│
└── Backend (FastAPI + Python + RAG + Neural TTS)
    ├── RAG Engine (PDF Extraction, Semantic Chunking, Hybrid Retrieval)
    ├── Pedagogical Teaching State Machine & Socratic Agent
    ├── Cognitive Misconception Diagnosis Engine
    ├── Multilingual Neural Voice Engine (Edge-TTS)
    └── Assessment & Spaced Repetition Generator
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Start Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# (Optional) Add your Gemini or OpenAI API Key in .env
cp .env.example .env

# Run FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Backend API docs available at `http://localhost:8000/docs`.*

### 2. Start Frontend
```bash
cd frontend
npm install
npm run dev
```
*Classroom interface available at `http://localhost:3000`.*

---

## 🧪 Pedagogical Cycle Walkthrough

1. **Material Ingestion**: Upload a textbook PDF or choose a topic (e.g. *Transformer Architecture*, *Quantum Superposition*, *CRISPR-Cas9*).
2. **Persona Customization**: Select Undergraduate level, Hinglish, 15 min masterclass, and Dr. Nova persona.
3. **Step 1 Teaching**: Teacher introduces the mental model with spoken neural voice and renders a dynamic Mermaid diagram.
4. **Formative Checkpoint**: Student submits answer via Voice (STT) or Text.
5. **Adaptive Pivot**: If the student has a misconception, the AI teacher flags the exact cognitive trap, gives a fresh real-world analogy, and presents a scaffolding check.
6. **Mastery Quiz**: Final 5-question assessment testing depth and edge cases.
7. **Learning Report**: Review resolved misconceptions, spaced repetition plan, and download full masterclass notes.
