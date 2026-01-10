import { useEffect, useMemo, useRef, useState } from 'react';
import { Layout, Typography, Button, Drawer, message } from 'antd';
import { AppstoreOutlined, UnorderedListOutlined, FileTextOutlined } from '@ant-design/icons';
import { useExamStore } from '../store/examStore';
import type { ExamPaper as ExamPaperType } from '../types/exam';
import Section from './Section';
import QuestionCard from './QuestionCard';
import ScorePanel from './ScorePanel';
import AnswerSheet from './AnswerSheet';
import Navigation from './Navigation';
import ML1 from '../assets/ML1.json';
import { calculateExamStats } from '../utils/grading';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function ExamPaper() {
  const {
    examPaper,
    setExamPaper,
    answers,
    viewMode,
    setViewMode,
    currentSectionIndex,
    currentQuestionIndex,
    answeredCount,
  } = useExamStore();

  const [answerSheetOpen, setAnswerSheetOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stats = useMemo(() => {
    if (!examPaper) return null;
    return calculateExamStats(examPaper, answers);
  }, [examPaper, answers]);

  useEffect(() => {
    setExamPaper(ML1 as ExamPaperType);
  }, [setExamPaper]);

  if (!examPaper) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <Text type="secondary">加载试卷中...</Text>
        </div>
      </div>
    );
  }

  const renderFullMode = () => (
    <div className="space-y-6">
      {examPaper.sections.map((section) => (
        <Section key={section.id} section={section} />
      ))}
    </div>
  );

  const renderSingleMode = () => {
    const currentSection = examPaper.sections[currentSectionIndex];
    const currentQuestion = currentSection?.questions[currentQuestionIndex];

    if (!currentQuestion) return null;

    return (
      <div className="max-w-4xl mx-auto">
        <QuestionCard
          question={currentQuestion}
        />
      </div>
    );
  };

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Header className="bg-white border-b border-gray-200 px-6 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <FileTextOutlined className="text-2xl text-blue-600" />
            <div>
              <Title level={4} className="!mb-0 !text-lg">
                {examPaper.examMeta.title}
              </Title>
              <Text type="secondary" className="text-xs">
                满分 {examPaper.examMeta.totalScore} 分 · {examPaper.examMeta.duration} 分钟
              </Text>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {stats && (
              <div className="hidden md:flex items-center gap-3 text-right">
                <div>
                  <Text type="secondary" className="text-xs">当前得分</Text>
                  <div className="text-sm font-semibold text-blue-600">
                    {stats.currentScore} / {stats.autoTotalScore}
                  </div>
                </div>
                <div className="w-px h-8 bg-gray-200" />
                <div>
                  <Text type="secondary" className="text-xs">进度</Text>
                  <div className="text-sm font-semibold text-gray-700">
                    {answeredCount} / {stats.totalQuestions}
                  </div>
                </div>
              </div>
            )}

            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                type={viewMode === 'full' ? 'primary' : 'text'}
                icon={<UnorderedListOutlined />}
                onClick={() => setViewMode('full')}
                className={viewMode === 'full' ? '!rounded-md' : '!rounded-md'}
                size="small"
              >
                整卷模式
              </Button>
              <Button
                type={viewMode === 'single' ? 'primary' : 'text'}
                icon={<AppstoreOutlined />}
                onClick={() => setViewMode('single')}
                className={viewMode === 'single' ? '!rounded-md' : '!rounded-md'}
                size="small"
              >
                逐题模式
              </Button>
            </div>

            <Button
              type="default"
              onClick={() => fileInputRef.current?.click()}
              className="!rounded-lg"
            >
              加载 JSON
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;

                try {
                  const text = await file.text();
                  const data = JSON.parse(text) as ExamPaperType;

                  if (!data?.examMeta?.title || !Array.isArray(data?.sections)) {
                    throw new Error('JSON 结构不符合 README 定义');
                  }

                  setExamPaper(data);
                  message.success(`已加载：${data.examMeta.title}`);
                } catch (err) {
                  const msg = err instanceof Error ? err.message : '解析失败';
                  message.error(msg);
                }
              }}
            />

            {viewMode === 'single' && (
              <Button
                type="default"
                onClick={() => setAnswerSheetOpen(true)}
                className="!rounded-lg"
              >
                答题卡
              </Button>
            )}
          </div>
        </div>
      </Header>

      <Content className="p-6 pb-24">
        <div className="max-w-7xl mx-auto">
          {viewMode === 'full' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                {renderFullMode()}
              </div>
              <div className="lg:col-span-1">
                <ScorePanel />
              </div>
            </div>
          ) : (
            <div className="relative">
              {renderSingleMode()}
              <Navigation />
            </div>
          )}
        </div>
      </Content>

      <Drawer
        title="答题卡"
        placement="right"
        onClose={() => setAnswerSheetOpen(false)}
        open={answerSheetOpen}
        size={360}
        styles={{ body: { padding: '16px' } }}
      >
        <AnswerSheet onJump={() => setAnswerSheetOpen(false)} />
      </Drawer>
    </Layout>
  );
}
