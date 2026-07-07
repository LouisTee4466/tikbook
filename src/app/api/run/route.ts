import { NextResponse } from "next/server";
import { ensureDailyPick } from "@/lib/pipeline";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// 手动触发：只做「选出今日三本」（快，不调用 LLM）。
// 摘要生成由前端轮询 /api/generate 分批完成。?force=1 重新选书。
export async function POST(req: Request) {
  const force = new URL(req.url).searchParams.get("force") === "1";
  try {
    const result = await ensureDailyPick(new Date(), { force });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("ensure daily pick failed:", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
