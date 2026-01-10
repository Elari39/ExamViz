设计一个通用的试卷 JSON 数据结构是开发可视化答题系统的核心。这个结构需要既能兼容客观题（机器可自动判分），也能兼容主观题（通常需要人工或关键词判分，但在前端模拟中可以展示参考答案）。

以下我为你设计的一套 **标准试卷 JSON 数据协议**。它采用了分层结构：**试卷元数据 (Meta) -> 大题章节 (Sections) -> 具体题目 (Questions)**。

### 1. JSON 数据结构设计

这份 JSON 涵盖了你提到的所有题型（单选、多选、判断、填空、简答、计算、代码），并预留了扩展字段。

```json
{
  "examMeta": {
    "id": "EXAM_2023_001",
    "title": "2024年全栈开发工程师综合测试卷",
    "totalScore": 100,
    "duration": 90, 
    "createTime": "2024-01-10T09:00:00Z",
    "description": "本试卷包含基础理论与编程实战，请在规定时间内完成。"
  },
  "sections": [
    {
      "id": "SEC_01",
      "title": "第一部分：基础知识 (单选题)",
      "description": "每题只有一个正确选项。",
      "type": "single_choice",
      "questions": [
        {
          "id": "Q_01",
          "idx": 1,
          "score": 5,
          "type": "single_choice",
          "content": "在 HTTP 协议中，表示“服务器内部错误”的状态码是？",
          "options": [
            { "label": "A", "value": "200" },
            { "label": "B", "value": "404" },
            { "label": "C", "value": "500" },
            { "label": "D", "value": "301" }
          ],
          "correctAnswer": "C",
          "analysis": "500 Internal Server Error 是服务器端错误的通用状态码。"
        }
      ]
    },
    {
      "id": "SEC_02",
      "title": "第二部分：进阶理解 (多选题)",
      "description": "少选得部分分，错选不得分。",
      "type": "multiple_choice",
      "questions": [
        {
          "id": "Q_02",
          "idx": 2,
          "score": 10,
          "type": "multiple_choice",
          "content": "以下哪些是 JavaScript 的基本数据类型？",
          "options": [
            { "label": "A", "value": "Number" },
            { "label": "B", "value": "String" },
            { "label": "C", "value": "List" },
            { "label": "D", "value": "Boolean" }
          ],
          "correctAnswer": ["A", "B", "D"],
          "analysis": "List 是 Python 的概念，JS 中对应的是 Array（引用类型）。"
        }
      ]
    },
    {
      "id": "SEC_03",
      "title": "第三部分：快速判断 (判断题)",
      "type": "true_false",
      "questions": [
        {
          "id": "Q_03",
          "idx": 3,
          "score": 5,
          "type": "true_false",
          "content": "Vue.js 中的 v-if 和 v-show 是一样的。",
          "options": [
            { "label": "True", "value": "正确" },
            { "label": "False", "value": "错误" }
          ],
          "correctAnswer": "False",
          "analysis": "v-if 是条件渲染（DOM销毁重建），v-show 是 CSS 切换（display: none）。"
        }
      ]
    },
    {
      "id": "SEC_04",
      "title": "第四部分：填空与计算",
      "type": "mixed",
      "questions": [
        {
          "id": "Q_04",
          "idx": 4,
          "score": 10,
          "type": "fill_in_blank",
          "content": "CSS 中，id 选择器的权重是 ___，类选择器的权重是 ___ 。",
          "correctAnswer": ["100", "10"],
          "analysis": "ID选择器权重为100，类、伪类、属性选择器权重为10。"
        },
        {
          "id": "Q_05",
          "idx": 5,
          "score": 10,
          "type": "calculation",
          "content": "计算积分：$\\int_0^1 x^2 dx$ 的值。",
          "correctAnswer": "1/3",
          "analysis": "x^2 的原函数是 x^3/3，代入上下限 1 和 0，得 1/3。",
          "isLatex": true
        }
      ]
    },
    {
      "id": "SEC_05",
      "title": "第五部分：主观综合题",
      "type": "subjective",
      "questions": [
        {
          "id": "Q_06",
          "idx": 6,
          "score": 15,
          "type": "short_answer",
          "content": "简述什么是跨域（CORS）及其常见的解决方案。",
          "correctAnswer": "关键点：1. 协议、域名、端口不同；2. JSONP；3. CORS头设置；4. Nginx反向代理。",
          "analysis": "本题主要考察同源策略的理解及工程化解决能力。"
        },
        {
          "id": "Q_07",
          "idx": 7,
          "score": 20,
          "type": "coding",
          "content": "请写一个 Python 函数 `is_palindrome` 判断字符串是否为回文。",
          "codeLanguage": "python",
          "correctAnswer": "def is_palindrome(s):\n    return s == s[::-1]",
          "analysis": "利用切片操作 s[::-1] 进行字符串反转比较。",
          "defaultCode": "def is_palindrome(s):\n    # Write your code here\n    pass"
        }
      ]
    }
  ]
}

```

