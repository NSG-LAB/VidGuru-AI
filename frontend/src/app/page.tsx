"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createLessonPlan, uploadDocument } from "@/lib/api";

const defaultProfile = {
  grade_level: "undergraduate",
  language: "English",
  learning_goal: "deep_conceptual",
  time_budget_mins: 15,
  learning_style: "visual_analogies",
  teacher_persona: "Dr. Nova (Intuitive & Warm)",
};

export default function Home() {
  const router = useRouter();
  const [topic, setTopic] = useState("Self-Attention Mechanism in Transformers");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      let docId: string | undefined;
      if (file) {
        const uploaded = await uploadDocument(file);
        docId = uploaded.doc_id;
      }
      const plan = await createLessonPlan({
        topic,
        student_profile: defaultProfile,
        doc_id: docId,
        raw_notes: notes || undefined,
      });
      router.push(`/classroom?plan_id=${plan.plan_id}&step_id=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create lesson");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-bold">VidGuru AI</h1>
      <p className="mt-2 text-sm opacity-80">
        Upload learning material, generate a lesson plan, and open the classroom.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-xl border p-5">
        <div>
          <label className="mb-1 block text-sm font-medium">Topic</label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full rounded border px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Optional Notes Context
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Optional File</label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full"
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-60"
        >
          {loading ? "Creating..." : "Start Classroom"}
        </button>
      </form>
    </main>
  );
}
