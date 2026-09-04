'use client';

import React, { useState } from 'react';
import { AdaptiveRemediation, FormativeQuestion } from '@/lib/types';
import {
  AlertCircle,
  Lightbulb,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Compass
} from 'lucide-react';

interface RemediationAlertProps {
  evaluationFeedback: string;
  remediation: AdaptiveRemediation;
  onAnswerFollowUp: (answer: string) => void;
  onDismiss: () => void;
}

export const RemediationAlert: React.FC<RemediationAlertProps> = ({
  evaluationFeedback,
  remediation,
  onAnswerFollowUp,
  onDismiss,
}) => {
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [typedFollowUp, setTypedFollowUp] = useState('');

  const submitFollowUp = () => {
    const ans = selectedOpt || typedFollowUp;
    if (!ans.trim()) return;
    onAnswerFollowUp(ans);
  };

  return (
    <div className="rounded-2xl glass-panel border border-amber-500/40 bg-gradient-to-b from-amber-950/40 via-slate-900/90 to-slate-950/95 p-6 shadow-2xl flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-300">
      {/* Header Banner */}
      <div className="flex items-start justify-between pb-4 border-b border-amber-500/20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Pedagogical Adaptation Triggered
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-0.5">
              Misconception Diagnosed: <span className="text-amber-300">{remediation.misconception_diagnosed}</span>
            </h3>
          </div>
        </div>
      </div>

      {/* Socratic Feedback from Teacher */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 text-sm text-slate-200 leading-relaxed italic">
        "{evaluationFeedback}"
      </div>

      {/* Why it happens & Remedial Analogy Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Why it happens */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>Underlying Cognitive Intuition</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {remediation.why_it_happens || "It is common to confuse these adjacent principles when first learning this topic."}
          </p>
        </div>

        {/* Remedial Analogy */}
        <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
            <Lightbulb className="w-4 h-4 text-cyan-400" />
            <span>Targeted Real-World Analogy</span>
          </div>
          <p className="text-xs text-cyan-100 leading-relaxed font-medium">
            {remediation.remedial_analogy}
          </p>
        </div>
      </div>

      {/* Scaffolded Step-Down Explanation */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-white/10 text-xs text-slate-200 leading-relaxed">
        <h5 className="font-bold text-white mb-1.5 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-blue-400" />
          Scaffolded Clarification
        </h5>
        <p>{remediation.scaffolded_explanation}</p>
      </div>

      {/* Follow-Up Step-Down Verification Challenge */}
      {remediation.follow_up_question && (
        <div className="p-5 rounded-xl bg-blue-950/30 border border-blue-500/30 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-300 uppercase tracking-wider">
            <HelpCircle className="w-4 h-4" />
            <span>Let's Re-verify: Quick Scaffold Challenge</span>
          </div>
          <p className="text-sm font-semibold text-white">
            {remediation.follow_up_question.prompt}
          </p>

          {remediation.follow_up_question.options && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              {remediation.follow_up_question.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedOpt(opt)}
                  className={`text-left p-3 rounded-lg text-xs font-medium border transition-all ${
                    selectedOpt === opt
                      ? 'bg-blue-600 border-blue-400 text-white'
                      : 'bg-slate-900 border-white/10 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {!remediation.follow_up_question.options && (
            <input
              type="text"
              value={typedFollowUp}
              onChange={(e) => setTypedFollowUp(e.target.value)}
              placeholder="Type your quick answer..."
              className="glass-input px-3 py-2 rounded-lg text-xs text-white focus:outline-none"
            />
          )}

          <div className="flex items-center justify-end gap-3 mt-2">
            <button
              onClick={onDismiss}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
            >
              I Understand Now, Proceed
            </button>
            <button
              onClick={submitFollowUp}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all"
            >
              <span>Verify Understanding</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
