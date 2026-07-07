import type { SourceBook } from "@/lib/types";

// Google Books API. We only get metadata + description here (no full text),
// so summaries for these books rely on the description + the model's knowledge.

interface GoogleVolume {
  id: string;
  volumeInfo: {
    title?: string;
    authors?: string[];
    description?: string;
    categories?: string[];
    publishedDate?: string;
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
  };
}

interface GoogleResponse {
  items?: GoogleVolume[];
}

const BASE = "https://www.googleapis.com/books/v1/volumes";

function parseYear(date?: string): number | undefined {
  if (!date) return undefined;
  const m = date.match(/\d{4}/);
  return m ? Number(m[0]) : undefined;
}

function toSourceBook(vol: GoogleVolume): SourceBook | null {
  const info = vol.volumeInfo;
  if (!info.title) return null;
  const cover = info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail;
  return {
    source: "googlebooks",
    externalId: vol.id,
    title: info.title,
    author: info.authors?.[0] ?? "Unknown",
    coverUrl: cover?.replace("http://", "https://"),
    description: info.description,
    genres: (info.categories ?? []).map((c) => c.toLowerCase()).slice(0, 6),
    topics: [],
    publishYear: parseYear(info.publishedDate),
    hasFullText: false,
  };
}

// Search Google Books. Requires a query; used for topic-rotation / keyword picks.
export async function searchGoogleBooks(query: string, max = 20): Promise<SourceBook[]> {
  const key = process.env.GOOGLE_BOOKS_API_KEY;
  const params = new URLSearchParams({
    q: query,
    maxResults: String(Math.min(max, 40)),
    printType: "books",
    langRestrict: "en",
    orderBy: "relevance",
  });
  if (key) params.set("key", key);
  const res = await fetch(`${BASE}?${params}`, {
    headers: { "User-Agent": "tikbook/0.1" },
  });
  if (!res.ok) throw new Error(`Google Books ${res.status}`);
  const data = (await res.json()) as GoogleResponse;
  return (data.items ?? [])
    .map(toSourceBook)
    .filter((b): b is SourceBook => b !== null && Boolean(b.description));
}

// A grab-bag of subjects so random discovery has variety.
const DISCOVERY_SUBJECTS = [
  "psychology",
  "business",
  "science",
  "history",
  "philosophy",
  "self-help",
  "technology",
  "economics",
  "biography",
  "health",
  "productivity",
  "fiction",
];

export function randomDiscoverySubject(seed: number): string {
  return DISCOVERY_SUBJECTS[seed % DISCOVERY_SUBJECTS.length];
}
