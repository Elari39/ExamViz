import { Checkbox } from 'antd';
import type { Question } from '../../types/exam';
import MarkdownContent from '../MarkdownContent';

interface Props {
  question: Question;
  value?: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

export default function MultipleChoice({ question, value = [], onChange, disabled }: Props) {
  const handleChange = (checkedValues: string[]) => {
    onChange(checkedValues);
  };

  return (
    <Checkbox.Group
      value={value}
      onChange={handleChange}
      disabled={disabled}
      className="w-full"
    >
      <div className="flex flex-col gap-3">
        {question.options?.map((option) => (
          <Checkbox
            key={option.label}
            value={option.label}
            className={`
              !px-4 !py-3 !rounded-lg !border !border-gray-200
              hover:!border-blue-400 hover:!bg-blue-50
              transition-all duration-200
              ${value.includes(option.label) ? '!border-blue-500 !bg-blue-50' : ''}
            `}
          >
            <span className="font-medium text-gray-700">
              <span className="mr-1">{option.label}.</span>
              <MarkdownContent content={option.value} enableMath={question.isLatex} inline />
            </span>
          </Checkbox>
        ))}
      </div>
    </Checkbox.Group>
  );
}
