import { useEffect, useMemo, useRef, useState } from 'react';
import { Layout, Typography, Button, Drawer, message, Modal, Progress } from 'antd';
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
import { clearPersistedExamPaper, loadPersistedExamPaper, savePersistedExamPaper } from '../utils/persistence';
import { assertExamPaper, ExamPaperValidationError } from '../utils/validateExamPaper';

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

  const answeredPercentage = useMemo(() => {
    if (!stats) return 0;
    if (stats.totalQuestions <= 0) return 0;
    return Math.round((answeredCount / stats.totalQuestions) * 100);
  }, [stats, answeredCount]);

  useEffect(() => {
    const persisted = loadPersistedExamPaper();
    if (persisted) {
      setExamPaper(persisted.paper);
      return;
    }

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
              <div className="hidden md:flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-200 md:px-2 md:py-1 lg:px-3 lg:py-2">
                <div className="flex flex-col leading-none">
                  <Text type="secondary" className="text-[11px]">
                    自动得分
                  </Text>
                  <div className="text-base font-semibold text-blue-600 tabular-nums">
                    {stats.currentScore}
                    <span className="text-xs font-normal text-gray-500">
                      {' '}
                      / {stats.autoTotalScore}
                    </span>
                  </div>
                </div>

                <div className="w-px h-9 bg-gray-200" />

                <div className="flex flex-col leading-none">
                  <Text type="secondary" className="text-[11px]">
                    已答
                  </Text>
                  <div className="text-base font-semibold text-gray-700 tabular-nums">
                    {answeredCount}
                    <span className="text-xs font-normal text-gray-500">
                      {' '}
                      / {stats.totalQuestions}
                    </span>
                  </div>
                </div>

                <div className="hidden lg:block w-28">
                  <Progress
                    percent={answeredPercentage}
                    size="small"
                    showInfo={false}
                    strokeColor="#3b82f6"
                  />
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
            <Button
              type="default"
              onClick={() => {
                Modal.confirm({
                  title: '恢复示例试卷',
                  content: '这将清除已保存的本地 JSON，并重新加载内置示例试卷。',
                  okText: '恢复',
                  cancelText: '取消',
                  onOk: () => {
                    clearPersistedExamPaper();
                    setExamPaper(ML1 as ExamPaperType);
                    message.success('已恢复示例试卷');
                  },
                });
              }}
              className="!rounded-lg"
            >
              恢复示例
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
                  const normalized = text.replace(/^\uFEFF/, '');
                  const parsed = JSON.parse(normalized) as unknown;
                  const paper = assertExamPaper(parsed);

                  setExamPaper(paper);
                  try {
                    savePersistedExamPaper(paper);
                    message.success(`已加载并保存：${paper.examMeta.title}`);
                  } catch {
                    message.warning(`已加载：${paper.examMeta.title}（保存到本地失败）`);
                  }
                } catch (err) {
                  if (err instanceof ExamPaperValidationError) {
                    Modal.error({
                      title: '导入失败：JSON 结构不符合规则',
                      width: 720,
                      content: (
                        <div className="space-y-2">
                          <div className="text-gray-700">
                            请参考 <span className="font-mono">docs/EXAM_JSON_RULES.md</span> 修正以下问题：
                          </div>
                          <ul className="list-disc pl-5 space-y-1">
                            {err.issues.slice(0, 10).map((issue, index) => (
                              <li key={index}>
                                <span className="font-mono">{issue.path}</span>：{issue.message}
                              </li>
                            ))}
                          </ul>
                          {err.issues.length > 10 && (
                            <div className="text-xs text-gray-500">…… 还有 {err.issues.length - 10} 项</div>
                          )}
                        </div>
                      ),
                    });
                    return;
                  }

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
