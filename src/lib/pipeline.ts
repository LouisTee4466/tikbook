import { prisma } from "@/lib/db";
import { BOOK_POOL, type PoolBook } from "@/data/bookPool";
import { selectDaily } from "@/lib/select";
import type { SourceBook } from "@/lib/types";

// 应用的“今天”按用户时区计算（默认马来西亚 UTC+8），
// 这样凌晨 22:00 UTC 的定时任务生成的是马来西亚“明早”的日期，
// 且用户白天手动触发与当天定时任务命中同一天（幂等）。
const TZ_OFFSET_HOURS = Number(process.env.TZ_OFFSET_HOURS ?? 8);

export function todayStr(now: Date): string {
  const shifted = new Date(now.getTime() + TZ_OFFSET_HOURS * 3_600_000);
  return shifted.toISOString().slice(0, 10); // YYYY-MM-DD（用户时区）
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

async function fetchWithTimeout(url: string, ms = 5000): Promise<Response | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    return res.ok ? res : null;
  } catch {
    return null;
  }
}

// 书名常形如「中文名 (English Title)」——拆出两种叫法分别尝试搜索。
function titleVariants(title: string): string[] {
  const en = title.match(/[(（](.+?)[)）]\s*$/)?.[1]?.trim();
  const zh = title.replace(/\s*[(（].*[)）]\s*$/, "").trim();
  return [...new Set([en, zh, title].filter((t): t is string => Boolean(t)))];
}

async function googleCover(title: string, author: string): Promise<string | undefined> {
  const key = process.env.GOOGLE_BOOKS_API_KEY;
  const q = encodeURIComponent(`${title} ${author}`);
  const res = await fetchWithTimeout(
    `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1${key ? `&key=${key}` : ""}`,
  );
  if (!res) return undefined;
  const data = (await res.json()) as {
    items?: { volumeInfo?: { imageLinks?: { thumbnail?: string } } }[];
  };
  return data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail?.replace("http://", "https://");
}

async function openLibraryCover(title: string): Promise<string | undefined> {
  const res = await fetchWithTimeout(
    `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=1&fields=cover_i`,
  );
  if (!res) return undefined;
  const data = (await res.json()) as { docs?: { cover_i?: number }[] };
  const id = data.docs?.[0]?.cover_i;
  return id ? `https://covers.openlibrary.org/b/id/${id}-L.jpg` : undefined;
}

// 封面：Google Books（中英文书名各试一次）→ Open Library 兜底。
// 全部失败时前端会渲染生成式封面（BookCover 组件），保证每本书都有封面。
async function tryFetchCover(book: SourceBook): Promise<string | undefined> {
  for (const t of titleVariants(book.title)) {
    const g = await googleCover(t, book.author);
    if (g) return g;
  }
  for (const t of titleVariants(book.title)) {
    const o = await openLibraryCover(t);
    if (o) return o;
  }
  return undefined;
}

export interface EnsureResult {
  date: string;
  created: boolean;
  bookIds: string[];
}

// 第一阶段（快，不调用 LLM）：确保今天已选出 3 本书并入库。
// 摘要由 /api/generate 分批接力生成（见 src/lib/generate.ts）。
export async function ensureDailyPick(
  now: Date,
  opts: { force?: boolean } = {},
): Promise<EnsureResult> {
  const date = todayStr(now);

  const existing = await prisma.dailyPick.findUnique({
    where: { date },
    include: { books: true },
  });
  if (existing && !opts.force) {
    return { date, created: false, bookIds: existing.books.map((b) => b.bookId) };
  }

  const seed = Math.floor(now.getTime() / 86_400_000);
  const exclude = await pickedKeys();
  const candidates = BOOK_POOL.map(poolToSource).filter(
    (b) => !exclude.has(`${b.source}:${b.externalId}`),
  );
  if (candidates.length < 3) {
    throw new Error(
      `书池即将耗尽（仅剩 ${candidates.length} 本未选）。请在 src/data/bookPool.ts 中追加书目。`,
    );
  }

  const selections = await selectDaily(candidates, seed);

  const bookIds: string[] = [];
  for (const sel of selections) {
    const { book } = sel;
    const existingBook = await prisma.book.findUnique({
      where: { source_externalId: { source: book.source, externalId: book.externalId } },
    });
    if (existingBook) {
      bookIds.push(existingBook.id);
    } else {
      const coverUrl = await tryFetchCover(book);
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
      bookIds.push(created.id);
    }
  }

  if (existing) {
    await prisma.dailyPick.delete({ where: { id: existing.id } });
  }
  await prisma.dailyPick.create({
    data: {
      date,
      books: {
        create: selections.map((sel, i) => ({
          bookId: bookIds[i],
          reason: sel.reason,
          position: i,
        })),
      },
    },
  });

  return { date, created: true, bookIds };
}
