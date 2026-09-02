export type StudentProfile = {
  grade_level: string;
  language: string;
  learning_goal: string;
  time_budget_mins: number;
  learning_style: string;
  teacher_persona: string;
};

export type LessonPlan = {
  plan_id: string;
  topic_title: string;
  overview: string;
  student_profile: StudentProfile;
  modules: Array<{
    module_id: number;
    title: string;
    description: string;
    steps: Array<{
      step_id: number;
      title: string;
      step_type: string;
      concept_summary: string;
      formative_question?: {
        prompt: string;
      } | null;
      teacher_script?: string | null;
      audio_url?: string | null;
    }>;
  }>;
};

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
};
