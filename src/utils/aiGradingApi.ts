import type { Option, QuestionType } from '../types/exam';

export interface AiGradeItem {
  questionId: string;
  questionType: QuestionType;
  maxScore: number;
  content: string;
  referenceAnswer?: string | string[];
  options?: Option[];
  userAnswer: string | string[];
}

export interface AiGradeResult {
  questionId: string;
  score: number;
  feedback?: string;
}

export interface AiGradeResponse {
  model?: string;
  results: AiGradeResult[];
}

export interface AiHealthResponse {
  ok: boolean;
  hasConfig: boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const checkAiHealth = async (options?: { signal?: AbortSignal }): Promise<AiHealthResponse> => {
  let res: Response;
  try {
    res = await fetch('/api/ai/health', { method: 'GET', signal: options?.signal });
  } catch {
    throw new Error('无法连接 AI 服务：请先运行 pnpm ai:server');
  }

  const raw = await res.text();
  const parsed = (() => {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return null;
    }
  })();

  if (!res.ok) {
    if (res.status >= 500 && raw.trim() === '') {
      throw new Error('无法连接 AI 服务：请先运行 pnpm ai:server，并确认端口为 8787');
    }
    if (typeof raw === 'string' && /ECONNREFUSED|socket hang up|connect ECONNREFUSED/i.test(raw)) {
      throw new Error('无法连接 AI 服务：请先运行 pnpm ai:server，并确认端口为 8787');
    }
    const msg =
      isRecord(parsed) && typeof parsed.error === 'string'
        ? parsed.error
        : `AI 健康检查失败（HTTP ${res.status}）`;
    throw new Error(msg);
  }

  const hasConfig = isRecord(parsed) && typeof parsed.hasConfig === 'boolean' ? parsed.hasConfig : false;
  return { ok: true, hasConfig };
};

export const requestAiGrades = async (
  items: AiGradeItem[],
  options?: { model?: string; signal?: AbortSignal },
): Promise<AiGradeResponse> => {
  const res = await fetch('/api/ai/grade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, model: options?.model }),
    signal: options?.signal,
  });

  const raw = await res.text();
  const parsed = (() => {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return null;
    }
  })();

  if (!res.ok) {
    if (res.status >= 500 && raw.trim() === '') {
      throw new Error('无法连接 AI 服务：请先运行 pnpm ai:server，并确认端口为 8787');
    }
    const message =
      isRecord(parsed) && typeof parsed.error === 'string'
        ? parsed.error
        : `AI 服务请求失败（HTTP ${res.status}）`;
    throw new Error(message);
  }

  if (!isRecord(parsed) || !Array.isArray(parsed.results)) {
    throw new Error('AI 服务返回格式不正确');
  }

  const results: AiGradeResult[] = [];
  for (const item of parsed.results) {
    if (!isRecord(item)) continue;
    if (typeof item.questionId !== 'string' || item.questionId.trim() === '') continue;
    if (typeof item.score !== 'number' || !Number.isFinite(item.score)) continue;

    results.push({
      questionId: item.questionId,
      score: item.score,
      feedback: typeof item.feedback === 'string' ? item.feedback : undefined,
    });
  }

  return {
    model: typeof parsed.model === 'string' ? parsed.model : undefined,
    results,
  };
};
