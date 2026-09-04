'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  LessonPlan,
  LessonStep,
  PedagogicalEvaluation,
  FinalQuiz,
  LearningReport
} from '@/lib/types';
import {
  getLessonPlan,
  executeTeachingStep,
  evaluateStudentAnswer,
  askLiveDoubt,
  generateFinalQuiz,
  submitQuizAndGetReport
} from '@/lib/api';
import { TeacherAvatar, AvatarEmotion } from '@/components/classroom/TeacherAvatar';
import { SmartWhiteboard } from '@/components/classroom/SmartWhiteboard';
import { InteractionPanel } from '@/components/classroom/InteractionPanel';
import { RemediationAlert } from '@/components/classroom/RemediationAlert';
import { LessonTimeline } from '@/components/classroom/LessonTimeline';
import { LectureVideoRecorder } from '@/components/classroom/LectureVideoRecorder';
import { QuizEngine } from '@/components/assessment/QuizEngine';
import { LearningReportView } from '@/components/assessment/LearningReportView';
import {
  GraduationCap,
  Sparkles,
  ArrowLeft,
  Award,
  BookOpen,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

function ClassroomContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planId = searchParams.get('plan_id');

  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [currentStepId, setCurrentStepId] = useState<number>(1);
  const [currentStepData, setCurrentStepData] = useState<LessonStep | null>(null);
  const [isLoadingStep, setIsLoadingStep] = useState(false);
  const [isEvaluatingAnswer, setIsEvaluatingAnswer] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<PedagogicalEvaluation | null>(null);
  const [activeDoubt, setActiveDoubt] = useState<{ teacher_answer: string; persona: string } | null>(null);

  // Assessment & Report state
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [finalQuiz, setFinalQuiz] = useState<FinalQuiz | null>(null);
  const [learningReport, setLearningReport] = useState<LearningReport | null>(null);
  const [docId, setDocId] = useState<string | undefined>(undefined);
  const [planError, setPlanError] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);

  // Initialize Lesson Plan
  useEffect(() => {
    const cachedRaw = sessionStorage.getItem('active_lesson_plan');
    const cachedDocId = sessionStorage.getItem('active_doc_id') || undefined;
    setDocId(cachedDocId);

    let parsedCached: LessonPlan | null = null;
    if (cachedRaw) {
      try {
        parsedCached = JSON.parse(cachedRaw);
      } catch (e) {}
    }

    // Case 1: planId in URL parameter
    if (planId) {
      // If sessionStorage has this exact plan, use it
      if (parsedCached && parsedCached.plan_id === planId) {
        setLessonPlan(parsedCached);
        setPlanError(null);
        loadStep(planId, 1, cachedDocId, parsedCached);
        return;
      }

      // Otherwise fetch the requested plan from backend
      setIsLoadingStep(true);
      getLessonPlan(planId)
        .then((plan) => {
          setLessonPlan(plan);
          setPlanError(null);
          try {
            sessionStorage.setItem('active_lesson_plan', JSON.stringify(plan));
          } catch (e) {}
          loadStep(plan.plan_id, 1, cachedDocId, plan);
        })
        .catch((err) => {
          console.error('Failed to fetch plan:', err);
          setPlanError(`Lesson plan "${planId}" could not be found or has expired. Please launch a new topic.`);
          setIsLoadingStep(false);
        });
      return;
    }

    // Case 2: No planId in URL, but active cached plan in session
    if (parsedCached && parsedCached.plan_id) {
      setLessonPlan(parsedCached);
      setPlanError(null);
      loadStep(parsedCached.plan_id, 1, cachedDocId, parsedCached);
      return;
    }

    // Case 3: Neither URL param nor session cache
    setPlanError("No active lesson plan selected. Please return to the home page to start a new masterclass.");
  }, [planId]);

  const loadStep = async (pId: string, sId: number, dId?: string, currentPlan?: LessonPlan) => {
    setIsLoadingStep(true);
    setEvaluationResult(null);
    setActiveDoubt(null);
    setCurrentStepId(sId);
    setStepError(null);

    // 1. Check if step data is ALREADY present and populated in the plan
    const activePlan = currentPlan || lessonPlan;
    const existingStep = (activePlan?.all_steps_flattened || []).find((s) => s.step_id === sId);
    if (existingStep && existingStep.teacher_script && existingStep.visuals && existingStep.visuals.length > 0) {
      setCurrentStepData(existingStep);
      setIsLoadingStep(false);
      return;
    }

    // 2. Fetch or generate the teaching step from backend
    try {
      const step = await executeTeachingStep({
        plan_id: pId,
        step_id: sId,
        doc_id: dId,
      });
      setCurrentStepData(step);
      // Persist step into active lesson plan so returning to it is instant
      setLessonPlan((prev) => {
        if (!prev) return prev;
        const updatedSteps = (prev.all_steps_flattened || []).map((s) => s.step_id === sId ? step : s);
        const updatedPlan = { ...prev, all_steps_flattened: updatedSteps };
        try {
          sessionStorage.setItem('active_lesson_plan', JSON.stringify(updatedPlan));
        } catch (e) {}
        return updatedPlan;
      });
    } catch (err: any) {
      console.error('Failed to load step:', err);
      setStepError(err.message || 'Failed to generate step content. Please check backend connection.');
    } finally {
      setIsLoadingStep(false);
    }
  };

  const handleSelectStep = (sId: number) => {
    if (!lessonPlan) return;
    loadStep(lessonPlan.plan_id, sId, docId, lessonPlan);
  };

  const handleSubmitAnswer = async (response: string, isAudio: boolean) => {
    if (!lessonPlan || !currentStepData || !currentStepData.formative_question) return;

    setIsEvaluatingAnswer(true);
    try {
      const result = await evaluateStudentAnswer({
        plan_id: lessonPlan.plan_id,
        step_id: currentStepId,
        question_prompt: currentStepData.formative_question.prompt,
        student_response: response,
        is_audio: isAudio,
      });

      setEvaluationResult(result);

      if (result.is_correct) {
        // Mark step completed
        if (currentStepData) currentStepData.is_completed = true;
        // Automatically suggest advancing or show success
      }
    } catch (err) {
      console.error('Answer evaluation failed:', err);
      alert('Evaluation failed. Please try again.');
    } finally {
      setIsEvaluatingAnswer(false);
    }
  };

  const handleAskDoubt = async (doubt: string) => {
    if (!lessonPlan) return;
    try {
      const res = await askLiveDoubt({
        plan_id: lessonPlan.plan_id,
        step_id: currentStepId,
        student_question: doubt,
      });
      setActiveDoubt(res);
    } catch (err) {
      console.error('Doubt failed:', err);
    }
  };

  const handleNextStep = () => {
    if (!lessonPlan) return;
    const allSteps = lessonPlan.all_steps_flattened || lessonPlan.modules.flatMap((m) => m.steps);
    const nextStep = allSteps.find((s) => s.step_id === currentStepId + 1);

    if (nextStep) {
      loadStep(lessonPlan.plan_id, nextStep.step_id, docId);
    } else {
      // Reached end of syllabus -> Launch Quiz
      handleStartQuiz();
    }
  };

  const handleStartQuiz = async () => {
    if (!lessonPlan) return;
    setIsLoadingStep(true);
    try {
      const quiz = await generateFinalQuiz(lessonPlan.plan_id);
      setFinalQuiz(quiz);
      setIsQuizActive(true);
    } catch (err) {
      console.error('Quiz generation failed:', err);
    } finally {
      setIsLoadingStep(false);
    }
  };

  const handleCompleteQuiz = async (answers: Record<string, number>, timeSpent: number) => {
    if (!lessonPlan || !finalQuiz) return;
    setIsLoadingStep(true);
    try {
      const report = await submitQuizAndGetReport({
        plan_id: lessonPlan.plan_id,
        quiz_id: finalQuiz.quiz_id,
        answers: answers,
        time_spent_seconds: timeSpent,
      });
      setLearningReport(report);
      setIsQuizActive(false);
    } catch (err) {
      console.error('Report submission failed:', err);
    } finally {
      setIsLoadingStep(false);
    }
  };

  if (planError) {
    return (
      <div className="min-h-screen bg-[#080c14] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Lesson Plan Not Available</h3>
        <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">{planError}</p>
        <button
          onClick={() => {
            try { sessionStorage.removeItem('active_lesson_plan'); } catch (e) {}
            router.push('/');
          }}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
        >
          Return to Dashboard & Start Lesson →
        </button>
      </div>
    );
  }

  if (!lessonPlan) {
    return (
      <div className="min-h-screen bg-[#080c14] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4 animate-spin">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Connecting to AI Classroom...</h3>
        <p className="text-xs text-slate-400">Loading personalized syllabus and neural audio models</p>
      </div>
    );
  }

  // View Mode: Final Learning Analytics Report
  if (learningReport) {
    return (
      <div className="min-h-screen bg-[#080c14] text-white py-8 px-4">
        <LearningReportView
          report={learningReport}
          onRestartOrNewTopic={() => router.push('/')}
        />
      </div>
    );
  }

  // View Mode: Final Quiz
  if (isQuizActive && finalQuiz) {
    return (
      <div className="min-h-screen bg-[#080c14] text-white py-8 px-4">
        <QuizEngine
          quiz={finalQuiz}
          onCompleteQuiz={handleCompleteQuiz}
          onExit={() => setIsQuizActive(false)}
        />
      </div>
    );
  }

  const getTeacherEmotion = (): AvatarEmotion => {
    if (isEvaluatingAnswer) return 'thinking';
    if (evaluationResult?.is_correct) return 'celebrating';
    if (evaluationResult?.needs_remediation) return 'empathizing';
    if (currentStepData?.formative_question) return 'inquiring';
    return 'explaining';
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-white flex flex-col">
      {/* Top Classroom Bar */}
      <header className="px-6 py-4 border-b border-white/10 glass-panel flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Exit Classroom"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                1-on-1 Interactive Video Masterclass
              </span>
              <span className="text-xs text-slate-400">{lessonPlan.student_profile.teacher_persona}</span>
            </div>
            <h1 className="text-base font-bold text-white">{lessonPlan.topic_title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <LectureVideoRecorder
            topic={lessonPlan.topic_title}
            teacherPersona={lessonPlan.student_profile.teacher_persona}
          />
          <button
            onClick={handleStartQuiz}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
          >
            <Award className="w-4 h-4" />
            <span className="hidden sm:inline">Final Mastery Assessment</span>
          </button>
        </div>
      </header>

      {/* Main Classroom Layout (3 Columns: Avatar & Teacher | Smart Whiteboard | Syllabus Roadmap) */}
      <div className="flex-1 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1600px] w-full mx-auto">
        {/* Left Column: AI Teacher Avatar & Spoken Transcript (3 Cols) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <TeacherAvatar
            persona={lessonPlan.student_profile.teacher_persona}
            language={lessonPlan.student_profile.language}
            isSpeaking={isLoadingStep}
            audioUrl={currentStepData?.audio_url}
            teacherScript={currentStepData?.teacher_script}
            emotion={getTeacherEmotion()}
            isLoading={isLoadingStep}
            onPersonaChange={(newPersona) => {
              setLessonPlan((prev) => prev ? {
                ...prev,
                student_profile: { ...prev.student_profile, teacher_persona: newPersona }
              } : null);
            }}
          />

          {/* Quick Context Card */}
          <div className="rounded-2xl glass-panel border border-white/10 p-4 shadow-xl text-xs text-slate-300">
            <h4 className="font-bold text-white mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              Lesson Objective
            </h4>
            <p className="leading-relaxed text-slate-400">{currentStepData?.concept_summary || lessonPlan.overview}</p>
          </div>
        </div>

        {/* Center Column: Dynamic Blackboard & Socratic Interaction (6 Cols) */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          {/* Step Error Banner with Retry */}
          {stepError && (
            <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-200 flex items-center justify-between shadow-xl animate-in fade-in">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                <div>
                  <h5 className="text-xs font-bold text-red-300">Teaching Step Issue</h5>
                  <p className="text-xs text-slate-300">{stepError}</p>
                </div>
              </div>
              <button
                onClick={() => lessonPlan && loadStep(lessonPlan.plan_id, currentStepId, docId, lessonPlan)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md transition-all shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retry Step
              </button>
            </div>
          )}

          <div className="flex-1 min-h-[380px]">
            <SmartWhiteboard
              stepTitle={currentStepData?.title || 'Interactive Blackboard'}
              stepType={currentStepData?.step_type || 'concept'}
              visuals={currentStepData?.visuals}
              topic={lessonPlan.topic_title}
              isLoading={isLoadingStep}
            />
          </div>

          {/* Socratic Success / Correct Answer Toast */}
          {evaluationResult && evaluationResult.is_correct && (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 flex items-center justify-between shadow-xl animate-in fade-in">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <h5 className="text-xs font-bold text-emerald-300">Conceptual Mastery Verified!</h5>
                  <p className="text-xs text-slate-200">{evaluationResult.socratic_feedback}</p>
                </div>
              </div>
              <button
                onClick={handleNextStep}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md"
              >
                Proceed to Next Step →
              </button>
            </div>
          )}

          {/* Adaptive Misconception Remediation Banner (if incorrect/misconception detected) */}
          {evaluationResult && evaluationResult.needs_remediation && evaluationResult.remediation_package && (
            <RemediationAlert
              evaluationFeedback={evaluationResult.socratic_feedback}
              remediation={evaluationResult.remediation_package}
              onAnswerFollowUp={(ans) => {
                // Submit follow-up
                handleSubmitAnswer(ans, false);
              }}
              onDismiss={() => setEvaluationResult(null)}
            />
          )}

          {/* Socratic Checkpoint Interaction Console */}
          <InteractionPanel
            question={currentStepData?.formative_question}
            onSubmitAnswer={handleSubmitAnswer}
            onAskDoubt={handleAskDoubt}
            isEvaluating={isEvaluatingAnswer}
            activeDoubtAnswer={activeDoubt}
            language={lessonPlan.student_profile.language}
            isLoading={isLoadingStep}
          />
        </div>

        {/* Right Column: Syllabus Roadmap Timeline (3 Cols) */}
        <div className="lg:col-span-3 h-full">
          <LessonTimeline
            modules={lessonPlan.modules}
            currentStepId={currentStepId}
            onSelectStep={handleSelectStep}
            onStartQuiz={handleStartQuiz}
          />
        </div>
      </div>
    </div>
  );
}

export default function ClassroomPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080c14] text-white flex items-center justify-center">Loading Classroom...</div>}>
      <ClassroomContent />
    </Suspense>
  );
}
