import { complete, llmModel } from "@/lib/llm";
import { SUMMARY_PAGE_COUNT, type SourceBook, type SummaryPage } from "@/lib/types";

// 固定的 10 页结构：每本书都按同一骨架生成，阅读体验一致。
// 逐页生成（每页一次小请求，纯文本输出）而不是一次性生成 10 页 JSON——
// 对免费小模型来说稳健得多：没有 JSON 解析失败，单页失败只需重试该页。
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

function buildContext(book: SourceBook, condensedNotes: string | null): string {
  const lines = [
    `书名：${book.title}`,
    `作者：${book.author}`,
    book.publishYear ? `出版年份：${book.publishYear}` : null,
    book.genres.length ? `分类：${book.genres.join("、")}` : null,
    book.topics.length ? `主题：${book.topics.join("、")}` : null,
    book.description ? `一句话定位：${book.description}` : null,
  ].filter(Boolean);
  let ctx = lines.join("\n");
  if (condensedNotes) {
    ctx += `\n\n以下是全书原文的浓缩笔记，请以此为准：\n${condensedNotes}`;
  } else {
    ctx += "\n\n请基于你对这本书的了解来写。这是一本知名的书，请写得具体：引用书中真实的概念、例子和结构。";
  }
  return ctx;
}

// 生成单独一页。previousTitles 让模型知道前文写过什么，避免重复。
async function generatePage(
  book: SourceBook,
  pageIndex: number,
  context: string,
  previousTitles: string[],
): Promise<SummaryPage> {
  const plan = PAGE_PLAN[pageIndex];
  const user = `${context}

任务：为这本书的 10 页导读中的「第 ${pageIndex + 1} 页：${plan.title}」写正文。
本页要求：${plan.instruction}
${previousTitles.length ? `前面已写过的页：${previousTitles.join("、")}。不要重复前文内容。` : ""}
篇幅 250-400 字，分 2-4 个自然段（金句/行动清单页用列表形式，每行一条）。直接输出正文。`;

  let body = "";
  // 单页重试一次；两次都失败则抛给上层换书
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      body = (await complete(SYSTEM_PROMPT, user, 1500)).trim();
      if (body.length >= 50) break; // 太短视为失败
    } catch (e) {
      if (attempt === 1) throw e;
    }
  }
  if (body.length < 50) throw new Error(`Page ${pageIndex + 1} generation too short`);
  return { page: pageIndex + 1, title: plan.title, body };
}

// 全文书的 map 步骤：把长文本压缩成笔记（免费额度友好：顺序执行）。
async function condenseFullText(book: SourceBook, fullText: string): Promise<string> {
  const CHUNK = 40_000;
  const MAX_CHUNKS = 8;
  const chunks: string[] = [];
  for (let i = 0; i < fullText.length && chunks.length < MAX_CHUNKS; i += CHUNK) {
    chunks.push(fullText.slice(i, i + CHUNK));
  }
  const notes: string[] = [];
  for (let idx = 0; idx < chunks.length; idx++) {
    notes.push(
      await complete(
        "你是严谨的阅读助手。把下面的书籍节选压缩成信息密集的中文要点笔记，覆盖情节/论点、关键概念与值得引用的段落。直接输出要点。",
        `书名：《${book.title}》（${book.author}）。节选 ${idx + 1}/${chunks.length}：\n\n${chunks[idx]}`,
        1000,
      ),
    );
  }
  return notes.map((n, i) => `【第 ${i + 1} 部分】\n${n}`).join("\n\n");
}

export interface SummarizeProgress {
  (pageDone: number, total: number): void;
}

// 入口：为一本书生成 10 页摘要（逐页），可选进度回调。
export async function summarizeBook(
  book: SourceBook,
  onProgress?: SummarizeProgress,
): Promise<{ pages: SummaryPage[]; model: string }> {
  const condensed =
    book.hasFullText && book.fullText ? await condenseFullText(book, book.fullText) : null;
  const context = buildContext(book, condensed);

  const pages: SummaryPage[] = [];
  for (let i = 0; i < SUMMARY_PAGE_COUNT; i++) {
    const page = await generatePage(book, i, context, pages.map((p) => p.title));
    pages.push(page);
    onProgress?.(i + 1, SUMMARY_PAGE_COUNT);
  }
  return { pages, model: llmModel() };
}
