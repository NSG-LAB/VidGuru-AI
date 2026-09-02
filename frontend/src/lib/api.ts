import type { LessonPlan } from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8005/api/v1";

async function parseResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data as { detail?: string }).detail ?? "Request failed";
    throw new Error(message);
  }
  return data as T;
}

export async function uploadDocument(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: "POST",
    body: formData,
  });
  return parseResponse<{ doc_id: string; filename: string; num_chunks: number }>(res);
}

export async function createLessonPlan(payload: {
  topic: string;
  student_profile: {
    grade_level: string;
    language: string;
    learning_goal: string;
    time_budget_mins: number;
    learning_style: string;
    teacher_persona: string;
  };
  doc_id?: string;
  raw_notes?: string;
}) {
  const res = await fetch(`${API_BASE}/lesson-plan/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<LessonPlan>(res);
}

export async function fetchTeachingStep(planId: string, stepId: number) {
  const res = await fetch(`${API_BASE}/classroom/step`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan_id: planId, step_id: stepId }),
  });
  return parseResponse<{
    step_id: number;
    title: string;
    concept_summary: string;
    teacher_script?: string;
    audio_url?: string;
    formative_question?: { prompt: string } | null;
  }>(res);
}

export async function evaluateAnswer(payload: {
  plan_id: string;
  step_id: number;
  question_prompt: string;
  student_response: string;
}) {
  const res = await fetch(`${API_BASE}/classroom/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<{
    is_correct: boolean;
    socratic_feedback: string;
    next_action: string;
  }>(res);
}

export async function generateQuiz(planId: string) {
  const res = await fetch(`${API_BASE}/assessment/quiz/${planId}`, {
    method: "POST",
  });
  return parseResponse<{
    quiz_id: string;
    questions: Array<{ id: string; question: string; options: string[] }>;
  }>(res);
}

export async function submitQuiz(payload: {
  plan_id: string;
  quiz_id: string;
  answers: Record<string, number>;
  time_spent_seconds: number;
}) {
  const res = await fetch(`${API_BASE}/assessment/submit-quiz`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<{
    overall_score_pct: number;
    mastery_level: string;
  }>(res);
}

export async function fetchReport(planId: string) {
  const res = await fetch(`${API_BASE}/assessment/report/${planId}`);
  return parseResponse<{
    overall_score_pct: number;
    mastery_level: string;
    key_takeaways_summary: string;
    areas_for_growth: string[];
  }>(res);
}
