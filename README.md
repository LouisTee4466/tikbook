# Tikbook 📚

每天自动挑选 **3 本书**，为每本书生成 **10 页结构化摘要**，用翻页式电子书阅读器呈现。
你可以对每本书 👍 / 👎，系统据此学习你的口味——但**只有在你评价满 50 本书之后**才会开启个性化推荐（数据太少时分析没有意义）。

## 功能概览

- **每日选书**：从 Project Gutenberg（公版全文）和 Google Books（元数据）混合取书，去重历史选过的书。
- **10 页摘要**：用 Claude 生成固定结构的 10 页摘要（概览 / 核心论点 / 关键概念 / 金句 / 评价 / 行动清单…）。有全文的书走 map-reduce 分块摘要，其余基于简介 + 模型知识。
- **翻页阅读器**：封面页 + 10 页内容，左右箭头 / 键盘 ←→ 翻页，进度条、页码、目录跳页、字号调节。
- **偏好学习 + 冷启动保护**：
  - 评价 < 50 本 → 纯随机去重选书。
  - 评价 ≥ 50 本 → 每日 3 本 = **1 本按偏好 + 2 本随机探索**（保留探索位，避免信息茧房）。

## 技术栈

Next.js (App Router) · TypeScript · Prisma · SQLite（本地）/ Postgres（生产）· 可插拔 LLM（默认免费）· Vercel Cron

## LLM 提供方（免费优先，无需付费）

摘要生成走可插拔的 LLM 层（`src/lib/llm.ts`），用 `LLM_PROVIDER` 选择：

| 提供方 | 费用 | 说明 |
|---|---|---|
| `ollama`（默认）| **免费 / 本地** | 无需 key、无限量。装 [Ollama](https://ollama.com) 后 `ollama pull llama3.1:8b` |
| `groq` | **免费额度** | 极快，[免费注册](https://console.groq.com)拿 `GROQ_API_KEY` |
| `gemini` | **免费额度** | [Google AI Studio](https://aistudio.google.com/apikey) 拿 `GEMINI_API_KEY` |
| `openai` / `anthropic` | 付费（可选）| 有额度就用，不用不碰 |

## 本地运行

```bash
# 1. 安装依赖
npm install

# 2. 装一个免费的本地模型（默认方案，零成本）
#    从 https://ollama.com 安装 Ollama，然后：
ollama pull llama3.1:8b     # ollama serve 会在后台运行

# 3. 配置环境变量
cp .env.example .env
#   默认 LLM_PROVIDER=ollama，不用填任何 key
#   想用 Groq/Gemini 免费额度：改 LLM_PROVIDER 并填对应 key
#   GOOGLE_BOOKS_API_KEY 可选；不填则只用 Gutenberg 公版书

# 4. 初始化数据库
npm run db:push

# 5. 启动
npm run dev
# 打开 http://localhost:3000，点右上角「生成今日三本」

# 或者用命令行触发一次流水线：
npm run run:daily
```

## 数据模型

| 表 | 说明 |
|---|---|
| `Book` | 书籍元数据 + 选书信号（genres / topics / publishYear）|
| `Summary` | 该书的 10 页摘要（JSON）|
| `Feedback` | 每本书的 like / dislike |
| `DailyPick` / `DailyPickBook` | 每天选的 3 本书及其原因（preference / exploration）|

## 核心逻辑位置

- 选书与偏好算法：`src/lib/select.ts`
- 摘要生成（map-reduce）：`src/lib/summarize.ts`
- 可插拔 LLM 层（免费优先）：`src/lib/llm.ts`
- 每日流水线编排：`src/lib/pipeline.ts`
- 书源适配器：`src/lib/sources/`
- 翻页阅读器：`src/app/book/[id]/Reader.tsx`

## 部署到 Vercel

1. 数据库切到 Postgres：把 `prisma/schema.prisma` 的 `provider` 改为 `postgresql`，`DATABASE_URL` 换成 Postgres 连接串（如 Vercel Postgres / Supabase）。
2. 在 Vercel 配置环境变量（`ANTHROPIC_API_KEY`、`DATABASE_URL`、`CRON_SECRET` 等）。
3. `vercel.json` 已配置每天 06:00 UTC 触发 `/api/cron`。

## 路线图

- **阶段 1（当前 MVP）**：选书 → 摘要 → 翻页阅读 → like/dislike → 冷启动保护 ✅
- **阶段 2**：更强的偏好分析（作者/年代/主题加权）、探索位多样性优化。
- **阶段 3**：TTS 朗读、每日邮件推送、多用户账户。
