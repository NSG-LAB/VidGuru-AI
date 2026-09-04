export interface StudentProfile {
  grade_level: string;
  language: string;
  learning_goal: string;
  time_budget_mins: number;
  learning_style: string;
  teacher_persona: string;
}

export interface VisualContent {
  type: 'latex' | 'mermaid' | 'code' | 'concept_card' | 'key_takeaways' | 'chart_data' | 'analogy_box';
  title: string;
  content: string;
  explanation?: string;
  language?: string;
}

export interface FormativeQuestion {
  id: string;
  prompt: string;
  options?: string[] | null;
  correct_answer?: string | null;
  question_type: 'multiple_choice' | 'open_ended_voice_or_text' | 'code_puzzle' | 'true_false';
  bloom_level?: string;
  hints?: string[];
  common_misconceptions?: string[];
}

export interface LessonStep {
  step_id: number;
  step_type: 'introduction' | 'concept_breakdown' | 'visual_deep_dive' | 'practical_demo' | 'checkpoint' | 'adaptive_pivot' | 'synthesis';
  title: string;
  concept_summary: string;
  estimated_duration_seconds: number;
  is_completed: boolean;
  teacher_script?: string;
  visuals?: VisualContent[];
  formative_question?: FormativeQuestion;
  audio_url?: string;
}

export interface LessonModule {
  module_id: number;
  title: string;
  description: string;
  steps: LessonStep[];
}

export interface LessonPlan {
  plan_id: string;
  topic_title: string;
  overview: string;
  student_profile: StudentProfile;
  total_estimated_mins: number;
  modules: LessonModule[];
  all_steps_flattened?: LessonStep[];
}

export interface AdaptiveRemediation {
  misconception_diagnosed: string;
  why_it_happens: string;
  remedial_analogy: string;
  scaffolded_explanation: string;
  refresher_visual?: VisualContent;
  follow_up_question: FormativeQuestion;
}

export interface PedagogicalEvaluation {
  is_correct: boolean;
  confidence_score: number;
  socratic_feedback: string;
  diagnosed_misconception?: string | null;
  needs_remediation: boolean;
  remediation_package?: AdaptiveRemediation | null;
  encouragement_note: string;
  next_action: 'proceed_next_step' | 'trigger_remediation' | 'give_hint' | 'retry';
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_option_index: number;
  explanation: string;
  concept_tested: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface FinalQuiz {
  quiz_id: string;
  topic: string;
  questions: QuizQuestion[];
  total_questions: number;
}

export interface MisconceptionLog {
  concept: string;
  misconception: string;
  status: 'resolved' | 'needs_practice' | 'mastered';
  remedy_applied: string;
}

export interface LearningReport {
  report_id: string;
  topic: string;
  student_profile: StudentProfile;
  overall_score_pct: number;
  mastery_level: 'Novice' | 'Developing' | 'Proficient' | 'Master';
  strengths: string[];
  areas_for_growth: string[];
  misconceptions_log: MisconceptionLog[];
  key_takeaways_summary: string;
  spaced_repetition_plan: { day: string; action: string }[];
  downloadable_notes_md: string;
}

export interface DocumentUploadResponse {
  doc_id: string;
  filename: string;
  num_pages: number;
  num_chunks: number;
  summary: string;
  key_topics: string[];
}
