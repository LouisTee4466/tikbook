import { NextResponse } from "next/server";
import { after } from "next/server";
import { ensureDailyPick } from "@/lib/pipeline";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// 每日定时任务：选出今日三本，然后启动后台接力生成
// （/api/generate?chain=1 会一步步自我调用直到 30 页全部完成）。
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await ensureDailyPick(new Date());

    const base =
      process.env.APP_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
    if (base) {
      after(async () => {
        await fetch(`${base}/api/generate?chain=1`, { method: "POST" }).catch(() => {});
      });
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("daily cron failed:", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
