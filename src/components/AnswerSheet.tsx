import { Card, Typography, Tooltip } from 'antd';
import { useExamStore } from '../store/examStore';
import { gradeQuestion, isEmptyAnswer } from '../utils/grading';

const { Text } = Typography;

interface Props {
  onJump?: () => void;
}

export default function AnswerSheet({ onJump }: Props) {
  const { examPaper, answers, submitted, currentSectionIndex, currentQuestionIndex, setCurrentQuestion } = useExamStore();

  if (!examPaper) return null;

  const handleJump = (sectionIndex: number, questionIndex: number) => {
    setCurrentQuestion(sectionIndex, questionIndex);
    onJump?.();
  };

  const isAnswered = (questionId: string) => {
    const answer = answers[questionId];
    return answer ? !isEmptyAnswer(answer.answer) : false;
  };

  return (
    <Card
      title="答题卡"
      className="!rounded-xl !border-gray-200 shadow-sm sticky top-4"
      bodyStyle={{ padding: '16px' }}
    >
      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        {examPaper.sections.map((section, sectionIndex) => (
          <div key={section.id}>
            <Text strong className="text-sm text-gray-600 block mb-2">
              {section.title}
            </Text>
            <div className="flex flex-wrap gap-2">
              {section.questions.map((question, questionIndex) => {
                const answered = isAnswered(question.id);
                const isCurrent = sectionIndex === currentSectionIndex && questionIndex === currentQuestionIndex;
                const grade = submitted ? gradeQuestion(question, answers[question.id]?.answer) : null;
                const isCorrect = grade?.state === 'correct';
                const isPartial = grade?.state === 'partial';
                const isPending = grade?.state === 'pending';
                const isWrong = answered && (grade?.state === 'wrong' || grade?.state === 'unanswered');

                const tooltipTitle = (() => {
                  if (!answered) return `第 ${question.idx} 题（未作答）`;
                  if (!submitted) return `第 ${question.idx} 题（已作答）`;
                  if (isPending) return `第 ${question.idx} 题（待评分）`;
                  if (isPartial) return `第 ${question.idx} 题（部分正确）`;
                  return `第 ${question.idx} 题（${isCorrect ? '正确' : '错误'}）`;
                })();

                let bgColor = 'bg-white border-gray-200';
                if (isCurrent) bgColor = 'bg-blue-500 border-blue-500 text-white';
                else if (submitted && isCorrect) bgColor = 'bg-green-100 border-green-500 text-green-700';
                else if (submitted && isPartial) bgColor = 'bg-amber-100 border-amber-500 text-amber-700';
                else if (submitted && isPending) bgColor = 'bg-gray-100 border-gray-400 text-gray-700';
                else if (submitted && isWrong) bgColor = 'bg-red-100 border-red-500 text-red-700';
                else if (answered) bgColor = 'bg-blue-100 border-blue-500 text-blue-700';

                return (
                  <Tooltip
                    key={question.id}
                    title={tooltipTitle}
                  >
                    <button
                      onClick={() => handleJump(sectionIndex, questionIndex)}
                      className={`
                        w-8 h-8 rounded-lg border-2 text-sm font-medium transition-all duration-200
                        ${bgColor}
                        hover:shadow-md hover:scale-105
                      `}
                    >
                      {question.idx}
                    </button>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 flex gap-4 text-xs text-gray-500 justify-center">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-white border-2 border-gray-200"></div>
          <span>未作答</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-blue-100 border-2 border-blue-500"></div>
          <span>已作答</span>
        </div>
        {submitted && (
          <>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-green-100 border-2 border-green-500"></div>
              <span>正确</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-amber-100 border-2 border-amber-500"></div>
              <span>部分正确</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-gray-100 border-2 border-gray-400"></div>
              <span>待评分</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-red-100 border-2 border-red-500"></div>
              <span>错误</span>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
