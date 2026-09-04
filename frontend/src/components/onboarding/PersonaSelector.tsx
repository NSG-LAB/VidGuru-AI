'use client';

import React, { useState } from 'react';
import { StudentProfile } from '@/lib/types';
import {
  GraduationCap,
  Languages,
  Target,
  Clock,
  User,
  Sparkles,
  ArrowRight,
  Check
} from 'lucide-react';

interface PersonaSelectorProps {
  initialProfile?: StudentProfile;
  topic: string;
  onLaunchLesson: (profile: StudentProfile) => void;
  isLoading: boolean;
}

const GRADE_LEVELS = [
  { id: 'middle_school', label: 'Middle School (EL5)', desc: 'Intuitive storytelling, simple everyday terms' },
  { id: 'high_school', label: 'High School', desc: 'Core curriculum foundation and fundamental formulas' },
  { id: 'undergraduate', label: 'Undergraduate', desc: 'Rigorous derivation, mathematical formulation, and depth' },
  { id: 'advanced_research', label: 'Advanced / Pro', desc: 'First principles, edge cases, and architectural trade-offs' },
];

const LANGUAGES = [
  { id: 'English', label: 'English', desc: 'Global technical standard' },
  { id: 'Hinglish', label: 'Hinglish (Hindi + English)', desc: 'Natural conversational code-switching' },
  { id: 'Hindi', label: 'हिन्दी (Hindi)', desc: 'Pure Hindi explanations' },
  { id: 'Spanish', label: 'Español', desc: 'Spanish language masterclass' },
];

const GOALS = [
  { id: 'deep_conceptual', label: 'Deep Conceptual Mastery', desc: 'Focus on first principles intuition and why things work' },
  { id: 'exam_cram', label: 'Exam Prep & Problem Solving', desc: 'Focus on formula derivations, traps, and exam problems' },
  { id: 'quick_revision', label: 'Quick Revision (High-Yield)', desc: 'Rapid refresh of critical mental models' },
  { id: 'practical_coding', label: 'Code & Practical Hands-on', desc: 'Implementation walkthroughs and real code syntax' },
];

const TIME_BUDGETS = [
  { mins: 5, label: '5 Mins', desc: 'Micro-Lesson (2 quick steps)' },
  { mins: 15, label: '15 Mins', desc: 'Standard Masterclass (4-6 steps)' },
  { mins: 30, label: '30 Mins', desc: 'Comprehensive Deep Dive (8-10 steps)' },
];

const TEACHERS = [
  {
    id: 'Dr. Nova (Intuitive & Warm)',
    name: 'Dr. Nova',
    role: 'Intuitive & Concept-First',
    desc: 'Uses brilliant analogies and gentle scaffolding to make complex ideas click.',
    color: 'border-blue-500/40 bg-blue-950/20 text-blue-300',
  },
  {
    id: 'Prof. Aryan (Deep & Socratic)',
    name: 'Prof. Aryan',
    role: 'First-Principles & Socratic',
    desc: 'Challenges you with thought experiments and builds understanding from scratch.',
    color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300',
  },
  {
    id: 'Maya (Energetic & Visual)',
    name: 'Maya',
    role: 'Visual Storyteller',
    desc: 'Brings concepts to life with vivid diagrams, animations, and mental pictures.',
    color: 'border-purple-500/40 bg-purple-950/20 text-purple-300',
  },
  {
    id: 'Alex (Code & Engineering)',
    name: 'Alex',
    role: 'Systems & Code Architect',
    desc: 'Focuses on implementation, live code walkthroughs, and practical execution.',
    color: 'border-amber-500/40 bg-amber-950/20 text-amber-300',
  },
];

