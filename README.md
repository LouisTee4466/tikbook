# Tikbook 📚

每天自动挑选 **3 本书**，为每本书生成 **10 页结构化摘要**，用翻页式电子书阅读器呈现。
你可以对每本书 👍 / 👎，系统据此学习你的口味——但**只有在你评价满 50 本书之后**才会开启个性化推荐（数据太少时分析没有意义）。

## 功能概览

- **每日选书**：从内置的 **170+ 本精选知名书池**（`src/data/bookPool.ts`，经典 + 畅销，覆盖 12 个领域）随机去重选 3 本。不依赖外部 API，永不被限流；书都是名著 → 模型知识充足 → 摘要具体可靠。书池可随时追加。
- **10 页摘要**：**逐页生成**固定结构的 10 页导读（概览 / 核心论点 / 关键概念 ×3 / 章节脉络 / 金句 / 评价 / 行动清单）。逐页小请求对免费小模型稳健：无 JSON 解析失败风险，单页失败单页重试；整本失败自动换候补书，当天三本不受影响。
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

## 本地运行（开发/调试用；手机使用请看下面的部署章节）

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
#   DATABASE_URL：填 Neon 免费连接串（见部署章节第 1 步）
#   LLM：本地推荐 Ollama（ollama pull qwen2.5:7b，无需 key），
#        或改 LLM_PROVIDER=groq 用免费云端额度

# 3. 初始化数据库
npm run db:push

# 4. 启动
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

## 🚀 部署上线（手机可用，全程免费，约 10 分钟）

目标：手机浏览器打开你的网址，每天自动出现三本新书。三个免费账号搞定：

**第 1 步 · 数据库（Neon，免费）**
1. 到 [neon.tech](https://neon.tech) 用 GitHub 登录，创建一个项目
2. 复制它给你的 `DATABASE_URL` 连接串

**第 2 步 · LLM（Groq，免费）**
1. 到 [console.groq.com](https://console.groq.com) 免费注册
2. 创建一个 API Key（云端没有 Ollama，所以用 Groq 的免费额度，速度还快）

**第 3 步 · 部署（Vercel，免费）**
1. 到 [vercel.com](https://vercel.com) 用 GitHub 登录 → **Add New Project** → 选这个仓库（分支选 `claude/book-summary-app-plan-n02vpw` 或先合并到 main）
2. 在 **Environment Variables** 填 4 个变量：
   | 变量 | 值 |
   |---|---|
   | `DATABASE_URL` | 第 1 步的 Neon 连接串 |
   | `LLM_PROVIDER` | `groq` |
   | `GROQ_API_KEY` | 第 2 步的 key |
   | `CRON_SECRET` | 随便一串密码 |
3. 点 Deploy，等 2 分钟拿到 `https://xxx.vercel.app`
4. 初始化数据库表（本机执行一次）：
   ```bash
   DATABASE_URL="你的Neon连接串" npx prisma db push
   ```

**完成后：**
- 📱 手机打开 `https://xxx.vercel.app`，加到主屏幕就像个 App
- ⏰ `vercel.json` 已配置每天 06:00 UTC（北京时间 14:00）自动跑 `/api/cron` 生成当天三本；想改时间就改 `vercel.json` 里的 cron 表达式（如 `0 22 * * *` = 北京早上 6 点）
- 第一次不想等定时任务：打开网站点一次「生成今日三本」即可

## 路线图

- **阶段 1（当前 MVP）**：选书 → 摘要 → 翻页阅读 → like/dislike → 冷启动保护 ✅
- **阶段 2**：更强的偏好分析（作者/年代/主题加权）、探索位多样性优化。
- **阶段 3**：TTS 朗读、每日邮件推送、多用户账户。
