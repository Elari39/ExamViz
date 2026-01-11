export type QuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'true_false'
  | 'fill_in_blank'
  | 'short_answer'
  | 'calculation'
  | 'coding';

export interface Option {
  label: string;
  value: string;
}

export interface Question {
  id: string;
  idx: number;
  score: number;
  type: QuestionType;
  content: string;
  options?: Option[];
  correctAnswer: string | string[];
  analysis: string;
  isLatex?: boolean;
  codeLanguage?: string;
  defaultCode?: string;
}

export interface Section {
  id: string;
  title: string;
  description: string;
  type: string;
  questions: Question[];
}

export interface ExamMeta {
  id: string;
  title: string;
  totalScore: number;
  duration: number;
  createTime: string;
  description: string;
}

export interface ExamPaper {
  examMeta: ExamMeta;
  sections: Section[];
}

export interface AiGrade {
  score: number;
  feedback?: string;
  model?: string;
  gradedAt?: string;
}

export interface UserAnswer {
  questionId: string;
  answer: string | string[];
  isCorrect?: boolean;
  score?: number;
  aiGrade?: AiGrade;
}

export type ViewMode = 'full' | 'single';
