import type { ExamPaper, QuestionType } from '../types/exam';

export interface ValidationIssue {
  path: string;
  message: string;
}

export class ExamPaperValidationError extends Error {
  issues: ValidationIssue[];

  constructor(issues: ValidationIssue[]) {
    super(formatExamPaperIssues(issues));
    this.name = 'ExamPaperValidationError';
    this.issues = issues;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim() !== '';
};

const isFiniteNumber = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isFinite(value);
};

const QUESTION_TYPES: ReadonlySet<QuestionType> = new Set([
  'single_choice',
  'multiple_choice',
  'true_false',
  'fill_in_blank',
  'short_answer',
  'calculation',
  'coding',
]);

export const validateExamPaper = (value: unknown): { ok: boolean; issues: ValidationIssue[] } => {
  const issues: ValidationIssue[] = [];
  const add = (path: string, message: string) => issues.push({ path, message });

  if (!isRecord(value)) {
    add('$', '顶层应为 JSON 对象');
    return { ok: false, issues };
  }

  const examMeta = value.examMeta;
  if (!isRecord(examMeta)) {
    add('$.examMeta', '必填，且应为对象');
  } else {
    if (!isNonEmptyString(examMeta.id)) add('$.examMeta.id', '必填，且应为非空字符串');
    if (!isNonEmptyString(examMeta.title)) add('$.examMeta.title', '必填，且应为非空字符串');
    if (!isFiniteNumber(examMeta.totalScore)) add('$.examMeta.totalScore', '必填，且应为数字');
    if (!isFiniteNumber(examMeta.duration)) add('$.examMeta.duration', '必填，且应为数字（分钟）');
    if (!isNonEmptyString(examMeta.createTime)) add('$.examMeta.createTime', '必填，且应为字符串（建议 ISO 时间）');
    if (typeof examMeta.description !== 'string') add('$.examMeta.description', '必填，且应为字符串（可为空）');
  }

  const sections = value.sections;
  if (!Array.isArray(sections)) {
    add('$.sections', '必填，且应为数组');
    return { ok: false, issues };
  }

  sections.forEach((section, sectionIndex) => {
    const sectionPath = `$.sections[${sectionIndex}]`;
    if (!isRecord(section)) {
      add(sectionPath, '应为对象');
      return;
    }

    if (!isNonEmptyString(section.id)) add(`${sectionPath}.id`, '必填，且应为非空字符串');
    if (!isNonEmptyString(section.title)) add(`${sectionPath}.title`, '必填，且应为非空字符串');
    if (typeof section.description !== 'string') add(`${sectionPath}.description`, '必填，且应为字符串（可为空）');
    if (!isNonEmptyString(section.type)) add(`${sectionPath}.type`, '必填，且应为非空字符串');

    const questions = section.questions;
    if (!Array.isArray(questions)) {
      add(`${sectionPath}.questions`, '必填，且应为数组');
      return;
    }

    questions.forEach((question, questionIndex) => {
      const qPath = `${sectionPath}.questions[${questionIndex}]`;
      if (!isRecord(question)) {
        add(qPath, '应为对象');
        return;
      }

      if (!isNonEmptyString(question.id)) add(`${qPath}.id`, '必填，且应为非空字符串');
      if (!isFiniteNumber(question.idx) || question.idx <= 0) add(`${qPath}.idx`, '必填，且应为正数');
      if (!isFiniteNumber(question.score) || question.score < 0) add(`${qPath}.score`, '必填，且应为非负数');

      const type = question.type;
      if (!isNonEmptyString(type) || !QUESTION_TYPES.has(type as QuestionType)) {
        add(`${qPath}.type`, `必填，且必须为以下之一：${Array.from(QUESTION_TYPES).join(' | ')}`);
        return;
      }

      if (typeof question.content !== 'string') add(`${qPath}.content`, '必填，且应为字符串');
      if (typeof question.analysis !== 'string') add(`${qPath}.analysis`, '必填，且应为字符串（可为空）');

      const options = question.options;
      if (type === 'single_choice' || type === 'multiple_choice') {
        if (!Array.isArray(options) || options.length < 2) {
          add(`${qPath}.options`, '必填，且应为数组（至少 2 个选项）');
        } else {
          options.forEach((opt, optIndex) => {
            const optPath = `${qPath}.options[${optIndex}]`;
            if (!isRecord(opt)) {
              add(optPath, '应为对象');
              return;
            }
            if (!isNonEmptyString(opt.label)) add(`${optPath}.label`, '必填，且应为非空字符串');
            if (typeof opt.value !== 'string') add(`${optPath}.value`, '必填，且应为字符串（可为空）');
          });
        }
      }

      if (type === 'true_false' && Array.isArray(options) && options.length !== 2) {
        add(`${qPath}.options`, '如提供 options，则必须包含 2 个选项（True/False）');
      }

      const correctAnswer = question.correctAnswer;
      if (type === 'multiple_choice') {
        const ok =
          (Array.isArray(correctAnswer) && correctAnswer.every((v) => typeof v === 'string') && correctAnswer.length > 0) ||
          (typeof correctAnswer === 'string' && correctAnswer.trim() !== '');
        if (!ok) add(`${qPath}.correctAnswer`, '必填，建议为字符串数组（例如 ["A","C"]）');
      } else if (type === 'fill_in_blank') {
        const ok =
          (Array.isArray(correctAnswer) && correctAnswer.every((v) => typeof v === 'string') && correctAnswer.length > 0) ||
          typeof correctAnswer === 'string';
        if (!ok) add(`${qPath}.correctAnswer`, '必填，应为字符串或字符串数组（按空位顺序）');

        const hasPlaceholders =
          typeof question.content === 'string' ? question.content.includes('___') : false;
        if (!Array.isArray(correctAnswer) && !hasPlaceholders) {
          add(`${qPath}.content`, '当 correctAnswer 不是数组时，题干需包含 ___ 以推断空位数量');
        }
      } else if (type === 'single_choice' || type === 'true_false') {
        if (typeof correctAnswer !== 'string' || correctAnswer.trim() === '') {
          add(`${qPath}.correctAnswer`, '必填，且应为字符串（例如 "A" / "True"）');
        }
      } else if (type === 'coding') {
        if (typeof correctAnswer !== 'string' && !Array.isArray(correctAnswer)) {
          add(`${qPath}.correctAnswer`, '建议为字符串（参考代码）；为空字符串表示待评分');
        }
        if (question.codeLanguage != null && typeof question.codeLanguage !== 'string') {
          add(`${qPath}.codeLanguage`, '可选字段，应为字符串（例如 "python"）');
        }
        if (question.defaultCode != null && typeof question.defaultCode !== 'string') {
          add(`${qPath}.defaultCode`, '可选字段，应为字符串');
        }
      } else {
        if (typeof correctAnswer !== 'string' && !Array.isArray(correctAnswer)) {
          add(`${qPath}.correctAnswer`, '必填，应为字符串或字符串数组');
        }
      }

      if (question.isLatex != null && typeof question.isLatex !== 'boolean') {
        add(`${qPath}.isLatex`, '可选字段，应为 boolean');
      }
    });
  });

  return { ok: issues.length === 0, issues };
};

export const assertExamPaper = (value: unknown): ExamPaper => {
  const result = validateExamPaper(value);
  if (!result.ok) {
    throw new ExamPaperValidationError(result.issues);
  }
  return value as ExamPaper;
};

export const formatExamPaperIssues = (issues: ValidationIssue[], max = 8): string => {
  if (issues.length === 0) return 'OK';
  const lines = issues.slice(0, max).map((i) => `${i.path}: ${i.message}`);
  const tail = issues.length > max ? `\n… 还有 ${issues.length - max} 项` : '';
  return `JSON 结构不符合规则：\n${lines.join('\n')}${tail}`;
};

