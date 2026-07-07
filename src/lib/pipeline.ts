import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { fetchGutenbergCandidates, fetchGutenbergTextById } from "@/lib/sources/gutenberg";
import { randomDiscoverySubject, searchGoogleBooks } from "@/lib/sources/googlebooks";
import { selectDaily, type Selection } from "@/lib/select";
import { summarizeBook } from "@/lib/summarize";
import type { SourceBook } from "@/lib/types";

export function todayStr(now: Date): string {
  return now.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

// Keys of books that have already been picked on some day, so we never repeat.
async function pickedKeys(): Promise<Set<string>> {
  const picked = await prisma.dailyPickBook.findMany({ include: { book: true } });
  return new Set(picked.map((p) => `${p.book.source}:${p.book.externalId}`));
}

// Assemble a varied candidate pool from both sources.
async function gatherCandidates(seed: number): Promise<SourceBook[]> {
  const out: SourceBook[] = [];

  // Gutenberg: full-text public-domain books (rotate pages for variety).
  try {
    const page = (seed % 20) + 1;
    out.push(...(await fetchGutenbergCandidates(page)));
  } catch (e) {
    console.error("gutenberg candidates failed:", e);
  }

  // Google Books: modern books via a rotating subject query.
  if (process.env.GOOGLE_BOOKS_API_KEY !== undefined) {
    try {
      const subject = randomDiscoverySubject(seed);
      out.push(...(await searchGoogleBooks(`subject:${subject}`, 20)));
    } catch (e) {
      console.error("google books candidates failed:", e);
    }
  }

  return out;
}

function dedupeCandidates(candidates: SourceBook[], exclude: Set<string>): SourceBook[] {
  const seen = new Set(exclude);
  const out: SourceBook[] = [];
  for (const c of candidates) {
    const key = `${c.source}:${c.externalId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

async function persistSelection(sel: Selection, position: number): Promise<string> {
  const { book } = sel;

  // If we already summarized this exact book before, reuse it.
  const existing = await prisma.book.findUnique({
    where: { source_externalId: { source: book.source, externalId: book.externalId } },
    include: { summary: true },
  });

  let bookId: string;
  if (existing) {
    bookId = existing.id;
  } else {
    const created = await prisma.book.create({
      data: {
        title: book.title,
        author: book.author,
        source: book.source,
        externalId: book.externalId,
        coverUrl: book.coverUrl,
        description: book.description,
        hasFullText: book.hasFullText,
        genres: book.genres,
        topics: book.topics,
        publishYear: book.publishYear,
      },
    });
    bookId = created.id;
  }

  const hasSummary = existing?.summary != null;
  if (!hasSummary) {
    // Recover full text for gutenberg books at summarize time.
    let toSummarize: SourceBook = book;
    if (book.source === "gutenberg" && book.hasFullText) {
      const fullText = await fetchGutenbergTextById(book.externalId);
      toSummarize = { ...book, fullText: fullText ?? undefined };
    }
    const { pages, model } = await summarizeBook(toSummarize);
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
}

// Run the full daily pipeline. Idempotent per day unless `force` is set.
export async function runDailyPipeline(now: Date, opts: { force?: boolean } = {}): Promise<RunResult> {
  const date = todayStr(now);

  const existing = await prisma.dailyPick.findUnique({
    where: { date },
    include: { books: true },
  });
  if (existing && !opts.force) {
    return { date, created: false, bookIds: existing.books.map((b) => b.bookId) };
  }

  const seed = Math.floor(now.getTime() / 86_400_000); // day number since epoch
  const raw = await gatherCandidates(seed);
  const candidates = dedupeCandidates(raw, await pickedKeys());

  if (candidates.length < 3) {
    throw new Error(`Not enough fresh candidates (${candidates.length}). Try again later.`);
  }

  const selections = await selectDaily(candidates, seed);

  // Summarize + persist each selected book (sequential to keep API usage sane).
  const bookIds: string[] = [];
  for (let i = 0; i < selections.length; i++) {
    bookIds.push(await persistSelection(selections[i], i));
  }

  // Record the day's pick (replace if forcing).
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
