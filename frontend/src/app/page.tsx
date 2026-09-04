'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  GraduationCap,
  Play,
  ArrowRight,
  Video,
  Brain,
  FileText,
  Languages,
  HelpCircle,
  BarChart3,
  CheckCircle2,
  Mic,
  Zap,
  Star,
  ChevronDown,
  Upload,
  User,
  BookOpen,
  Award,
  ExternalLink,
} from 'lucide-react';
import { DocumentUploader } from '@/components/onboarding/DocumentUploader';
import { PersonaSelector } from '@/components/onboarding/PersonaSelector';
import { createLessonPlan } from '@/lib/api';
import { StudentProfile } from '@/lib/types';

// ─── Animated Counter Hook ───────────────────────────────────────────────────
function useCountUp(target: number, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

// ─── Features Data ────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Video,
    title: 'Video-Based AI Teacher',
    desc: 'Animated avatar with neural voice teaches step-by-step, synced with a live blackboard. Like a real 1-on-1 tutor.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    glow: 'shadow-blue-500/10',
  },
  {
    icon: Brain,
    title: 'Misconception Diagnosis',
    desc: 'Detects exactly where your understanding breaks down and pivots with a targeted analogy or worked example.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    glow: 'shadow-purple-500/10',
  },
  {
    icon: FileText,
    title: 'PDF & RAG Grounded',
    desc: 'Upload your own textbook chapter, lecture notes, or research paper. The AI teaches from your exact material.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    glow: 'shadow-emerald-500/10',
  },
  {
    icon: Languages,
    title: 'Multilingual / Hinglish',
    desc: 'Natural code-switching between English, Hindi, and Spanish with matched neural voice personas.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    glow: 'shadow-amber-500/10',
  },
  {
    icon: HelpCircle,
    title: 'Socratic Questioning',
    desc: 'Asks formative checkpoint questions mid-lesson. Voice or text answers. Evaluates and responds intelligently.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    glow: 'shadow-cyan-500/10',
  },
  {
    icon: BarChart3,
    title: 'Mastery Analytics',
    desc: 'Final adaptive quiz, misconception log, spaced repetition schedule, and downloadable lecture notes.',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20',
    glow: 'shadow-pink-500/10',
  },
];

// ─── How It Works Steps ────────────────────────────────────────────────────────
const PIPELINE = [
  {
    step: '01',
    icon: Upload,
    title: 'Upload or Choose Topic',
    desc: 'Drop in your PDF, paste notes, or pick from preset masterclasses like Transformers or CRISPR.',
    color: 'from-blue-600 to-indigo-600',
    accent: 'text-blue-400',
  },
  {
    step: '02',
    icon: User,
    title: 'Set Your Learner Profile',
    desc: 'Choose grade level, preferred language, learning goal, and available time. Fully personalized.',
    color: 'from-purple-600 to-pink-600',
    accent: 'text-purple-400',
  },
  {
    step: '03',
    icon: Video,
    title: 'Live Adaptive Classroom',
    desc: 'Your AI teacher explains with voice, blackboard visuals, LaTeX, diagrams, and Socratic questions.',
    color: 'from-emerald-600 to-teal-600',
    accent: 'text-emerald-400',
  },
  {
    step: '04',
    icon: Award,
    title: 'Quiz & Mastery Report',
    desc: 'Final adaptive assessment, misconception log, spaced repetition plan, and downloadable notes.',
    color: 'from-amber-600 to-orange-600',
    accent: 'text-amber-400',
  },
];

// ─── Stats Data ───────────────────────────────────────────────────────────────
const STATS = [
  { value: 6,  suffix: '+', label: 'Preset Masterclasses', icon: BookOpen },
  { value: 4,  suffix: '',  label: 'AI Teacher Personas',  icon: User },
  { value: 4,  suffix: '',  label: 'Languages Supported',  icon: Languages },
  { value: 12, suffix: '',  label: 'Core AI Features',     icon: Sparkles },
];

