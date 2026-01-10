import { Button, Space } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useMemo } from 'react';
import { useExamStore } from '../store/examStore';
import { calculateExamStats } from '../utils/grading';

export default function Navigation() {
  const {
    examPaper,
    answers,
    answeredCount,
    submitted,
    submit,
    reset,
    currentSectionIndex,
    currentQuestionIndex,
    nextQuestion,
    prevQuestion,
  } = useExamStore();

  const stats = useMemo(() => {
    if (!examPaper) return null;
    return calculateExamStats(examPaper, answers);
  }, [examPaper, answers]);

  if (!examPaper || !stats) return null;
  const sections = examPaper.sections;
  const isFirst = currentSectionIndex === 0 && currentQuestionIndex === 0;
  const isLast =
    currentSectionIndex === sections.length - 1 &&
    currentQuestionIndex === sections[currentSectionIndex].questions.length - 1;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg py-4 px-6 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="text-gray-600">
          <span className="font-medium">
            {sections[currentSectionIndex].title}
          </span>
          <span className="mx-2">·</span>
          <span>第 {sections[currentSectionIndex].questions[currentQuestionIndex].idx} 题</span>
          <span className="ml-3 text-xs text-gray-500 hidden sm:inline">
            当前得分 {stats.currentScore} / {stats.autoTotalScore} · 进度 {answeredCount} / {stats.totalQuestions}
          </span>
        </div>

        <Space size="large">
          {submitted ? (
            <Button onClick={reset} className="!rounded-lg">
              重新作答
            </Button>
          ) : (
            <Button onClick={submit} className="!rounded-lg">
              提交
            </Button>
          )}
          <Button
            onClick={prevQuestion}
            disabled={isFirst}
            icon={<LeftOutlined />}
            className="!rounded-lg"
          >
            上一题
          </Button>
          <Button
            type="primary"
            onClick={nextQuestion}
            disabled={isLast}
            className="!rounded-lg !bg-blue-600 hover:!bg-blue-700"
          >
            <span className="inline-flex items-center gap-2">
              下一题 <RightOutlined />
            </span>
          </Button>
        </Space>
      </div>
    </div>
  );
}
