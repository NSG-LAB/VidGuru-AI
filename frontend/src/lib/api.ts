import {
  StudentProfile,
  LessonPlan,
  LessonStep,
  PedagogicalEvaluation,
  FinalQuiz,
  LearningReport,
  DocumentUploadResponse
} from './types';

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8005/api/v1';
export const BACKEND_BASE = API_BASE.replace('/api/v1', '');

export function getAudioFullUrl(audioPath?: string | null): string {
  if (!audioPath) return '';
  if (audioPath.startsWith('http://') || audioPath.startsWith('https://')) return audioPath;
  return `${BACKEND_BASE}${audioPath}`;
}

export async function uploadDocument(file: File): Promise<DocumentUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to upload document' }));
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
}

export async function createLessonPlan(params: {
  topic: string;
  student_profile: StudentProfile;
  doc_id?: string;
  raw_notes?: string;
}): Promise<LessonPlan> {
  const res = await fetch(`${API_BASE}/lesson-plan/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to create lesson plan' }));
    throw new Error(err.detail || 'Lesson plan generation failed');
  }
  return res.json();
}

export async function getLessonPlan(plan_id: string): Promise<LessonPlan> {
  const res = await fetch(`${API_BASE}/lesson-plan/${plan_id}`);
  if (!res.ok) throw new Error('Lesson plan not found');
  return res.json();
}

export async function executeTeachingStep(params: {
  plan_id: string;
  step_id: number;
  doc_id?: string;
}): Promise<LessonStep> {
  const res = await fetch(`${API_BASE}/classroom/step`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to execute teaching step' }));
    throw new Error(err.detail || 'Step execution failed');
  }
  return res.json();
}

export async function evaluateStudentAnswer(params: {
  plan_id: string;
  step_id: number;
  question_prompt: string;
  student_response: string;
  is_audio?: boolean;
}): Promise<PedagogicalEvaluation> {
  const res = await fetch(`${API_BASE}/classroom/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Evaluation failed' }));
    throw new Error(err.detail || 'Evaluation failed');
  }
  return res.json();
}

export async function askLiveDoubt(params: {
  plan_id: string;
  step_id: number;
  student_question: string;
}): Promise<{ teacher_answer: string; persona: string }> {
  const res = await fetch(`${API_BASE}/classroom/doubt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) throw new Error('Failed to get answer for doubt');
  return res.json();
}

export async function generateFinalQuiz(plan_id: string): Promise<FinalQuiz> {
  const res = await fetch(`${API_BASE}/assessment/quiz/${plan_id}`, {
    method: 'POST',
  });

  if (!res.ok) throw new Error('Failed to generate quiz');
  return res.json();
}

export async function submitQuizAndGetReport(params: {
  plan_id: string;
  quiz_id: string;
  answers: Record<string, number>;
  time_spent_seconds: number;
}): Promise<LearningReport> {
  const res = await fetch(`${API_BASE}/assessment/submit-quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) throw new Error('Failed to evaluate quiz and generate report');
  return res.json();
}

export async function getLearningReport(plan_id: string): Promise<LearningReport> {
  const res = await fetch(`${API_BASE}/assessment/report/${plan_id}`);
  if (!res.ok) throw new Error('Failed to fetch learning report');
  return res.json();
}
