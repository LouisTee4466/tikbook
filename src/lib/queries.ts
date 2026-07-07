import { prisma } from "@/lib/db";
import { PREFERENCE_UNLOCK_THRESHOLD } from "@/lib/select";
import type { SummaryPage } from "@/lib/types";

export async function getLatestDailyPick() {
  return prisma.dailyPick.findFirst({
    orderBy: { date: "desc" },
    include: {
      books: {
        orderBy: { position: "asc" },
        include: { book: { include: { feedback: true, summary: true } } },
      },
    },
  });
}

export async function getBookWithSummary(id: string) {
  return prisma.book.findUnique({
    where: { id },
    include: { summary: true, feedback: true },
  });
}

export async function getArchive() {
  return prisma.dailyPick.findMany({
    orderBy: { date: "desc" },
    include: {
      books: {
        orderBy: { position: "asc" },
        include: { book: { include: { feedback: true } } },
      },
    },
  });
}

export async function getPreferenceStatus() {
  const ratedCount = await prisma.feedback.count();
  return {
    ratedCount,
    unlockThreshold: PREFERENCE_UNLOCK_THRESHOLD,
    personalized: ratedCount >= PREFERENCE_UNLOCK_THRESHOLD,
    remaining: Math.max(0, PREFERENCE_UNLOCK_THRESHOLD - ratedCount),
  };
}

export function asPages(value: unknown): SummaryPage[] {
  if (!Array.isArray(value)) return [];
  return value as SummaryPage[];
}
