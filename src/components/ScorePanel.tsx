import { Card, Progress, Space, Button, Typography, message } from 'antd';
import { useMemo } from 'react';
import { useExamStore } from '../store/examStore';
import { calculateExamStats } from '../utils/grading';

const { Text } = Typography;

export default function ScorePanel() {
  const { examPaper, answers, submitted, answeredCount, submit, reset, gradeWithAI, aiGradingStatus } = useExamStore();

  const stats = useMemo(() => {
    if (!examPaper) return null;
    return calculateExamStats(examPaper, answers);
  }, [examPaper, answers]);

  if (!examPaper || !stats) return null;
  const answeredPercentage = Math.round((answeredCount / stats.totalQuestions) * 100);
  const hasAiGraded = Object.values(answers).some((a) => a.aiGrade);

  return (
    <Card className="!rounded-xl !border-gray-200 shadow-sm sticky top-20">
      <div className="space-y-4">
        <div className="text-center">
          <Text type="secondary" className="text-sm">试卷总分</Text>
          <div className="text-4xl font-bold text-blue-600">
            {examPaper.examMeta.totalScore}
            <span className="text-lg text-gray-400 font-normal">分</span>
          </div>
          {stats.pendingQuestions > 0 && (
            <div className="mt-1 text-xs text-gray-500">
              可自动判分 {stats.autoTotalScore} 分 · {stats.pendingQuestions} 题待评分
            </div>
          )}
        </div>

        {submitted ? (
          <div className="text-center space-y-4">
            <div>
              <Text type="secondary" className="text-sm">你的得分</Text>
              <div className="text-3xl font-bold text-green-600">
                {stats.currentScore}
                <span className="text-lg text-gray-400 font-normal">分</span>
              </div>
              <Progress
                percent={Math.round((stats.currentScore / examPaper.examMeta.totalScore) * 100)}
                strokeColor="#22c55e"
                showInfo
                className="mt-2"
              />
            </div>
            {(stats.pendingQuestions > 0 || hasAiGraded) && (
              <Button
                onClick={async () => {
                  try {
                    const regrade = stats.pendingQuestions === 0;
                    const { graded } = await gradeWithAI({ regrade });
                    if (graded <= 0) message.info('没有需要 AI 批改的题目');
                    else message.success(`AI 已批改 ${graded} 题`);
                  } catch (err) {
                    const msg = err instanceof Error ? err.message : 'AI 批改失败';
                    message.error(msg);
                  }
                }}
                loading={aiGradingStatus === 'grading'}
                className="!rounded-lg"
                block
              >
                {stats.pendingQuestions > 0 ? 'AI 批改待评分题' : 'AI 重新批改'}
              </Button>
            )}
            <Button
              type="primary"
              onClick={reset}
              className="!rounded-lg"
              block
            >
              重新作答
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <Text type="secondary" className="text-sm">当前得分（自动判分）</Text>
              <div className="text-2xl font-bold text-blue-600">
                {stats.currentScore}
                <span className="text-base text-gray-400 font-normal">分</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <Text type="secondary">答题进度</Text>
                <Text>{answeredCount} / {stats.totalQuestions}</Text>
              </div>
              <Progress percent={answeredPercentage} strokeColor="#3b82f6" />
            </div>
            <Button
              type="primary"
              onClick={submit}
              className="!rounded-lg !bg-blue-600 hover:!bg-blue-700"
              block
              size="large"
            >
              提交试卷
            </Button>
          </div>
        )}

        <div className="pt-4 border-t border-gray-100">
          <Space className="w-full justify-between text-sm">
            <Text type="secondary">考试时长</Text>
            <Text>{examPaper.examMeta.duration} 分钟</Text>
          </Space>
        </div>
      </div>
    </Card>
  );
}
