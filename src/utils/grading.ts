import type { ExamPaper, Question, QuestionType, UserAnswer } from '../types/exam';

export type GradeState = 'unanswered' | 'correct' | 'partial' | 'wrong' | 'pending';

export interface GradeResult {
  state: GradeState;
  score: number;
  maxScore: number;
}

const normalizeKey = (value: string) => value.trim().toUpperCase();
const normalizeText = (value: string) => value.trim().toLowerCase();
const normalizeCode = (code: string) =>
  code
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+$/g, ''))
    .join('\n')
    .trim();

export const isEmptyAnswer = (answer: unknown): boolean => {
  if (answer == null) return true;
  if (Array.isArray(answer)) {
    return answer.every((item) => String(item ?? '').trim() === '');
  }
  return String(answer).trim() === '';
};

export const isAutoGradableType = (type: QuestionType): boolean => {
  return type !== 'short_answer' && type !== 'calculation';
};

const clampScore = (score: number, maxScore: number) => {
  if (!Number.isFinite(score)) return 0;
  if (score < 0) return 0;
  if (score > maxScore) return maxScore;
  return Math.round(score * 100) / 100;
};

const scoreToState = (score: number, maxScore: number): GradeState => {
  if (maxScore <= 0) return 'correct';
  if (score <= 0) return 'wrong';
  if (score >= maxScore) return 'correct';
  return 'partial';
};

export const gradeQuestion = (question: Question, userAnswer?: UserAnswer): GradeResult => {
  const maxScore = question.score;
  const answer = userAnswer?.answer;

  if (isEmptyAnswer(answer)) {
    return { state: 'unanswered', score: 0, maxScore };
  }

  switch (question.type) {
    case 'short_answer':
    case 'calculation': {
      const aiScore = userAnswer?.aiGrade?.score;
      if (typeof aiScore === 'number') {
        const score = clampScore(aiScore, maxScore);
        return { state: scoreToState(score, maxScore), score, maxScore };
      }
      return { state: 'pending', score: 0, maxScore };
    }
    case 'single_choice':
    case 'true_false': {
      const userVal = normalizeKey(String(answer));
      const correctVal = normalizeKey(String(question.correctAnswer));
      const isCorrect = userVal === correctVal;
      return { state: isCorrect ? 'correct' : 'wrong', score: isCorrect ? maxScore : 0, maxScore };
    }
    case 'multiple_choice': {
      const correctArr = (Array.isArray(question.correctAnswer)
        ? question.correctAnswer
        : [String(question.correctAnswer)]
      )
        .map(String)
        .map(normalizeKey);

      const userArr = (Array.isArray(answer) ? answer : [answer])
        .map((v) => normalizeKey(String(v)))
        .filter((v) => v !== '');

      const uniqueUser = Array.from(new Set(userArr));

      const hasWrong = uniqueUser.some((val) => !correctArr.includes(val));
      if (hasWrong) return { state: 'wrong', score: 0, maxScore };

      const correctSelected = uniqueUser.filter((val) => correctArr.includes(val)).length;
      if (correctSelected <= 0) return { state: 'unanswered', score: 0, maxScore };

      const rawScore = (correctSelected / correctArr.length) * maxScore;
      const score = Math.round(rawScore * 100) / 100;
      const state = correctSelected === correctArr.length ? 'correct' : 'partial';
      return { state, score, maxScore };
    }
    case 'fill_in_blank': {
      const correctArr = (Array.isArray(question.correctAnswer)
        ? question.correctAnswer
        : [String(question.correctAnswer)]
      ).map(String);
      const expected = correctArr.length;

      const userArr = Array.isArray(answer) ? answer : [answer];

      let correctCount = 0;
      for (let i = 0; i < expected; i++) {
        const userVal = normalizeText(String(userArr[i] ?? ''));
        const correctVal = normalizeText(String(correctArr[i] ?? ''));
        if (userVal !== '' && userVal === correctVal) correctCount++;
      }

      const rawScore = expected > 0 ? (correctCount / expected) * maxScore : 0;
      const score = Math.round(rawScore * 100) / 100;
      const state = correctCount === expected ? 'correct' : score > 0 ? 'partial' : 'wrong';
      return { state, score, maxScore };
    }
    case 'coding': {
      const correctCode = String(question.correctAnswer ?? '').trim();
      if (correctCode === '') {
        const aiScore = userAnswer?.aiGrade?.score;
        if (typeof aiScore === 'number') {
          const score = clampScore(aiScore, maxScore);
          return { state: scoreToState(score, maxScore), score, maxScore };
        }
        return { state: 'pending', score: 0, maxScore };
      }

      const userCode = String(answer ?? '');
      const isCorrect = normalizeCode(userCode) === normalizeCode(correctCode);
      return { state: isCorrect ? 'correct' : 'wrong', score: isCorrect ? maxScore : 0, maxScore };
    }
    default:
      return { state: 'pending', score: 0, maxScore };
  }
};

export interface ExamStats {
  totalQuestions: number;
  answeredQuestions: number;
  currentScore: number;
  autoTotalScore: number;
  pendingQuestions: number;
}

export const calculateExamStats = (
  paper: ExamPaper,
  answers: Record<string, UserAnswer>,
): ExamStats => {
  const questions = paper.sections.flatMap((section) => section.questions);
  let currentScore = 0;
  let autoTotalScore = 0;
  let pendingQuestions = 0;

  for (const question of questions) {
    const grade = gradeQuestion(question, answers[question.id]);
    if (grade.state === 'pending') pendingQuestions++;
    else autoTotalScore += question.score;
    currentScore += grade.score;
  }

  const answeredQuestions = Object.values(answers).filter((a) => !isEmptyAnswer(a.answer)).length;

  return {
    totalQuestions: questions.length,
    answeredQuestions,
    currentScore: Math.round(currentScore * 100) / 100,
    autoTotalScore,
    pendingQuestions,
  };
};
