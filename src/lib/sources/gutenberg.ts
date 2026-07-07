import type { SourceBook } from "@/lib/types";

// Project Gutenberg via the Gutendex API (https://gutendex.com).
// These are public-domain books, so we can fetch and summarize full text.

interface GutendexBook {
  id: number;
  title: string;
  authors: { name: string; birth_year?: number | null; death_year?: number | null }[];
  subjects: string[];
  bookshelves: string[];
  languages: string[];
  formats: Record<string, string>;
  download_count: number;
}

interface GutendexResponse {
  count: number;
  results: GutendexBook[];
}

const BASE = "https://gutendex.com/books";

function normalizeAuthor(book: GutendexBook): string {
  return book.authors[0]?.name ?? "Unknown";
}

// Subjects in Gutenberg look like "Fiction -- Science fiction"; split into tags.
function subjectsToTags(subjects: string[]): string[] {
  const tags = new Set<string>();
  for (const s of subjects) {
    for (const part of s.split(/--|,|;/)) {
      const t = part.trim().toLowerCase();
      if (t && t.length < 40) tags.add(t);
    }
  }
  return [...tags].slice(0, 12);
}

function pickCover(formats: Record<string, string>): string | undefined {
  return formats["image/jpeg"];
}

function pickTextUrl(formats: Record<string, string>): string | undefined {
  // Prefer UTF-8 plain text.
  const preferred = [
    "text/plain; charset=utf-8",
    "text/plain; charset=us-ascii",
    "text/plain",
  ];
  for (const key of preferred) {
    if (formats[key]) return formats[key];
  }
  for (const [k, v] of Object.entries(formats)) {
    if (k.startsWith("text/plain")) return v;
  }
  return undefined;
}

function toSourceBook(book: GutendexBook): SourceBook | null {
  const textUrl = pickTextUrl(book.formats);
  if (!textUrl) return null; // skip books with no readable text format
  return {
    source: "gutenberg",
    externalId: String(book.id),
    title: book.title,
    author: normalizeAuthor(book),
    coverUrl: pickCover(book.formats),
    genres: [...book.bookshelves].map((b) => b.toLowerCase()).slice(0, 6),
    topics: subjectsToTags(book.subjects),
    hasFullText: true,
  };
}

// Fetch a page of popular English books. `page` is 1-indexed.
export async function fetchGutenbergCandidates(page = 1): Promise<SourceBook[]> {
  const url = `${BASE}?languages=en&mime_type=text%2Fplain&sort=popular&page=${page}`;
  const res = await fetch(url, { headers: { "User-Agent": "tikbook/0.1" } });
  if (!res.ok) throw new Error(`Gutendex ${res.status}`);
  const data = (await res.json()) as GutendexResponse;
  return data.results.map(toSourceBook).filter((b): b is SourceBook => b !== null);
}

const GUTENBERG_HEADER_RE = /\*\*\*\s*START OF (THE|THIS) PROJECT GUTENBERG.*?\*\*\*/s;
const GUTENBERG_FOOTER_RE = /\*\*\*\s*END OF (THE|THIS) PROJECT GUTENBERG.*?\*\*\*/s;

// Strip Gutenberg license boilerplate so the model sees the actual text.
function stripBoilerplate(raw: string): string {
  let text = raw;
  const start = text.search(GUTENBERG_HEADER_RE);
  if (start !== -1) {
    const after = text.slice(start).replace(GUTENBERG_HEADER_RE, "");
    text = after;
  }
  const end = text.search(GUTENBERG_FOOTER_RE);
  if (end !== -1) text = text.slice(0, end);
  return text.trim();
}

export async function fetchGutenbergText(textUrl: string): Promise<string> {
  const res = await fetch(textUrl, { headers: { "User-Agent": "tikbook/0.1" } });
  if (!res.ok) throw new Error(`Gutenberg text ${res.status}`);
  const raw = await res.text();
  return stripBoilerplate(raw);
}

// Re-fetch a single book's metadata to recover its text URL at summarize time.
export async function fetchGutenbergTextById(id: string): Promise<string | null> {
  const res = await fetch(`${BASE}/${id}`, { headers: { "User-Agent": "tikbook/0.1" } });
  if (!res.ok) return null;
  const book = (await res.json()) as GutendexBook;
  const textUrl = pickTextUrl(book.formats);
  if (!textUrl) return null;
  return fetchGutenbergText(textUrl);
}
