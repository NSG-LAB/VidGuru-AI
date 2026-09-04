'use client';

import React, { useState } from 'react';
import { LearningReport } from '@/lib/types';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Download,
  BookOpen,
  ArrowRight,
  Sparkles,
  TrendingUp,
  RotateCcw,
  Copy,
  Check
} from 'lucide-react';

interface LearningReportViewProps {
  report: LearningReport;
  onRestartOrNewTopic: () => void;
}

export const LearningReportView: React.FC<LearningReportViewProps> = ({
  report,
  onRestartOrNewTopic,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'analytics' | 'notes'>('analytics');

  const downloadNotes = () => {
    const blob = new Blob([report.downloadable_notes_md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.topic.replace(/\s+/g, '_')}_Masterclass_Notes.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyNotes = () => {
    navigator.clipboard.writeText(report.downloadable_notes_md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getBadgeStyle = () => {
    switch (report.mastery_level) {
      case 'Master':
        return 'from-purple-500 to-indigo-600 border-purple-400 text-purple-200';
      case 'Proficient':
        return 'from-emerald-500 to-teal-600 border-emerald-400 text-emerald-200';
      case 'Developing':
        return 'from-blue-500 to-cyan-600 border-blue-400 text-blue-200';
      default:
        return 'from-amber-500 to-orange-600 border-amber-400 text-amber-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 p-4">
      {/* Top Banner Card */}
      <div className="rounded-3xl glass-panel border border-white/10 p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/25">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Pedagogical Mastery Analytics
                </span>
                <span className="text-xs text-slate-400">{report.student_profile.teacher_persona}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white">{report.topic}</h1>
              <p className="text-xs md:text-sm text-slate-300 mt-1">{report.key_takeaways_summary}</p>
            </div>
          </div>

          {/* Mastery Badge */}
          <div className={`p-4 rounded-2xl bg-gradient-to-tr ${getBadgeStyle()} border shadow-xl flex flex-col items-center justify-center min-w-[140px] text-center`}>
            <span className="text-3xl font-black text-white">{Math.round(report.overall_score_pct)}%</span>
            <span className="text-xs font-bold uppercase tracking-wider text-white/90 mt-0.5">
              {report.mastery_level}
            </span>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/10">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Mastery & Misconception Matrix</span>
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'notes'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Structured Lecture Notes</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'analytics' ? (
        <div className="flex flex-col gap-6">
          {/* Misconception Diagnostic & Resolution Matrix */}
          <div className="rounded-3xl glass-panel border border-white/10 p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Cognitive Misconceptions Log</h3>
                  <p className="text-xs text-slate-400">Targeted misconceptions identified & resolved during Socratic cycles</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">
                {report.misconceptions_log.length} Diagnosed
              </span>
            </div>

            {report.misconceptions_log.length === 0 ? (
              <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-200 text-center flex items-center justify-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-medium">Exceptional intuition! No critical misconceptions detected during this lesson.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {report.misconceptions_log.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-amber-400 mt-2 shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white">{m.misconception}</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {m.concept}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          <span className="font-semibold text-cyan-300">Remedy Applied:</span> {m.remedy_applied}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Resolved in Class</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Strengths & Growth Areas Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="rounded-3xl glass-panel border border-white/10 p-6 shadow-xl flex flex-col gap-3">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>Demonstrated Strengths</span>
              </div>
              <ul className="flex flex-col gap-2">
                {report.strengths.map((s, idx) => (
                  <li key={idx} className="text-xs text-slate-200 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Growth Areas */}
            <div className="rounded-3xl glass-panel border border-white/10 p-6 shadow-xl flex flex-col gap-3">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Recommended Growth Next Steps</span>
              </div>
              <ul className="flex flex-col gap-2">
                {report.areas_for_growth.map((g, idx) => (
                  <li key={idx} className="text-xs text-slate-200 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Spaced Repetition Retention Plan */}
          <div className="rounded-3xl glass-panel border border-white/10 p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-white/10">
              <Calendar className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Spaced Repetition Retention Plan</h3>
                <p className="text-xs text-slate-400">Ebbinghaus forgetting curve protection schedule</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {report.spaced_repetition_plan.map((plan, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 flex flex-col gap-2">
                  <span className="text-xs font-bold text-purple-300">{plan.day}</span>
                  <p className="text-xs text-slate-300 leading-relaxed">{plan.action}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Markdown Notes Tab */
        <div className="rounded-3xl glass-panel border border-white/10 p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-bold text-white">Consolidated Study Notes</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copyNotes}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Markdown'}</span>
              </button>
              <button
                onClick={downloadNotes}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Notes (.md)</span>
              </button>
            </div>
          </div>

          <pre className="p-6 rounded-2xl bg-slate-950 border border-white/5 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed whitespace-pre-wrap">
            {report.downloadable_notes_md}
          </pre>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={onRestartOrNewTopic}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-white/10"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Teach Another Topic or Re-learn</span>
        </button>

        <button
          onClick={downloadNotes}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Export Masterclass Package</span>
        </button>
      </div>
    </div>
  );
};
