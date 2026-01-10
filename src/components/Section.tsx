import { Collapse, Typography } from 'antd';
import type { Section as SectionType } from '../types/exam';
import QuestionCard from './QuestionCard';

interface Props {
  section: SectionType;
}

const { Title, Text } = Typography;

export default function Section({ section }: Props) {
  const items = [
    {
      key: section.id,
      label: (
        <div className="py-2">
          <Title level={4} className="!mb-1 !text-lg">
            {section.title}
          </Title>
          {section.description && (
            <Text type="secondary" className="text-sm">
              {section.description}
            </Text>
          )}
        </div>
      ),
      children: (
        <div className="space-y-4 pt-4">
          {section.questions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
            />
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="mb-6">
      <Collapse
        items={items}
        defaultActiveKey={[section.id]}
        bordered={false}
        className="!bg-transparent"
        expandIconPlacement="end"
      />
    </div>
  );
}
