import { Card, Tag, Space, Alert } from 'antd';
import type { Question } from '../types/exam';
import { SingleChoice, MultipleChoice, TrueFalse, FillInBlank, ShortAnswer, CodeQuestion } from './AnswerInputs';
import { useExamStore } from '../store/examStore';
import MarkdownContent from './MarkdownContent';
import { gradeQuestion } from '../utils/grading';

interface Props {
  question: Question;
}

const formatChoiceLabels = (question: Question, labels: string[]) => {
  const labelToValue = new Map(
    (question.options || []).map((opt) => [opt.label.trim().toUpperCase(), opt.value]),
  );

  return labels
    .map((label) => {
      const normalized = label.trim().toUpperCase();
      const value = labelToValue.get(normalized);
      return value ? `${label}. ${value}` : label;
    })
    .join(', ');
};

export default function QuestionCard({ question }: Props) {
  const { answers, setAnswer, submitted } = useExamStore();
  const userAnswer = answers[question.id];
  const grade = gradeQuestion(question, userAnswer);

  const renderAnswerInput = () => {
    switch (question.type) {
      case 'single_choice':
        return (
          <SingleChoice
            question={question}
            disabled={submitted}
            value={typeof userAnswer?.answer === 'string' ? userAnswer.answer : undefined}
            onChange={(value) => setAnswer(question.id, value)}
          />
        );
      case 'multiple_choice':
        return (
          <MultipleChoice
            question={question}
            disabled={submitted}
            value={Array.isArray(userAnswer?.answer) ? userAnswer.answer.map(String) : []}
            onChange={(value) => setAnswer(question.id, value)}
          />
        );
      case 'true_false':
        return (
          <TrueFalse
            question={question}
            disabled={submitted}
            value={typeof userAnswer?.answer === 'string' ? userAnswer.answer : undefined}
            onChange={(value) => setAnswer(question.id, value)}
          />
        );
      case 'fill_in_blank':
        return (
          <FillInBlank
            question={question}
            disabled={submitted}
            value={Array.isArray(userAnswer?.answer) ? userAnswer.answer.map(String) : []}
            onChange={(value) => setAnswer(question.id, value)}
          />
        );
      case 'short_answer':
      case 'calculation':
        return (
          <ShortAnswer
            question={question}
            disabled={submitted}
            value={typeof userAnswer?.answer === 'string' ? userAnswer.answer : undefined}
            onChange={(value) => setAnswer(question.id, value)}
          />
        );
      case 'coding':
        return (
          <CodeQuestion
            question={question}
            disabled={submitted}
            value={typeof userAnswer?.answer === 'string' ? userAnswer.answer : undefined}
            onChange={(value) => setAnswer(question.id, value)}
            showReferenceAnswer={submitted}
          />
        );
      default:
        return <div className="text-gray-500">未知题型</div>;
    }
  };

  const renderAnalysis = () => {
    if (!submitted) return null;

    let type: 'success' | 'warning' | 'error' | 'info';
    let title: string;

    switch (grade.state) {
      case 'correct':
        type = 'success';
        title = '回答正确';
        break;
      case 'partial':
        type = 'warning';
        title = '部分正确';
        break;
      case 'pending':
        type = 'info';
        title = '待人工评分';
        break;
      case 'unanswered':
      case 'wrong':
      default:
        type = 'error';
        title = grade.state === 'unanswered' ? '未作答' : '回答错误';
        break;
    }

    const correctAnswerText = (() => {
      if (question.type === 'single_choice' || question.type === 'true_false') {
        return formatChoiceLabels(question, [String(question.correctAnswer)]);
      }
      if (question.type === 'multiple_choice') {
        const labels = Array.isArray(question.correctAnswer)
          ? question.correctAnswer.map(String)
          : [String(question.correctAnswer)];
        return formatChoiceLabels(question, labels);
      }
      if (Array.isArray(question.correctAnswer)) return question.correctAnswer.join(' | ');
      return String(question.correctAnswer);
    })();

    return (
      <div className="mt-4 pt-4 border-t border-gray-200">
        <Alert
          type={type}
          title={
            <Space>
              <span className="font-medium">{title}</span>
              {grade.state === 'pending' ? (
                <Tag color="default">待评分</Tag>
              ) : (
                <Tag color={grade.state === 'correct' ? 'green' : grade.state === 'partial' ? 'orange' : 'red'}>
                  +{grade.score} 分
                </Tag>
              )}
            </Space>
          }
          description={
            <div className="mt-3 space-y-2">
              {question.type !== 'coding' && (
                <div>
                  <span className="font-medium text-gray-700">正确答案：</span>
                  <span className="text-gray-600 whitespace-pre-wrap break-words">{correctAnswerText}</span>
                </div>
              )}
              {userAnswer?.aiGrade?.feedback && (
                <div>
                  <span className="font-medium text-gray-700">AI 评语：</span>
                  <span className="text-gray-600 whitespace-pre-wrap break-words">{userAnswer.aiGrade.feedback}</span>
                </div>
              )}
              {question.analysis && (
                <div>
                  <span className="font-medium text-gray-700">解析：</span>
                  <span className="text-gray-600 whitespace-pre-wrap break-words">{question.analysis}</span>
                </div>
              )}
            </div>
          }
          showIcon
        />
      </div>
    );
  };

  return (
    <Card
      className="!rounded-xl !border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
      styles={{ body: { padding: '24px' } }}
    >
      <div className="flex items-start gap-4 mb-4">
        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm">
          {question.idx}
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Tag color="blue">{question.score}分</Tag>
            <Tag color={
              question.type === 'single_choice' ? 'green' :
              question.type === 'multiple_choice' ? 'purple' :
              question.type === 'fill_in_blank' ? 'orange' :
              question.type === 'coding' ? 'cyan' : 'default'
            }>
              {{
                'single_choice': '单选题',
                'multiple_choice': '多选题',
                'true_false': '判断题',
                'fill_in_blank': '填空题',
                'short_answer': '简答题',
                'calculation': '计算题',
                'coding': '编程题',
              }[question.type]}
            </Tag>
          </div>
          <div className="text-gray-800 text-lg leading-relaxed">
            <MarkdownContent content={question.content} enableMath={Boolean(question.isLatex)} />
          </div>
        </div>
      </div>

      <div className="ml-12">
        {renderAnswerInput()}
        {renderAnalysis()}
      </div>
    </Card>
  );
}
