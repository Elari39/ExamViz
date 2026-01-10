import type { ExamPaper } from '../types/exam';
import { assertExamPaper } from './validateExamPaper';

const STORAGE_KEY = 'json2test.examPaper.v1';

interface PersistedExamPaperV1 {
  version: 1;
  savedAt: string;
  paper: ExamPaper;
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const savePersistedExamPaper = (paper: ExamPaper): void => {
  if (typeof window === 'undefined' || !('localStorage' in window)) return;

  const payload: PersistedExamPaperV1 = {
    version: 1,
    savedAt: new Date().toISOString(),
    paper,
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

export const loadPersistedExamPaper = (): PersistedExamPaperV1 | null => {
  if (typeof window === 'undefined' || !('localStorage' in window)) return null;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;

    // 兼容旧格式：直接存 paper
    if (isRecord(parsed) && 'examMeta' in parsed && 'sections' in parsed) {
      return {
        version: 1,
        savedAt: new Date().toISOString(),
        paper: assertExamPaper(parsed),
      };
    }

    if (!isRecord(parsed)) return null;
    if (parsed.version !== 1) return null;
    if (!isRecord(parsed.paper)) return null;

    return {
      version: 1,
      savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : new Date().toISOString(),
      paper: assertExamPaper(parsed.paper),
    };
  } catch {
    return null;
  }
};

export const clearPersistedExamPaper = (): void => {
  if (typeof window === 'undefined' || !('localStorage' in window)) return;
  window.localStorage.removeItem(STORAGE_KEY);
};

