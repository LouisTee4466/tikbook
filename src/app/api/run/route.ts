import { NextResponse } from "next/server";
import { runDailyPipeline } from "@/lib/pipeline";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Manual trigger for local development ("生成今日三本").
// Pass ?force=1 to regenerate today's pick.
export async function POST(req: Request) {
  const force = new URL(req.url).searchParams.get("force") === "1";
  try {
    const result = await runDailyPipeline(new Date(), { force });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("manual run failed:", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