// ─── Classroom Preview Badges ─────────────────────────────────────────────────
const PREVIEW_BADGES = [
  { label: 'Neural Voice', color: 'bg-blue-500/80', pos: 'top-4 left-4' },
  { label: 'Live Whiteboard', color: 'bg-emerald-500/80', pos: 'top-4 right-4' },
  { label: 'Socratic AI', color: 'bg-purple-500/80', pos: 'bottom-4 left-4' },
  { label: 'Misconception Fix', color: 'bg-amber-500/80', pos: 'bottom-4 right-4' },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();
  const [onboardingStep, setOnboardingStep] = useState<'upload' | 'persona'>('upload');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string | undefined>(undefined);
  const [selectedRawNotes, setSelectedRawNotes] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const onboardingRef = useRef<HTMLDivElement>(null);

  // Intersection observer for stats counter
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const scrollToOnboarding = () => {
    onboardingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleTopicOrDocReady = (params: { topic: string; docId?: string; rawNotes?: string }) => {
    setSelectedTopic(params.topic);
    setSelectedDocId(params.docId);
    setSelectedRawNotes(params.rawNotes);
    setOnboardingStep('persona');
  };

  const handleLaunchLesson = async (profile: StudentProfile) => {
    setIsLoading(true);
    try {
      const plan = await createLessonPlan({
        topic: selectedTopic,
        student_profile: profile,
        doc_id: selectedDocId,
        raw_notes: selectedRawNotes,
      });
      sessionStorage.setItem('active_lesson_plan', JSON.stringify(plan));
      if (selectedDocId) sessionStorage.setItem('active_doc_id', selectedDocId);
      router.push(`/classroom?plan_id=${plan.plan_id}`);
    } catch (err) {
      console.error('Failed to create plan:', err);
      alert('Could not start lesson. Please verify backend is running at http://localhost:8005');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#080c14] text-white flex flex-col overflow-x-hidden">

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  NAVIGATION BAR                                                */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between border-b border-white/5"
        style={{ background: 'rgba(8,12,20,0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-white">
              VidGuru <span className="text-cyan-400">AI</span>
            </span>
            <p className="text-[9px] text-slate-500 font-medium tracking-wider uppercase -mt-0.5 hidden sm:block">
              Human-Like AI Educator
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>AI Engine Active</span>
          </div>
          <button
            onClick={scrollToOnboarding}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-500/25"
          >
            <Play className="w-3.5 h-3.5" />
            Start Learning
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  HERO SECTION                                                  */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-28 pb-16 text-center overflow-hidden">

        {/* Background ambient glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-radial from-blue-600/20 via-purple-600/10 to-transparent blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-600/8 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-600/8 blur-3xl" />
        </div>

        {/* Floating orb particles */}
        <div className="absolute top-32 left-[10%] w-3 h-3 rounded-full bg-blue-500/60 blur-sm animate-float" />
        <div className="absolute top-48 right-[15%] w-2 h-2 rounded-full bg-purple-400/70 blur-sm animate-float-delay" />
        <div className="absolute top-64 left-[20%] w-1.5 h-1.5 rounded-full bg-cyan-400/60 blur-sm animate-float-slow" />
        <div className="absolute bottom-32 right-[12%] w-2.5 h-2.5 rounded-full bg-pink-400/50 blur-sm animate-float" />
        <div className="absolute top-40 right-[30%] w-1 h-1 rounded-full bg-emerald-400/70 animate-float-delay" />
        <div className="absolute bottom-48 left-[25%] w-2 h-2 rounded-full bg-indigo-400/60 blur-sm animate-float-slow" />

        {/* Hero Badge */}
        <div className="animate-fade-in-up stagger-1 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 mb-6">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Not just a chatbot — An AI Teacher that explains, questions &amp; adapts</span>
          <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30">NEW</span>
        </div>

        {/* Main Headline */}
        <h1 className="animate-fade-in-up stagger-2 text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05] max-w-5xl mb-6">
          Master Any Subject Through
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-cyan-300 via-50% to-purple-400 bg-clip-text text-transparent animate-gradient-text">
            Adaptive Video Lessons
          </span>
          <span className="animate-blink text-cyan-400 ml-1">|</span>
        </h1>

        {/* Subtitle */}
        <p className="animate-fade-in-up stagger-3 text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl leading-relaxed mb-10">
          Upload your <span className="text-white font-semibold">PDF, textbook, or lecture notes</span> — or just type a topic.
          VidGuru AI creates a personalized lesson with a <span className="text-cyan-300 font-semibold">talking AI avatar</span>,
          neural voice, live blackboard visuals, and Socratic questioning in
          <span className="text-amber-300 font-semibold"> English, Hindi, or Hinglish</span>.
        </p>

        {/* CTA Buttons */}
        <div className="animate-fade-in-up stagger-4 flex flex-col sm:flex-row items-center gap-4 mb-12">
          <button
            onClick={scrollToOnboarding}
            className="animate-cta-glow flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-base font-bold transition-all shadow-2xl shadow-blue-500/30 active:scale-95"
          >
            <Play className="w-5 h-5" />
            Start Free Masterclass
            <ArrowRight className="w-4 h-4" />
          </button>
          <a
            href="#how-it-works"
            className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white text-base font-semibold transition-all"
          >
            <ExternalLink className="w-4 h-4 text-slate-400" />
            See How It Works
          </a>
        </div>

        {/* Hero feature pills */}
        <div className="animate-fade-in-up stagger-5 flex flex-wrap items-center justify-center gap-2 mb-16">
          {[
            { icon: Mic, label: 'Neural Voice TTS' },
            { icon: Brain, label: 'Misconception AI' },
            { icon: FileText, label: 'PDF + RAG' },
            { icon: Languages, label: 'Hinglish / Hindi' },
            { icon: Video, label: 'Video Export' },
            { icon: CheckCircle2, label: 'Adaptive Quiz' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/8 text-xs text-slate-300">
              <Icon className="w-3 h-3 text-slate-400" />
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500 text-xs animate-bounce">
          <span>Scroll to explore</span>
          <ChevronDown className="w-4 h-4" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  STATS ROW                                                     */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section ref={statsRef} className="py-16 px-6 border-y border-white/5"
        style={{ background: 'rgba(15,23,42,0.6)' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map(({ value, suffix, label, icon: Icon }, idx) => {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const count = useCountUp(value, 1600, statsVisible);
            return (
              <div key={label} className="flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-1">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-4xl font-black text-white tabular-nums">
                  {count}{suffix}
                </span>
                <span className="text-xs text-slate-400 font-medium">{label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  FEATURE CARDS                                                 */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-3 h-3" /> Core Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
              Everything a Real Teacher Does —
              <br className="hidden md:block" />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"> Powered by AI</span>
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
              VidGuru AI isn't a chatbot. It's a full pedagogical engine that teaches, questions, listens, diagnoses, and adapts — just like a world-class human tutor.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc, color, bg, border, glow }, idx) => (
              <div
                key={title}
                className={`shimmer-card hover-scale animate-fade-in-up stagger-${idx + 1} p-6 rounded-3xl glass-card border ${border} shadow-xl ${glow} flex flex-col gap-3`}
              >
                <div className={`w-11 h-11 rounded-2xl ${bg} border ${border} flex items-center justify-center ${color} shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">{title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
                <div className={`mt-auto pt-3 border-t border-white/5 flex items-center gap-1 ${color} text-[10px] font-semibold uppercase tracking-wider`}>
                  <CheckCircle2 className="w-3 h-3" />
                  Fully Implemented
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  HOW IT WORKS                                                  */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-24 px-6 border-t border-white/5"
        style={{ background: 'rgba(15,23,42,0.4)' }}>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold uppercase tracking-wider mb-4">
              <Zap className="w-3 h-3" /> How It Works
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
              From Topic to Mastery
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> in 4 Steps</span>
            </h2>
          </div>

          {/* Pipeline Steps */}
          <div className="relative grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Animated connector line (desktop) */}
            <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-blue-600 via-purple-600 via-emerald-600 to-amber-600 opacity-30 animate-pipeline" />

            {PIPELINE.map(({ step, icon: Icon, title, desc, color, accent }, idx) => (
              <div
                key={step}
                className={`relative animate-fade-in-up stagger-${idx + 1} flex flex-col items-center text-center gap-4`}
              >
                {/* Step number + Icon */}
                <div className={`relative w-20 h-20 rounded-3xl bg-gradient-to-tr ${color} flex items-center justify-center shadow-2xl z-10`}>
                  <Icon className="w-8 h-8 text-white" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-900 border border-white/10 text-[10px] font-black text-white flex items-center justify-center">
                    {step.slice(1)}
                  </span>
                </div>
                <div>
                  <h3 className={`text-sm font-bold text-white mb-1`}>{title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-[200px] mx-auto">{desc}</p>
                </div>
                {/* Arrow connector (mobile) */}
                {idx < PIPELINE.length - 1 && (
                  <div className="md:hidden text-slate-600 text-xl">↓</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  CLASSROOM PREVIEW                                             */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text */}
          <div className="animate-slide-in-left flex flex-col gap-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider w-fit">
              <Video className="w-3 h-3" /> Live Classroom Studio
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
              A Full Interactive Video Classroom —
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent"> Right in Your Browser</span>
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              The classroom combines a talking AI avatar (4 personas), a synchronized smart blackboard with
              LaTeX equations, Mermaid diagrams, and code playgrounds — all while asking Socratic questions
              and evaluating your answers in real time.
            </p>
            <ul className="flex flex-col gap-3">
              {[
                'Talking avatar with 5 emotion states (explaining, celebrating, empathizing...)',
                'Real-time LaTeX math, architecture diagrams, and code playgrounds',
                'Voice or text answers evaluated by the Socratic AI engine',
                'Misconception detected → instant pivot to remedial analogy',
                'Full lecture video export as WebM/MP4',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={scrollToOnboarding}
              className="flex items-center gap-2 w-fit px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 transition-all"
            >
              Try a Free Masterclass
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Preview Card (stylized classroom mockup) */}
          <div className="animate-slide-in-right relative">
            <div className="relative rounded-3xl glass-panel border border-white/10 shadow-2xl overflow-hidden p-6 min-h-[360px] flex flex-col gap-4">
              {/* Overlay badges */}
              {PREVIEW_BADGES.map(({ label, color, pos }) => (
                <span
                  key={label}
                  className={`absolute ${pos} z-20 px-2.5 py-1 rounded-full ${color} text-white text-[10px] font-bold backdrop-blur-sm`}
                >
                  {label}
                </span>
              ))}

              {/* Fake classroom preview layout */}
              <div className="grid grid-cols-3 gap-3 flex-1">
                {/* Avatar col */}
                <div className="rounded-2xl bg-slate-800/60 border border-blue-500/20 p-3 flex flex-col items-center gap-2">
                  {/* Avatar face */}
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-900/80 to-indigo-800/60 border-2 border-blue-500/40 flex items-center justify-center avatar-speaking">
                    <svg className="w-10 h-10" viewBox="0 0 100 100" fill="none">
                      <circle cx="50" cy="46" r="32" fill="#38bdf8" opacity="0.3" />
                      <circle cx="50" cy="48" r="26" fill="#f8fafc" />
                      <circle cx="41" cy="45" r="3.5" fill="#0f172a" />
                      <circle cx="59" cy="45" r="3.5" fill="#0f172a" />
                      <circle cx="42.5" cy="43.5" r="1.2" fill="#fff" />
                      <circle cx="60.5" cy="43.5" r="1.2" fill="#fff" />
                      <path d="M 44 58 Q 50 63 56 58" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
                      <rect x="34" y="40" width="14" height="10" rx="2" stroke="#475569" strokeWidth="1.8" fill="none" />
                      <rect x="52" y="40" width="14" height="10" rx="2" stroke="#475569" strokeWidth="1.8" fill="none" />
                      <line x1="48" y1="45" x2="52" y2="45" stroke="#475569" strokeWidth="1.8" />
                    </svg>
                  </div>
                  <span className="text-[9px] text-blue-300 font-bold">Dr. Nova</span>
                  <div className="flex gap-0.5 mt-1">
                    <span className="w-0.5 bg-cyan-400 rounded-full animate-wave-1 h-2" />
                    <span className="w-0.5 bg-blue-400 rounded-full animate-wave-2 h-2" />
                    <span className="w-0.5 bg-purple-400 rounded-full animate-wave-3 h-2" />
                    <span className="w-0.5 bg-pink-400 rounded-full animate-wave-4 h-2" />
                    <span className="w-0.5 bg-emerald-400 rounded-full animate-wave-5 h-2" />
                  </div>
                </div>

                {/* Whiteboard col */}
                <div className="col-span-2 rounded-2xl bg-slate-900/80 border border-white/8 p-3 flex flex-col gap-2">
                  <div className="text-[9px] text-cyan-300 font-bold uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Smart Blackboard
                  </div>
                  {/* Fake LaTeX block */}
                  <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-500/20 text-[9px] font-mono text-purple-200">
                    E = mc² | ∇·B = 0 | ∮E·dA = Q/ε₀
                  </div>
                  {/* Fake diagram */}
                  <div className="p-2 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-[9px] text-emerald-200 leading-relaxed">
                    Input → [Attention Heads] → Softmax → Output<br />
                    <span className="text-slate-400">Multi-head self-attention mechanism</span>
                  </div>
                  {/* Fake code */}
                  <div className="p-2 rounded-xl bg-[#0d1117] border border-amber-500/20 text-[9px] font-mono text-amber-200">
                    <span className="text-blue-400">def</span> attention(Q, K, V):<br />
                    &nbsp;&nbsp;<span className="text-slate-400">return softmax(QKᵀ/√d)·V</span>
                  </div>
                </div>
              </div>

              {/* Bottom question bar */}
              <div className="rounded-2xl bg-slate-800/60 border border-purple-500/20 p-3 flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <HelpCircle className="w-3.5 h-3.5" />
                </div>
                <p className="text-[9px] text-slate-300 flex-1">"What happens to attention scores when keys are very similar?"</p>
                <div className="flex items-center gap-1">
                  <span className="px-2 py-0.5 rounded-md bg-blue-600 text-[8px] text-white font-bold">A</span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-700 text-[8px] text-slate-300">B</span>
                </div>
              </div>
            </div>

            {/* Floating glow rings behind card */}
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-blue-600/10 to-purple-600/10 blur-2xl -z-10 animate-float-slow" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  ONBOARDING / START SECTION                                   */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section
        ref={onboardingRef}
        id="start"
        className="py-24 px-6 border-t border-white/5 relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, rgba(15,23,42,0.6) 0%, rgba(8,12,20,1) 100%)' }}
      >
        {/* Glow behind */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-b from-blue-600/15 to-transparent blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10">
          {/* Section Header */}
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider mb-4">
              <Star className="w-3 h-3 text-amber-400" /> Start Your Lesson
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
              Pick a Topic and Start Learning
            </h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">
              Choose from our preset masterclasses, upload your own document, or type any topic — and your personalized AI teacher will be ready in seconds.
            </p>
          </div>

          {/* Onboarding Flow */}
          {onboardingStep === 'upload' ? (
            <div className="rounded-3xl glass-panel border border-white/10 p-6 sm:p-10 shadow-2xl">
              <DocumentUploader onTopicOrDocReady={handleTopicOrDocReady} />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <button
                onClick={() => setOnboardingStep('upload')}
                className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                ← Back to Topic / Material Selection
              </button>
              <div className="rounded-3xl glass-panel border border-white/10 p-6 sm:p-10 shadow-2xl">
                <PersonaSelector
                  topic={selectedTopic}
                  onLaunchLesson={handleLaunchLesson}
                  isLoading={isLoading}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  FOOTER                                                        */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <footer className="py-10 px-6 border-t border-white/5 text-center flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-black text-white">
            VidGuru <span className="text-cyan-400">AI</span>
          </span>
        </div>
        <p className="text-xs text-slate-500 max-w-md leading-relaxed">
          Human-Like AI Educator • Powered by RAG, Socratic ML &amp; Adaptive Vision<br />
          Built with <span className="text-slate-400">FastAPI · Next.js 14 · Edge-TTS · Gemini · ChromaDB</span>
        </p>
        <div className="flex items-center gap-4 text-[10px] text-slate-600 font-medium">
          <span>Round 2 Technical Assessment</span>
          <span>·</span>
          <span>VidGuru AI</span>
          <span>·</span>
          <span>2026</span>
        </div>
      </footer>

    </main>
  );
}