---

### 2. 字段详细定义与解析规则

为了让前端能够通用地解析这个 JSON，我们需要定义每个字段的含义：

#### A. 根节点 (`examMeta`)

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `id` | String | 试卷唯一标识 |
| `title` | String | 试卷标题 |
| `totalScore` | Number | 总分 |
| `duration` | Number | 考试时长（分钟），用于倒计时功能 |

#### B. 章节节点 (`sections`)

试卷通常是分块的，`sections` 数组用于渲染类似“第一大题”、“第二大题”的折叠面板或标题。

#### C. 题目核心节点 (`questions` item)

这是最关键的部分，前端需要根据 `type` 字段渲染不同的 UI 组件。

| 字段名 | 类型 | 必须 | 说明 |
| --- | --- | --- | --- |
| `id` | String | 是 | 题目唯一ID，用于绑定答案数据 |
| `idx` | Number | 是 | 题目显示的序号（如 1, 2, 3） |
| `type` | String | 是 | **核心字段**，决定渲染逻辑（见下文枚举） |
| `score` | Number | 是 | 该题分值 |
| `content` | String | 是 | 题干，支持 HTML 或 Markdown（如插入图片 `<img src...>`） |
| `options` | Array | 否 | 用于选择题，包含 `{label: 'A', value: 'xxx'}` |
| `correctAnswer` | Any | 是 | 正确答案（数据结构随 `type` 变化） |
| `analysis` | String | 是 | 详细解析，交卷后显示 |
| `isLatex` | Boolean | 否 | 如果为 `true`，前端需调用 MathJax/KaTeX 渲染公式 |

#### D. `type` 枚举与 `correctAnswer` 数据格式

前端判分逻辑需要根据 `type` 处理 `correctAnswer`：

1. **`single_choice` (单选)**
* **UI:** Radio Group (单选框组)
* **Answer:** String (例如 `"C"`)
* **判分:** `userVal === correctVal`


2. **`multiple_choice` (多选)**
* **UI:** Checkbox Group (复选框组)
* **Answer:** Array<String> (例如 `["A", "B"]`)
* **判分:** 数组内容完全一致（需要排序后比较）。


3. **`true_false` (判断)**
* **UI:** Radio Group (两个选项)
* **Answer:** String (`"True"` / `"False"` 或自定义)


4. **`fill_in_blank` (填空)**
* **UI:** 根据 `correctAnswer` 的长度生成对应数量的 Input 框。
* **Answer:** Array<String> (例如 `["100", "10"]`)
* **判分:** 依次比对数组中的每个填空项。


5. **`short_answer` / `calculation` (简答/计算)**
* **UI:** Textarea (多行文本框)
* **Answer:** String (参考答案文本)
* **判分:** **注意**：此类题目通常无法前端自动精准判分。前端逻辑一般是：用户提交后，显示“待人工评分”或仅展示参考答案供自测。


6. **`coding` (代码题)**
* **UI:** Code Editor (如 Monaco Editor)
* **Answer:** String (标准代码)
* **扩展字段:** `codeLanguage` (高亮语法), `defaultCode` (编辑器初始占位符)。



---

### 3. 可视化功能的实现建议

在这一步，我们不写代码，而是梳理**读取 JSON 后的前端逻辑**：

#### 模式一：整卷阅读 (Full Paper Mode)

* **渲染逻辑：** 遍历 `sections`，嵌套遍历 `questions`，直接在一个长滚动页面中渲染所有题目。
* **适用场景：** 传统考试模拟，最后统一点击“提交”按钮。
* **计分：** 点击提交后，遍历所有组件的选中状态，对比 JSON 中的 `correctAnswer` 计算总分。

#### 模式二：逐题阅读 (Single Question Mode)

* **渲染逻辑：** 维护一个 `currentQuestionIndex`。界面只显示 `questions[currentQuestionIndex]`。
* **UI 元素：** 需要“上一题”、“下一题”按钮，以及一个“答题卡”浮层（显示 1-100 的小圆圈，点击跳转）。
* **适用场景：** 刷题练习（LeetCode 模式）。
* **计分：** 每做完一题，立即比对并显示“回答正确/错误”，实时更新顶部“当前得分”。
#   E x a m V i z  
 