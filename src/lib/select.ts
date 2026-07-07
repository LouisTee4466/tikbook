import { prisma } from "@/lib/db";
import type { PickReason, SourceBook } from "@/lib/types";

// Personalization only kicks in after this many rated books; below it,
// preference data is too sparse to be meaningful, so we pick purely at random.
export const PREFERENCE_UNLOCK_THRESHOLD = 50;

// Of the 3 daily books: 1 is always business/marketing, 1 chosen by
// preference (once unlocked), the rest random exploration.
const PREFERENCE_SLOTS = 1;
const TOTAL_SLOTS = 3;

// 每天必须包含一本商业/营销类：命中这些分类即算。
const BUSINESS_GENRES = new Set(["商业", "营销", "管理", "理财", "产品"]);

function isBusiness(book: SourceBook): boolean {
  return book.genres.some((g) => BUSINESS_GENRES.has(g));
}

export async function getRatedCount(): Promise<number> {
  return prisma.feedback.count();
}

// Tags (genre/topic) → weight, learned from like/dislike history.
export type PreferenceProfile = Map<string, number>;

function bookTags(book: { genres: unknown; topics: unknown }): string[] {
  const g = Array.isArray(book.genres) ? (book.genres as string[]) : [];
  const t = Array.isArray(book.topics) ? (book.topics as string[]) : [];
  return [...g, ...t].map((s) => s.toLowerCase());
}

// Build a simple weighted profile: liked tags get +1, disliked tags get -1,
// then normalize by how often each tag appears so common tags don't dominate.
export async function buildPreferenceProfile(): Promise<PreferenceProfile> {
  const rated = await prisma.feedback.findMany({ include: { book: true } });
  const score = new Map<string, number>();
  const seen = new Map<string, number>();
  for (const fb of rated) {
    const delta = fb.value === "like" ? 1 : -1;
    for (const tag of bookTags(fb.book)) {
      score.set(tag, (score.get(tag) ?? 0) + delta);
      seen.set(tag, (seen.get(tag) ?? 0) + 1);
    }
  }
  const profile: PreferenceProfile = new Map();
  for (const [tag, s] of score) {
    const n = seen.get(tag) ?? 1;
    profile.set(tag, s / Math.sqrt(n)); // dampen rare tags
  }
  return profile;
}

export function scoreBook(book: SourceBook, profile: PreferenceProfile): number {
  const tags = [...book.genres, ...book.topics].map((s) => s.toLowerCase());
  let total = 0;
  for (const tag of tags) total += profile.get(tag) ?? 0;
  return total;
}

// Deterministic-ish shuffle seeded by a number (avoids Math.random for
// reproducibility in tests / scheduled runs).
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface Selection {
  book: SourceBook;
  reason: PickReason;
}

// Given a deduped candidate pool, pick 3 books.
export async function selectDaily(
  candidates: SourceBook[],
  seed: number,
): Promise<Selection[]> {
  const pool = seededShuffle(candidates, seed);
  const ratedCount = await getRatedCount();
  const personalized = ratedCount >= PREFERENCE_UNLOCK_THRESHOLD;
  const profile = personalized ? await buildPreferenceProfile() : null;

  const selections: Selection[] = [];
  const used = new Set<string>();
  const keyOf = (b: SourceBook) => `${b.source}:${b.externalId}`;

  // 1) 商业/营销保底位：解锁个性化后按偏好在商业书里挑，否则随机。
  const bizPool = pool.filter(isBusiness);
  if (bizPool.length > 0) {
    const biz = profile
      ? [...bizPool].sort((a, b) => scoreBook(b, profile) - scoreBook(a, profile))[0]
      : bizPool[0];
    used.add(keyOf(biz));
    selections.push({ book: biz, reason: "business" });
  }

  // 2) 偏好位（解锁后）
  if (profile) {
    const ranked = [...pool].sort((a, b) => scoreBook(b, profile) - scoreBook(a, profile));
    let added = 0;
    for (const book of ranked) {
      if (added >= PREFERENCE_SLOTS) break;
      if (used.has(keyOf(book))) continue;
      used.add(keyOf(book));
      selections.push({ book, reason: "preference" });
      added++;
    }
  }

  // 3) 探索位补满 3 本
  for (const book of pool) {
    if (selections.length >= TOTAL_SLOTS) break;
    if (used.has(keyOf(book))) continue;
    used.add(keyOf(book));
    selections.push({ book, reason: "exploration" });
  }

  return selections.slice(0, TOTAL_SLOTS);
}