export const PersonaSelector: React.FC<PersonaSelectorProps> = ({
  topic,
  onLaunchLesson,
  isLoading,
}) => {
  const [gradeLevel, setGradeLevel] = useState('undergraduate');
  const [language, setLanguage] = useState('English');
  const [goal, setGoal] = useState('deep_conceptual');
  const [timeBudget, setTimeBudget] = useState(15);
  const [teacher, setTeacher] = useState('Dr. Nova (Intuitive & Warm)');

  const handleStart = () => {
    onLaunchLesson({
      grade_level: gradeLevel,
      language: language,
      learning_goal: goal,
      time_budget_mins: timeBudget,
      learning_style: 'visual_analogies',
      teacher_persona: teacher,
    });
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="text-center">
        <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
          Personalize Your Classroom
        </span>
        <h2 className="text-2xl font-black text-white mt-2">
          How should VidGuru AI teach <span className="text-cyan-300">"{topic}"</span>?
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Your AI teacher adapts cognitive load, tone, language, and pacing to your exact needs.
        </p>
      </div>

      {/* 1. Teacher Persona Selection */}
      <div className="flex flex-col gap-2.5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <User className="w-4 h-4 text-cyan-400" />
          Choose Your AI Educator
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TEACHERS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTeacher(t.id)}
              className={`p-4 rounded-2xl border text-left transition-all ${
                teacher === t.id
                  ? 'border-blue-500 bg-blue-600/25 shadow-lg shadow-blue-500/20'
                  : 'border-white/10 bg-slate-900/60 hover:bg-slate-800/80 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-bold text-white">{t.name}</h4>
                <span className="text-[10px] font-semibold text-slate-400">{t.role}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Target Level & Language in 2-Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Grade Level */}
        <div className="flex flex-col gap-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-emerald-400" />
            Target Learning Level
          </label>
          <div className="flex flex-col gap-2">
            {GRADE_LEVELS.map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => setGradeLevel(lvl.id)}
                className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                  gradeLevel === lvl.id
                    ? 'border-emerald-500 bg-emerald-950/40 text-white'
                    : 'border-white/10 bg-slate-900/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div>
                  <h5 className="text-xs font-bold">{lvl.label}</h5>
                  <p className="text-[11px] text-slate-400">{lvl.desc}</p>
                </div>
                {gradeLevel === lvl.id && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Preferred Language */}
        <div className="flex flex-col gap-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Languages className="w-4 h-4 text-purple-400" />
            Language & Accent
          </label>
          <div className="flex flex-col gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                onClick={() => setLanguage(lang.id)}
                className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                  language === lang.id
                    ? 'border-purple-500 bg-purple-950/40 text-white'
                    : 'border-white/10 bg-slate-900/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div>
                  <h5 className="text-xs font-bold">{lang.label}</h5>
                  <p className="text-[11px] text-slate-400">{lang.desc}</p>
                </div>
                {language === lang.id && <Check className="w-4 h-4 text-purple-400 shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Learning Goal & Time Budget */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Learning Goal */}
        <div className="flex flex-col gap-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-400" />
            Primary Learning Goal
          </label>
          <div className="flex flex-col gap-2">
            {GOALS.map((g) => (
              <button
                key={g.id}
                onClick={() => setGoal(g.id)}
                className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                  goal === g.id
                    ? 'border-amber-500 bg-amber-950/40 text-white'
                    : 'border-white/10 bg-slate-900/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div>
                  <h5 className="text-xs font-bold">{g.label}</h5>
                  <p className="text-[11px] text-slate-400">{g.desc}</p>
                </div>
                {goal === g.id && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Time Budget */}
        <div className="flex flex-col gap-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            Available Time Budget
          </label>
          <div className="flex flex-col gap-2">
            {TIME_BUDGETS.map((t) => (
              <button
                key={t.mins}
                onClick={() => setTimeBudget(t.mins)}
                className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                  timeBudget === t.mins
                    ? 'border-cyan-500 bg-cyan-950/40 text-white'
                    : 'border-white/10 bg-slate-900/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div>
                  <h5 className="text-xs font-bold">{t.label}</h5>
                  <p className="text-[11px] text-slate-400">{t.desc}</p>
                </div>
                {timeBudget === t.mins && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Launch Action Button */}
      <div className="pt-2">
        <button
          onClick={handleStart}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-base font-bold shadow-2xl shadow-blue-500/30 transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
              <span>Architecting Personalized Video Masterclass...</span>
            </div>
          ) : (
            <>
              <span>Launch 1-on-1 AI Classroom</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
