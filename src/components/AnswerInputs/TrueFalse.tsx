import { Radio } from 'antd';
import type { Question } from '../../types/exam';

interface Props {
  question: Question;
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function TrueFalse({ question, value, onChange, disabled }: Props) {
  const options = question.options?.length === 2
    ? question.options
    : [
        { label: 'True', value: '正确' },
        { label: 'False', value: '错误' },
      ];

  return (
    <Radio.Group
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full"
    >
      <div className="flex gap-4">
        {options.map((option) => (
          <Radio
            key={option.label}
            value={option.label}
            className={`
              !px-6 !py-4 !rounded-lg !border !border-gray-200
              hover:!border-blue-400 hover:!bg-blue-50
              transition-all duration-200
              ${value === option.label ? '!border-blue-500 !bg-blue-50' : ''}
            `}
          >
            <span className="font-medium text-gray-700 text-lg">
              {option.value}
            </span>
          </Radio>
        ))}
      </div>
    </Radio.Group>
  );
}
