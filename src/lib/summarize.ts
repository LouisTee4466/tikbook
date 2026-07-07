import { complete, llmModel, RateLimitError } from "@/lib/llm";
import { SUMMARY_PAGE_COUNT, type SourceBook, type SummaryPage } from "@/lib/types";

export { llmModel };

// 固定的 10 页结构：每本书都按同一骨架生成，阅读体验一致。
// 逐页小批量生成：免费额度（每分钟 token 限制）下，一次只生成少量页，
// 由 /api/generate 分多次调用接力完成。
const PAGE_PLAN: { title: string; instruction: string }[] = [
  { title: "书籍概览", instruction: "介绍这本书是什么、它的核心承诺、适合谁读、为什么值得读。" },
  { title: "作者与背景", instruction: "介绍作者的经历与专业背景，以及这本书诞生的时代背景或动机。" },
  { title: "核心论点", instruction: "阐明全书最核心的一个论点/主线，以及作者用什么逻辑支撑它。" },
  { title: "关键概念（一）", instruction: "深入讲解书中第一个重要概念/框架/情节脉络，并给出书中的具体例子。" },
  { title: "关键概念（二）", instruction: "深入讲解书中第二个重要概念/框架/情节发展，并给出书中的具体例子。" },
  { title: "关键概念（三）", instruction: "深入讲解书中第三个重要概念/框架/高潮转折，并给出书中的具体例子。" },
  { title: "章节脉络", instruction: "梳理全书的结构：论证或故事是如何层层推进的。" },
  { title: "金句摘录", instruction: "列出 5-8 条最能代表本书精神的金句或核心观点（可意译），每条附一句解读。" },
  { title: "批判性评价", instruction: "客观评价本书的优点与局限，指出哪些读者或学者可能持不同意见。" },
  { title: "行动清单", instruction: "总结读者可以立即实践的 5-7 条具体行动或思考题（小说则给出阅读收获与延伸思考）。" },
];

const SYSTEM_PROMPT =
  "你是一位资深的中文书评人和读书栏目主笔。你写的摘要具体、有细节、忠于原书。" +
  "对不确定的细节保持概括而不编造。直接输出正文内容，不要任何开场白、标题重复或结尾客套。";

function buildContext(book: SourceBook): string {
  const lines = [
    `书名：${book.title}`,
    `作者：${book.author}`,
    book.publishYear ? `出版年份：${book.publishYear}` : null,
    book.genres.length ? `分类：${book.genres.join("、")}` : null,
    book.topics.length ? `主题：${book.topics.join("、")}` : null,
    book.description ? `一句话定位：${book.description}` : null,
  ].filter(Boolean);
  return (
    lines.join("\n") +
    "\n\n请基于你对这本书的了解来写。这是一本知名的书，请写得具体：引用书中真实的概念、例子和结构。"
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// 生成单独一页。撞到限流时在本次调用内等待一次再重试（等待上限 25s，
// 以免超出 serverless 时长）；仍失败则抛出 RateLimitError 交由上层调度。
async function generatePage(
  book: SourceBook,
  pageIndex: number,
  previousTitles: string[],
): Promise<SummaryPage> {
  const plan = PAGE_PLAN[pageIndex];
  const user = `${buildContext(book)}

任务：为这本书的 10 页导读中的「第 ${pageIndex + 1} 页：${plan.title}」写正文。
本页要求：${plan.instruction}
${previousTitles.length ? `前面已写过的页：${previousTitles.join("、")}。不要重复前文内容。` : ""}
篇幅 250-400 字，分 2-4 个自然段（金句/行动清单页用列表形式，每行一条）。直接输出正文。`;

  let body = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      body = (await complete(SYSTEM_PROMPT, user, 1200)).trim();
      if (body.length >= 50) break;
    } catch (e) {
      if (e instanceof RateLimitError && attempt < 2 && e.retryAfterMs <= 25_000) {
        await sleep(e.retryAfterMs + 500);
        continue;
      }
      if (attempt >= 2) throw e;
    }
  }
  if (body.length < 50) throw new Error(`第 ${pageIndex + 1} 页生成内容过短`);
  return { page: pageIndex + 1, title: plan.title, body };
}

// 从 existing 之后继续生成最多 count 页，返回新增的页。
export async function generateNextPages(
  book: SourceBook,
  existing: SummaryPage[],
  count: number,
): Promise<SummaryPage[]> {
  const added: SummaryPage[] = [];
  const titles = existing.map((p) => p.title);
  for (let i = existing.length; i < Math.min(existing.length + count, SUMMARY_PAGE_COUNT); i++) {
    const page = await generatePage(book, i, titles);
    added.push(page);
    titles.push(page.title);
  }
  return added;
}
