'use client';

import React from 'react';
import { LessonModule, LessonStep } from '@/lib/types';
import { CheckCircle2, Circle, Play, Clock, Sparkles, Award } from 'lucide-react';

interface LessonTimelineProps {
  modules: LessonModule[];
  currentStepId: number;
  onSelectStep: (stepId: number) => void;
  onStartQuiz: () => void;
}

export const LessonTimeline: React.FC<LessonTimelineProps> = ({
  modules,
  currentStepId,
  onSelectStep,
  onStartQuiz,
}) => {
  const allSteps = modules.flatMap((m) => m.steps);
  const completedCount = allSteps.filter((s) => s.is_completed).length;
  const progressPct = allSteps.length > 0 ? Math.round((completedCount / allSteps.length) * 100) : 0;

  return (
    <div className="flex flex-col h-full rounded-2xl glass-panel border border-white/10 shadow-2xl p-5 overflow-hidden">
      {/* Header & Progress Bar */}
      <div className="pb-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            Curriculum Roadmap
          </h3>
          <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
            {progressPct}% Mastered
          </span>
        </div>

        {/* Progress Track */}
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Modules & Steps Tree */}
      <div className="flex-1 overflow-y-auto py-3 flex flex-col gap-4">
        {modules.map((mod, modIdx) => (
          <div key={mod.module_id} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[9px]">
                {modIdx + 1}
              </span>
              <span>{mod.title}</span>
            </div>

            <div className="flex flex-col gap-1 pl-2 border-l border-white/10 ml-2">
              {mod.steps.map((step) => {
                const isActive = step.step_id === currentStepId;
                const isDone = step.is_completed;

                return (
                  <button
                    key={step.step_id}
                    onClick={() => onSelectStep(step.step_id)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl text-left transition-all ${
                      isActive
                        ? 'bg-blue-600/30 border border-blue-500/50 shadow-md shadow-blue-500/10'
                        : 'hover:bg-slate-800/60 border border-transparent'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : isActive ? (
                        <Play className="w-4 h-4 text-blue-400 fill-blue-400 animate-pulse" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-500" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${isActive ? 'text-white' : isDone ? 'text-slate-300' : 'text-slate-400'}`}>
                        {step.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {Math.round(step.estimated_duration_seconds / 60)}m
                        </span>
                        <span>•</span>
                        <span className="capitalize">{step.step_type.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Final Mastery Assessment Trigger */}
      <div className="pt-3 border-t border-white/10">
        <button
          onClick={onStartQuiz}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all"
        >
          <Award className="w-4 h-4" />
          <span>Take Final Mastery Assessment</span>
        </button>
      </div>
    </div>
  );
};
