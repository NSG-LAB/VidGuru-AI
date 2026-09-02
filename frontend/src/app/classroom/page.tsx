import { Suspense } from "react";
import ClassroomClient from "./ClassroomClient";

export default function ClassroomPage() {
  return (
    <Suspense fallback={<main className="p-6">Loading classroom...</main>}>
      <ClassroomClient />
    </Suspense>
  );
}
