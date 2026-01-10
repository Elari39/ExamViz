# JSON2Test 试卷 JSON 规则（导入/生成指南）

本文档用于指导你把「原始试卷 + 标准答案/解析」整理成 **JSON2Test 可导入**的 JSON 文件，从而在页面中渲染为可视化试卷并支持作答/判分。

> 建议：使用 UTF-8 编码保存 `*.json` 文件；导入后项目会对结构进行校验，只有**满足规则**的 JSON 才会被持久化保存到本地（浏览器 localStorage）。

---

## 1. 文件与编码要求

- 文件后缀：`.json`
- 编码：**UTF-8**
- 顶层必须包含：`examMeta`、`sections`

---

## 2. 顶层结构（必填）

```json
{
  "examMeta": {
    "id": "EXAM_001",
    "title": "示例试卷",
    "totalScore": 100,
    "duration": 120,
    "createTime": "2026-01-10T00:00:00Z",
    "description": "试卷说明"
  },
  "sections": []
}
```

### `examMeta` 字段说明

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | string | 是 | 试卷唯一标识 |
| `title` | string | 是 | 试卷标题（页面顶部展示） |
| `totalScore` | number | 是 | 试卷总分（展示用；自动得分可能小于该值，见判分规则） |
| `duration` | number | 是 | 考试时长（分钟） |
| `createTime` | string | 是 | 创建时间（建议 ISO 字符串） |
| `description` | string | 是 | 试卷描述（可为空字符串） |

---

## 3. Sections（章节/大题）

`sections` 是数组，每个 section 表示一个大题或章节。

```json
{
  "id": "SEC_01",
  "title": "一、单项选择题",
  "description": "共 5 题，每题 2 分",
  "type": "single_choice",
  "questions": []
}
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | string | 是 | 章节唯一标识 |
| `title` | string | 是 | 章节标题 |
| `description` | string | 是 | 章节描述（可为空字符串） |
| `type` | string | 是 | 章节类型（当前主要用于展示，你可以自定义） |
| `questions` | array | 是 | 题目数组 |

---

## 4. Questions（题目）

每道题必须包含以下基础字段：

```json
{
  "id": "Q_01",
  "idx": 1,
  "score": 2,
  "type": "single_choice",
  "content": "题干文本",
  "correctAnswer": "A",
  "analysis": "解析文本"
}
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | string | 是 | 题目唯一标识（用于存储用户作答） |
| `idx` | number | 是 | 展示序号（建议从 1 开始递增） |
| `score` | number | 是 | 分值（可为 0，但必须是数字） |
| `type` | string | 是 | 题型（见下方题型枚举） |
| `content` | string | 是 | 题干内容（支持换行） |
| `options` | array | 视题型 | 选择题/判断题选项 |
| `correctAnswer` | string\|array | 是 | 正确/参考答案（与题型强相关） |
| `analysis` | string | 是 | 解析（提交后展示，可为空字符串） |
| `isLatex` | boolean | 否 | `true` 时用 LaTeX 渲染 `content` |
| `codeLanguage` | string | 否 | 编程题参考答案高亮语言（如 `python`） |
| `defaultCode` | string | 否 | 编程题输入框占位/初始代码提示 |

### 题型枚举 `type`

- `single_choice`：单选题
- `multiple_choice`：多选题
- `true_false`：判断题
- `fill_in_blank`：填空题
- `short_answer`：简答题（主观题）
- `calculation`：计算题（主观题）
- `coding`：编程题

---

## 5. 各题型数据规范（重点）

### A) 单选题 `single_choice`

- 必须提供 `options`（至少 2 个）
- `correctAnswer`：**选项 label**（例如 `"A"`）

```json
{
  "type": "single_choice",
  "options": [
    { "label": "A", "value": "选项 A" },
    { "label": "B", "value": "选项 B" }
  ],
  "correctAnswer": "A"
}
```

### B) 多选题 `multiple_choice`

- 必须提供 `options`（至少 2 个）
- `correctAnswer`：建议为 `["A","C"]`（选项 label 数组）
- 判分策略：**含错项=0 分；部分对=按比例给分；全对=满分**

```json
{
  "type": "multiple_choice",
  "options": [
    { "label": "A", "value": "..." },
    { "label": "B", "value": "..." },
    { "label": "C", "value": "..." }
  ],
  "correctAnswer": ["A", "C"]
}
```

### C) 判断题 `true_false`

- `options` 可省略；省略时页面默认提供 True/False
- `correctAnswer`：`"True"` 或 `"False"`（label）

```json
{
  "type": "true_false",
  "correctAnswer": "True"
}
```

### D) 填空题 `fill_in_blank`

- `correctAnswer`：字符串数组，按空位顺序排列，例如 `["100","10"]`
- 空位数量的确定规则：
  1) 若 `correctAnswer` 是数组：空位数 = `correctAnswer.length`
  2) 否则：会尝试在 `content` 中按 `___` 统计空位数

```json
{
  "type": "fill_in_blank",
  "content": "id 选择器权重是 ___，类选择器权重是 ___。",
  "correctAnswer": ["100", "10"]
}
```

### E) 简答题 `short_answer` / 计算题 `calculation`

- `correctAnswer`：参考答案文本（字符串）
- 当前实现：导入后可以作答，但提交后显示为 **待评分**（不会自动计分）

```json
{
  "type": "short_answer",
  "correctAnswer": "参考要点：……"
}
```

### F) 编程题 `coding`

- `correctAnswer`：参考代码（字符串）
- `codeLanguage`：参考答案高亮语言（可选）
- `defaultCode`：输入提示/模板（可选）
- 当前实现：若 `correctAnswer` 为空字符串，会显示为 **待评分**；否则采用“规范化后的文本对比”自动判分

```json
{
  "type": "coding",
  "defaultCode": "def add(a, b):\\n    # TODO\\n    pass\\n",
  "codeLanguage": "python",
  "correctAnswer": "def add(a, b):\\n    return a + b\\n"
}
```

---
