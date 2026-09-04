'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { LearningReport } from '@/lib/types';
import { getLearningReport } from '@/lib/api';
import { LearningReportView } from '@/components/assessment/LearningReportView';
import { Sparkles } from 'lucide-react';

function ReportContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planId = searchParams.get('plan_id');

  const [report, setReport] = useState<LearningReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (planId) {
      getLearningReport(planId)
        .then((res) => {
          setReport(res);
        })
        .catch((err) => {
          console.error('Failed to load report:', err);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [planId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4 animate-spin">
          <Sparkles className="w-5 h-5" />
        </div>
        <h3 className="text-base font-bold text-white mb-1">Compiling Mastery Analytics...</h3>
        <p className="text-xs text-slate-400">Generating spaced repetition schedule and lecture notes</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-[#080c14] text-white flex flex-col items-center justify-center p-6 text-center">
        <h3 className="text-lg font-bold text-white mb-2">No Report Found</h3>
        <p className="text-xs text-slate-400 mb-4">Please complete a masterclass to generate your learning report.</p>
        <button
          onClick={() => router.push('/')}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
        >
          Return to Teacher Hub
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14] text-white py-8 px-4">
      <LearningReportView
        report={report}
        onRestartOrNewTopic={() => router.push('/')}
      />
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080c14] text-white flex items-center justify-center">Loading Report...</div>}>
      <ReportContent />
    </Suspense>
  );
}
