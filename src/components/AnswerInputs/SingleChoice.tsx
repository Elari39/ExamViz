import { Radio } from 'antd';
import type { Question } from '../../types/exam';

interface Props {
  question: Question;
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function SingleChoice({ question, value, onChange, disabled }: Props) {
  return (
    <Radio.Group
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full"
    >
      <div className="flex flex-col gap-3">
        {question.options?.map((option) => (
          <Radio
            key={option.label}
            value={option.label}
            className={`
              !px-4 !py-3 !rounded-lg !border !border-gray-200
              hover:!border-blue-400 hover:!bg-blue-50
              transition-all duration-200
              ${value === option.label ? '!border-blue-500 !bg-blue-50' : ''}
            `}
          >
            <span className="font-medium text-gray-700">
              {option.label}. {option.value}
            </span>
          </Radio>
        ))}
      </div>
    </Radio.Group>
  );
}
