"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fetchReport } from "@/lib/api";

export default function ReportClient() {
  const params = useSearchParams();
  const planId = params.get("plan_id") ?? "";
  const [report, setReport] = useState<{
    overall_score_pct: number;
    mastery_level: string;
    key_takeaways_summary: string;
    areas_for_growth: string[];
  } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!planId) return;
    fetchReport(planId)
      .then((r) => setReport(r))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load report"));
  }, [planId]);

  if (!planId) {
    return <main className="p-6">Missing plan_id. Open report from the classroom flow.</main>;
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold">Learning Report</h1>
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {!error && !report ? <p className="mt-4 text-sm">Loading report...</p> : null}
      {report ? (
        <section className="mt-6 space-y-3 rounded-xl border p-5">
          <p>
            <span className="font-semibold">Score:</span>{" "}
            {report.overall_score_pct.toFixed(1)}%
          </p>
          <p>
            <span className="font-semibold">Mastery:</span> {report.mastery_level}
          </p>
          <p>
            <span className="font-semibold">Summary:</span>{" "}
            {report.key_takeaways_summary}
          </p>
          <div>
            <p className="font-semibold">Areas for Growth</p>
            <ul className="list-disc pl-6">
              {report.areas_for_growth.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </main>
  );
}
