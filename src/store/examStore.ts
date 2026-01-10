import { create } from 'zustand';
import type { ExamPaper, Question, UserAnswer, ViewMode } from '../types/exam';
import { isEmptyAnswer } from '../utils/grading';

interface ExamState {
  examPaper: ExamPaper | null;
  answers: Record<string, UserAnswer>;
  viewMode: ViewMode;
  currentQuestionIndex: number;
  currentSectionIndex: number;
  submitted: boolean;
  answeredCount: number;

  setExamPaper: (paper: ExamPaper) => void;
  setAnswer: (questionId: string, answer: string | string[]) => void;
  setViewMode: (mode: ViewMode) => void;
  setCurrentQuestion: (sectionIndex: number, questionIndex: number) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  submit: () => void;
  reset: () => void;
  getAllQuestions: () => Question[];
  getCurrentQuestion: () => Question | null;
}

const getAllQuestionsFromPaper = (paper: ExamPaper): Question[] => {
  return paper.sections.flatMap(section => section.questions);
};

export const useExamStore = create<ExamState>((set, get) => ({
  examPaper: null,
  answers: {},
  viewMode: 'full',
  currentQuestionIndex: 0,
  currentSectionIndex: 0,
  submitted: false,
  answeredCount: 0,

  setExamPaper: (paper) => {
    set({
      examPaper: paper,
      answers: {},
      submitted: false,
      answeredCount: 0,
      currentSectionIndex: 0,
      currentQuestionIndex: 0,
    });
  },

  setAnswer: (questionId, answer) => {
    const { examPaper, answers, submitted } = get();
    if (!examPaper || submitted) return;

    const questions = getAllQuestionsFromPaper(examPaper);
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    const newAnswers = { ...answers };
    if (isEmptyAnswer(answer)) {
      delete newAnswers[questionId];
    } else {
      newAnswers[questionId] = { questionId, answer };
    }

    const answeredCount = Object.values(newAnswers).filter((a) => !isEmptyAnswer(a.answer)).length;
    set({ answers: newAnswers, answeredCount });
  },

  setViewMode: (mode) => {
    set({ viewMode: mode });
  },

  setCurrentQuestion: (sectionIndex, questionIndex) => {
    set({ currentSectionIndex: sectionIndex, currentQuestionIndex: questionIndex });
  },

  nextQuestion: () => {
    const { examPaper, currentSectionIndex, currentQuestionIndex } = get();
    if (!examPaper) return;

    const sections = examPaper.sections;
    let newSectionIndex = currentSectionIndex;
    let newQuestionIndex = currentQuestionIndex + 1;

    if (newQuestionIndex >= sections[currentSectionIndex].questions.length) {
      newSectionIndex++;
      newQuestionIndex = 0;
    }

    if (newSectionIndex < sections.length) {
      set({ currentSectionIndex: newSectionIndex, currentQuestionIndex: newQuestionIndex });
    }
  },

  prevQuestion: () => {
    const { examPaper, currentSectionIndex, currentQuestionIndex } = get();
    if (!examPaper) return;

    const sections = examPaper.sections;
    let newSectionIndex = currentSectionIndex;
    let newQuestionIndex = currentQuestionIndex - 1;

    if (newQuestionIndex < 0) {
      newSectionIndex--;
      if (newSectionIndex >= 0) {
        newQuestionIndex = sections[newSectionIndex].questions.length - 1;
      } else {
        newSectionIndex = 0;
        newQuestionIndex = 0;
      }
    }

    set({ currentSectionIndex: newSectionIndex, currentQuestionIndex: newQuestionIndex });
  },

  submit: () => {
    const { examPaper } = get();
    if (!examPaper) return;
    set({ submitted: true });
  },

  reset: () => {
    const { examPaper } = get();
    if (examPaper) {
      set({
        answers: {},
        submitted: false,
        answeredCount: 0,
        currentSectionIndex: 0,
        currentQuestionIndex: 0,
      });
    }
  },

  getAllQuestions: () => {
    const { examPaper } = get();
    return examPaper ? getAllQuestionsFromPaper(examPaper) : [];
  },

  getCurrentQuestion: () => {
    const { examPaper, currentSectionIndex, currentQuestionIndex } = get();
    if (!examPaper) return null;
    return examPaper.sections[currentSectionIndex]?.questions[currentQuestionIndex] || null;
  },
}));
