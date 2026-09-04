'use client';

import React, { useState } from 'react';
import { FinalQuiz, QuizQuestion } from '@/lib/types';
import {
  Award,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  Clock,
  Check
} from 'lucide-react';

interface QuizEngineProps {
  quiz: FinalQuiz;
  onCompleteQuiz: (answers: Record<string, number>, timeSpentSeconds: number) => void;
  onExit: () => void;
}

export const QuizEngine: React.FC<QuizEngineProps> = ({
  quiz,
  onCompleteQuiz,
  onExit,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [startTime] = useState<number>(Date.now());

  const currentQ: QuizQuestion = quiz.questions[currentIdx] || quiz.questions[0];
  const isSelected = selectedAnswers[currentQ?.id] !== undefined;
  const isLastQuestion = currentIdx === quiz.questions.length - 1;

  const handleSelect = (optIndex: number) => {
    if (showExplanation) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optIndex,
    }));
    setShowExplanation(true);
  };

  const handleNext = () => {
    setShowExplanation(false);
    if (isLastQuestion) {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      onCompleteQuiz(selectedAnswers, timeSpent);
    } else {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  return (
    <div className="max-w-3xl mx-auto rounded-3xl glass-panel border border-white/10 p-8 shadow-2xl flex flex-col gap-6">
      {/* Quiz Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Summative Mastery Assessment
              </span>
              <span className="text-xs text-slate-400">
                Question {currentIdx + 1} of {quiz.questions.length}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-0.5">{quiz.topic}</h2>
          </div>
        </div>

        <button
          onClick={onExit}
          className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800"
        >
          Exit Assessment
        </button>
      </div>

      {/* Progress Dots */}
      <div className="flex items-center gap-2">
        {quiz.questions.map((q, idx) => {
          const answered = selectedAnswers[q.id] !== undefined;
          const isCorrect = selectedAnswers[q.id] === q.correct_option_index;
          return (
            <div
              key={q.id}
              className={`flex-1 h-2 rounded-full transition-all ${
                idx === currentIdx
                  ? 'bg-blue-500 shadow-md shadow-blue-500/50'
                  : answered
                  ? isCorrect
                    ? 'bg-emerald-500'
                    : 'bg-red-500'
                  : 'bg-slate-800'
              }`}
            />
          );
        })}
      </div>

      {/* Question Card */}
      <div className="flex flex-col gap-5 my-2">
        <div className="flex items-start justify-between gap-4">
          <p className="text-base md:text-lg font-semibold text-white leading-relaxed">
            {currentQ.question}
          </p>
          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded shrink-0 border ${
            currentQ.difficulty === 'hard'
              ? 'bg-red-500/20 text-red-300 border-red-500/30'
              : currentQ.difficulty === 'medium'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
          }`}>
            {currentQ.difficulty}
          </span>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-3">
          {currentQ.options.map((opt, optIdx) => {
            const isUserSelected = selectedAnswers[currentQ.id] === optIdx;
            const isCorrect = currentQ.correct_option_index === optIdx;

            let btnStyle = 'bg-slate-900/70 border-white/10 text-slate-200 hover:border-white/25 hover:bg-slate-800';

            if (showExplanation) {
              if (isCorrect) {
                btnStyle = 'bg-emerald-950/60 border-emerald-500 text-emerald-100 shadow-lg shadow-emerald-500/20';
              } else if (isUserSelected && !isCorrect) {
                btnStyle = 'bg-red-950/60 border-red-500 text-red-100 shadow-lg shadow-red-500/20';
              } else {
                btnStyle = 'bg-slate-950/40 border-white/5 text-slate-500 opacity-60';
              }
            } else if (isUserSelected) {
              btnStyle = 'bg-blue-600/40 border-blue-500 text-white';
            }

            return (
              <button
                key={optIdx}
                disabled={showExplanation}
                onClick={() => handleSelect(optIdx)}
                className={`flex items-center justify-between p-4 rounded-2xl border text-sm font-medium transition-all text-left ${btnStyle}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold border ${
                    showExplanation && isCorrect
                      ? 'bg-emerald-500 border-emerald-400 text-white'
                      : showExplanation && isUserSelected && !isCorrect
                      ? 'bg-red-500 border-red-400 text-white'
                      : 'border-slate-700 bg-slate-800/80 text-slate-300'
                  }`}>
                    {String.fromCharCode(65 + optIdx)}
                  </span>
                  <span>{opt}</span>
                </div>

                {showExplanation && isCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                )}
                {showExplanation && isUserSelected && !isCorrect && (
                  <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Instant Pedagogical Explanation Box */}
        {showExplanation && (
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-white/10 flex flex-col gap-2 animate-in fade-in duration-300">
            <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Socratic Analysis & Reasoning
            </h5>
            <p className="text-xs text-slate-300 leading-relaxed">
              {currentQ.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Footer / Navigation */}
      {showExplanation && (
        <div className="flex justify-end pt-2">
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-blue-500/25 transition-all"
          >
            <span>{isLastQuestion ? 'Complete Assessment & View Report' : 'Next Question'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
