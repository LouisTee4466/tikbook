import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { BOOK_POOL, type PoolBook } from "@/data/bookPool";
import { selectDaily, type Selection } from "@/lib/select";
import { summarizeBook } from "@/lib/summarize";
import type { SourceBook } from "@/lib/types";

export function todayStr(now: Date): string {
  return now.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

function poolToSource(p: PoolBook): SourceBook {
  return {
    source: "pool",
    externalId: p.id,
    title: p.title,
    author: p.author,
    description: p.desc,
    hasFullText: false,
    genres: p.genres,
    topics: p.topics,
    publishYear: p.year,
  };
}

// 已经选过的书（任意一天），保证永不重复。
async function pickedKeys(): Promise<Set<string>> {
  const picked = await prisma.dailyPickBook.findMany({ include: { book: true } });
  return new Set(picked.map((p) => `${p.book.source}:${p.book.externalId}`));
}

// 候选 = 精选书池里还没被选过的书。零网络依赖，永不被限流。
async function gatherCandidates(): Promise<SourceBook[]> {
  const exclude = await pickedKeys();
  return BOOK_POOL.map(poolToSource).filter(
    (b) => !exclude.has(`${b.source}:${b.externalId}`),
  );
}

// 封面：尽力从 Google Books 找一张；失败就无封面（不阻塞主流程）。
async function tryFetchCover(book: SourceBook): Promise<string | undefined> {
  try {
    const q = encodeURIComponent(`${book.title.replace(/\s*\(.*\)$/, "")} ${book.author}`);
    const key = process.env.GOOGLE_BOOKS_API_KEY;
    const url = `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1${key ? `&key=${key}` : ""}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return undefined;
    const data = (await res.json()) as {
      items?: { volumeInfo?: { imageLinks?: { thumbnail?: string } } }[];
    };
    return data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail?.replace("http://", "https://");
  } catch {
    return undefined;
  }
}

async function persistSelection(sel: Selection): Promise<string> {
  const { book } = sel;
  const existing = await prisma.book.findUnique({
    where: { source_externalId: { source: book.source, externalId: book.externalId } },
    include: { summary: true },
  });

  let bookId: string;
  if (existing) {
    bookId = existing.id;
  } else {
    const coverUrl = book.coverUrl ?? (await tryFetchCover(book));
    const created = await prisma.book.create({
      data: {
        title: book.title,
        author: book.author,
        source: book.source,
        externalId: book.externalId,
        coverUrl,
        description: book.description,
        hasFullText: book.hasFullText,
        genres: book.genres,
        topics: book.topics,
        publishYear: book.publishYear,
      },
    });
    bookId = created.id;
  }

  if (!existing?.summary) {
    const { pages, model } = await summarizeBook(book);
    await prisma.summary.create({
      data: { bookId, pages: pages as unknown as Prisma.InputJsonValue, model },
    });
  }
  return bookId;
}

export interface RunResult {
  date: string;
  created: boolean;
  bookIds: string[];
  failures: string[];
}

// 每日流水线（幂等；force 可重新生成当天）。
// 每本书独立容错：某本摘要失败时自动换下一本候补，不会全盘报废。
export async function runDailyPipeline(
  now: Date,
  opts: { force?: boolean } = {},
): Promise<RunResult> {
  const date = todayStr(now);

  const existingPick = await prisma.dailyPick.findUnique({
    where: { date },
    include: { books: true },
  });
  if (existingPick && !opts.force) {
    return {
      date,
      created: false,
      bookIds: existingPick.books.map((b) => b.bookId),
      failures: [],
    };
  }

  const seed = Math.floor(now.getTime() / 86_400_000);
  const candidates = await gatherCandidates();
  if (candidates.length < 3) {
    throw new Error(`书池即将耗尽（仅剩 ${candidates.length} 本未选）。请在 src/data/bookPool.ts 中追加书目。`);
  }

  // 选出主选 3 本 + 候补队列
  const selections = await selectDaily(candidates, seed);
  const chosen = new Set(selections.map((s) => `${s.book.source}:${s.book.externalId}`));
  const substitutes = candidates.filter(
    (c) => !chosen.has(`${c.source}:${c.externalId}`),
  );

  const succeeded: { sel: Selection; bookId: string }[] = [];
  const failures: string[] = [];
  let subIdx = 0;

  for (const sel of selections) {
    let current: Selection | null = sel;
    // 失败最多换 2 本候补
    for (let attempt = 0; attempt < 3 && current; attempt++) {
      const trying: Selection = current;
      try {
        const bookId = await persistSelection(trying);
        succeeded.push({ sel: trying, bookId });
        current = null;
      } catch (e) {
        failures.push(`${trying.book.title}: ${String(e).slice(0, 200)}`);
        console.error(`summary failed for ${trying.book.title}, trying substitute:`, e);
        const sub = substitutes[subIdx++];
        current = sub ? { book: sub, reason: trying.reason } : null;
      }
    }
  }

  if (succeeded.length === 0) {
    throw new Error(
      `今日三本全部生成失败。请检查 LLM 配置（LLM_PROVIDER=${process.env.LLM_PROVIDER || "ollama"}）。首个错误：${failures[0] ?? "unknown"}`,
    );
  }

  if (existingPick) {
    await prisma.dailyPick.delete({ where: { id: existingPick.id } });
  }
  await prisma.dailyPick.create({
    data: {
      date,
      books: {
        create: succeeded.map(({ sel, bookId }, i) => ({
          bookId,
          reason: sel.reason,
          position: i,
        })),
      },
    },
  });

  return { date, created: true, bookIds: succeeded.map((s) => s.bookId), failures };
}
