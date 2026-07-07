import { NextResponse } from "next/server";
import { after } from "next/server";
import { processGenerationStep } from "@/lib/generate";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function selfUrl(path: string): string | null {
  // 优先用公开的正式域名——部署专属的 VERCEL_URL 可能被 Vercel 访问保护拦截
  const base =
    process.env.APP_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : null);
  return base ? `${base}${path}` : null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// 执行一小步生成（最多 2 页）。
// ?chain=1 时（cron 场景，无浏览器驱动）：完成本步后在后台自动触发下一步，
// 接力直到今天三本书全部生成完。浏览器场景由前端轮询驱动，不需要 chain。
export async function POST(req: Request) {
  const chain = new URL(req.url).searchParams.get("chain") === "1";
  const result = await processGenerationStep(new Date());

  if (chain && !result.allDone && !result.error?.includes("还未创建")) {
    const next = selfUrl("/api/generate?chain=1");
    if (next) {
      after(async () => {
        await sleep(Math.min(result.retryInMs ?? 3000, 55_000));
        await fetch(next, { method: "POST" }).catch(() => {});
      });
    }
  }

  return NextResponse.json(result);
}
