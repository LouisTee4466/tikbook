import { NextResponse } from "next/server";
import { runDailyPipeline } from "@/lib/pipeline";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Triggered daily by Vercel Cron. Protected by CRON_SECRET.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await runDailyPipeline(new Date());
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("daily pipeline failed:", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
