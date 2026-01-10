import { Input } from 'antd';
import type { Question } from '../../types/exam';

interface Props {
  question: Question;
  value?: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

export default function FillInBlank({ question, value = [], onChange, disabled }: Props) {
  const blankCount = Array.isArray(question.correctAnswer)
    ? question.correctAnswer.length
    : question.content.split('___').length - 1;

  const handleChange = (index: number, inputValue: string) => {
    const newValue = [...(value.length > 0 ? value : Array(blankCount).fill(''))];
    newValue[index] = inputValue;
    onChange(newValue);
  };

  return (
    <div className="flex flex-wrap gap-4 items-center">
      <span className="text-gray-600">答案：</span>
      {Array.from({ length: blankCount }).map((_, index) => (
        <Input
          key={index}
          value={value?.[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          disabled={disabled}
          placeholder={`填空 ${index + 1}`}
          className="!w-40 !rounded-lg"
        />
      ))}
    </div>
  );
}
