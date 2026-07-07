import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PREFERENCE_UNLOCK_THRESHOLD } from "@/lib/select";

// Record or update a like/dislike for a book. Sending the same value again
// clears it (toggle off).
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { bookId?: string; value?: "like" | "dislike" }
    | null;
  if (!body?.bookId || (body.value !== "like" && body.value !== "dislike")) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const existing = await prisma.feedback.findUnique({ where: { bookId: body.bookId } });

  let value: "like" | "dislike" | null;
  if (existing && existing.value === body.value) {
    await prisma.feedback.delete({ where: { bookId: body.bookId } });
    value = null;
  } else {
    await prisma.feedback.upsert({
      where: { bookId: body.bookId },
      create: { bookId: body.bookId, value: body.value },
      update: { value: body.value },
    });
    value = body.value;
  }

  const ratedCount = await prisma.feedback.count();
  return NextResponse.json({
    ok: true,
    value,
    ratedCount,
    unlockThreshold: PREFERENCE_UNLOCK_THRESHOLD,
    personalized: ratedCount >= PREFERENCE_UNLOCK_THRESHOLD,
  });
}
