import TextArea from 'antd/es/input/TextArea';
import type { Question } from '../../types/exam';

interface Props {
  question: Question;
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function ShortAnswer({ value, onChange, disabled }: Props) {
  return (
    <div className="space-y-2">
      <label className="block text-gray-600 font-medium">
        请输入答案：
      </label>
      <TextArea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={6}
        placeholder="请在此处输入你的答案..."
        className="!rounded-lg !border-gray-200 focus:!border-blue-500 focus:!ring-2 focus:!ring-blue-200"
      />
    </div>
  );
}
