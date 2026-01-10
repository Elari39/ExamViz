import TextArea from 'antd/es/input/TextArea';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Question } from '../../types/exam';

interface Props {
  question: Question;
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  showReferenceAnswer?: boolean;
}

export default function CodeQuestion({ question, value, onChange, disabled, showReferenceAnswer }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-gray-600 font-medium">
          请输入代码：
        </label>
        <TextArea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={8}
          placeholder={question.defaultCode || '// 请在此处输入代码...'}
          className="!rounded-lg !border-gray-200 font-mono text-sm focus:!border-blue-500 focus:!ring-2 focus:!ring-blue-200"
        />
      </div>

      {showReferenceAnswer && question.correctAnswer && (
        <div className="space-y-2">
          <label className="block text-gray-600 font-medium">
            参考答案：
          </label>
          <div className="rounded-lg overflow-hidden border border-gray-200">
            <SyntaxHighlighter
              language={question.codeLanguage || 'python'}
              style={oneLight}
              customStyle={{ margin: 0, padding: '16px', fontSize: '14px' }}
            >
              {String(question.correctAnswer)}
            </SyntaxHighlighter>
          </div>
        </div>
      )}
    </div>
  );
}
