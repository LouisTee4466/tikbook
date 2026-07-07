import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { todayStr } from "@/lib/pipeline";
import { generateNextPages, llmModel } from "@/lib/summarize";
import { RateLimitError } from "@/lib/llm";
import { SUMMARY_PAGE_COUNT, type SourceBook, type SummaryPage } from "@/lib/types";

// 每次调用只生成少量页：既躲开免费额度的每分钟 token 限制，
// 也保证单次 serverless 请求远低于时长上限。多次调用接力完成全部页。
export const PAGES_PER_STEP = 2;
const LOCK_MS = 30_000;

export interface BookProgress {
  bookId: string;
  title: string;
  pagesDone: number;
  total: number;
}

export interface StepResult {
  date: string;
  allDone: boolean;
  worked: boolean;
  books: BookProgress[];
  // 建议的下次重试等待（毫秒）；撞限流时给出
  retryInMs?: number;
  error?: string;
}

function dbBookToSource(b: {
  source: string;
  externalId: string;
  title: string;
  author: string;
  description: string | null;
  genres: unknown;
  topics: unknown;
  publishYear: number | null;
}): SourceBook {
  return {
    source: b.source as SourceBook["source"],
    externalId: b.externalId,
    title: b.title,
    author: b.author,
    description: b.description ?? undefined,
    hasFullText: false,
    genres: Array.isArray(b.genres) ? (b.genres as string[]) : [],
    topics: Array.isArray(b.topics) ? (b.topics as string[]) : [],
    publishYear: b.publishYear ?? undefined,
  };
}

function pagesOf(summary: { pages: unknown } | null): SummaryPage[] {
  if (!summary || !Array.isArray(summary.pages)) return [];
  return summary.pages as SummaryPage[];
}

async function loadProgress(date: string) {
  return prisma.dailyPick.findUnique({
    where: { date },
    include: {
      books: {
        orderBy: { position: "asc" },
        include: { book: { include: { summary: true } } },
      },
    },
  });
}

function toProgress(pick: NonNullable<Awaited<ReturnType<typeof loadProgress>>>): BookProgress[] {
  return pick.books.map(({ book }) => ({
    bookId: book.id,
    title: book.title,
    pagesDone: book.summary?.complete ? SUMMARY_PAGE_COUNT : pagesOf(book.summary).length,
    total: SUMMARY_PAGE_COUNT,
  }));
}

// 执行一小步生成：找到今天第一本未完成的书，为它续写最多 PAGES_PER_STEP 页。
export async function processGenerationStep(now: Date): Promise<StepResult> {
  const date = todayStr(now);
  const pick = await loadProgress(date);
  if (!pick) {
    return { date, allDone: false, worked: false, books: [], error: "今日选书还未创建" };
  }

  const books = toProgress(pick);
  const target = pick.books.find(({ book }) => !book.summary?.complete);
  if (!target) {
    return { date, allDone: true, worked: false, books };
  }

  // 确保 Summary 行存在（首次为该书生成时创建空壳）
  let summary = target.book.summary;
  if (!summary) {
    summary = await prisma.summary.create({
      data: { bookId: target.book.id, pages: [], model: llmModel(), complete: false },
    });
  }

  // 软锁：另一个调用正在为这本书生成时，本次直接返回现状（前端稍后再来）。
  if (summary.lockedAt && now.getTime() - summary.lockedAt.getTime() < LOCK_MS) {
    return { date, allDone: false, worked: false, books, retryInMs: 5_000 };
  }
  await prisma.summary.update({
    where: { id: summary.id },
    data: { lockedAt: new Date(now.getTime()) },
  });

  const existing = pagesOf(summary);
  try {
    const added = await generateNextPages(
      dbBookToSource(target.book),
      existing,
      PAGES_PER_STEP,
    );
    const all = [...existing, ...added];
    const complete = all.length >= SUMMARY_PAGE_COUNT;
    await prisma.summary.update({
      where: { id: summary.id },
      data: {
        pages: all as unknown as Prisma.InputJsonValue,
        complete,
        lockedAt: null,
      },
    });

    const refreshed = await loadProgress(date);
    const refreshedBooks = refreshed ? toProgress(refreshed) : books;
    const allDone = refreshed
      ? refreshed.books.every(({ book }) => book.summary?.complete)
      : false;
    return { date, allDone, worked: true, books: refreshedBooks };
  } catch (e) {
    await prisma.summary.update({ where: { id: summary.id }, data: { lockedAt: null } });
    if (e instanceof RateLimitError) {
      return {
        date,
        allDone: false,
        worked: false,
        books,
        retryInMs: Math.min(e.retryAfterMs + 1000, 60_000),
        error: "限流中，稍后自动重试",
      };
    }
    return {
      date,
      allDone: false,
      worked: false,
      books,
      retryInMs: 8_000,
      error: String(e).slice(0, 300),
    };
  }
}
