import { Suspense } from "react";
import ReportClient from "./ReportClient";

export default function ReportPage() {
  return (
    <Suspense fallback={<main className="p-6">Loading report...</main>}>
      <ReportClient />
    </Suspense>
  );
}
