import { create } from 'zustand';
import type { ExamPaper, Question, UserAnswer, ViewMode } from '../types/exam';
import { gradeQuestion, isEmptyAnswer } from '../utils/grading';
import { checkAiHealth, requestAiGrades } from '../utils/aiGradingApi';

type AiGradingStatus = 'idle' | 'grading' | 'done' | 'error';

interface ExamState {
  examPaper: ExamPaper | null;
  answers: Record<string, UserAnswer>;
  viewMode: ViewMode;
  currentQuestionIndex: number;
  currentSectionIndex: number;
  submitted: boolean;
  answeredCount: number;
  aiGradingStatus: AiGradingStatus;
  aiGradingError: string | null;

  setExamPaper: (paper: ExamPaper) => void;
  setAnswer: (questionId: string, answer: string | string[]) => void;
  setViewMode: (mode: ViewMode) => void;
  setCurrentQuestion: (sectionIndex: number, questionIndex: number) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  submit: () => void;
  reset: () => void;
  gradeWithAI: (options?: { regrade?: boolean }) => Promise<{ graded: number }>;
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
  aiGradingStatus: 'idle',
  aiGradingError: null,

  setExamPaper: (paper) => {
    set({
      examPaper: paper,
      answers: {},
      submitted: false,
      answeredCount: 0,
      currentSectionIndex: 0,
      currentQuestionIndex: 0,
      aiGradingStatus: 'idle',
      aiGradingError: null,
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
        aiGradingStatus: 'idle',
        aiGradingError: null,
      });
    }
  },

  gradeWithAI: async (options) => {
    const { regrade = false } = options ?? {};
    const { examPaper, answers, submitted } = get();
    if (!examPaper || !submitted) return { graded: 0 };

    const questions = getAllQuestionsFromPaper(examPaper);
    const candidates = questions.filter((question) => {
      const userAnswer = answers[question.id];
      if (!userAnswer || isEmptyAnswer(userAnswer.answer)) return false;

      if (question.type === 'short_answer' || question.type === 'calculation') return true;
      if (question.type === 'coding' && String(question.correctAnswer ?? '').trim() === '') return true;
      return false;
    });

    const toGrade = regrade
      ? candidates
      : candidates.filter((question) => gradeQuestion(question, answers[question.id]).state === 'pending');

    if (toGrade.length === 0) return { graded: 0 };

    set({ aiGradingStatus: 'grading', aiGradingError: null });
    try {
      const health = await checkAiHealth();
      if (!health.hasConfig) {
        throw new Error('AI 服务未配置：请检查 .env（AI_BASE_URL / AI_API_KEY / AI_MODEL）');
      }

      const resp = await requestAiGrades(
        toGrade.map((question) => {
          const userAnswer = answers[question.id];
          if (!userAnswer) {
            throw new Error(`找不到题目 ${question.id} 的作答`);
          }
          return {
            questionId: question.id,
            questionType: question.type,
            maxScore: question.score,
            content: question.content,
            referenceAnswer: question.correctAnswer,
            options: question.options,
            userAnswer: userAnswer.answer,
          };
        }),
      );

      const model = resp.model;
      const gradedAt = new Date().toISOString();
      const resultById = new Map(resp.results.map((item) => [item.questionId, item]));

      let graded = 0;
      const nextAnswers: Record<string, UserAnswer> = { ...answers };
      for (const question of toGrade) {
        const existing = nextAnswers[question.id];
        if (!existing) continue;

        const result = resultById.get(question.id);
        if (!result) continue;

        nextAnswers[question.id] = {
          ...existing,
          aiGrade: {
            score: result.score,
            feedback: result.feedback,
            model,
            gradedAt,
          },
        };
        graded++;
      }

      set({
        answers: nextAnswers,
        aiGradingStatus: 'done',
        aiGradingError: null,
      });
      return { graded };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI 批改失败';
      set({ aiGradingStatus: 'error', aiGradingError: message });
      throw err;
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
