"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  evaluateAnswer,
  fetchTeachingStep,
  generateQuiz,
  submitQuiz,
} from "@/lib/api";

export default function ClassroomClient() {
  const params = useSearchParams();
  const router = useRouter();
  const planId = params.get("plan_id") ?? "";
  const stepId = Number(params.get("step_id") ?? "1");
  const [stepTitle, setStepTitle] = useState("");
  const [teacherScript, setTeacherScript] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!planId) return;
    fetchTeachingStep(planId, stepId)
      .then((step) => {
        setStepTitle(step.title);
        setTeacherScript(step.teacher_script ?? "");
        setQuestion(step.formative_question?.prompt ?? "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load step"))
      .finally(() => setLoading(false));
  }, [planId, stepId]);

  const canSubmit = useMemo(() => planId && question && answer.trim(), [planId, question, answer]);

  const onEvaluate = async () => {
    if (!canSubmit) return;
    setError("");
    try {
      const result = await evaluateAnswer({
        plan_id: planId,
        step_id: stepId,
        question_prompt: question,
        student_response: answer,
      });
      setFeedback(result.socratic_feedback);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to evaluate answer");
    }
  };

  const onFinishQuiz = async () => {
    if (!planId) return;
    setError("");
    try {
      const quiz = await generateQuiz(planId);
      const answers = Object.fromEntries(quiz.questions.map((q) => [q.id, 0]));
      await submitQuiz({
        plan_id: planId,
        quiz_id: quiz.quiz_id,
        answers,
        time_spent_seconds: 120,
      });
      router.push(`/report?plan_id=${planId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit quiz");
    }
  };

  if (!planId) {
    return <main className="p-6">Missing plan_id. Start from the home page.</main>;
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold">Classroom</h1>
      {loading ? <p className="mt-4 text-sm">Loading step...</p> : null}
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      {!loading && !error ? (
        <section className="mt-6 space-y-4 rounded-xl border p-5">
          <h2 className="text-xl font-semibold">{stepTitle}</h2>
          <p className="whitespace-pre-wrap text-sm leading-6">{teacherScript}</p>
          <div className="rounded-md bg-zinc-100 p-3 text-sm dark:bg-zinc-900">
            <p className="font-medium">Checkpoint Question</p>
            <p className="mt-1">{question}</p>
          </div>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={4}
            className="w-full rounded border px-3 py-2"
            placeholder="Type your answer..."
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onEvaluate}
              className="rounded bg-black px-4 py-2 text-white"
            >
              Evaluate Answer
            </button>
            <button
              type="button"
              onClick={onFinishQuiz}
              className="rounded border px-4 py-2"
            >
              Finish & Generate Report
            </button>
          </div>
          {feedback ? (
            <div className="rounded-md border p-3 text-sm">
              <p className="font-medium">Teacher Feedback</p>
              <p className="mt-1">{feedback}</p>
            </div>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
