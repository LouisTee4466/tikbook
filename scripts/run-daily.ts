// 命令行执行每日流水线：npm run run:daily [-- --force]
// 选出今日三本后，分批接力生成摘要直到完成（自动处理限流等待）。
import { ensureDailyPick } from "../src/lib/pipeline";
import { processGenerationStep } from "../src/lib/generate";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const force = process.argv.includes("--force");
  const picked = await ensureDailyPick(new Date(), { force });
  console.log("picked:", JSON.stringify(picked));

  for (let i = 0; i < 300; i++) {
    const step = await processGenerationStep(new Date());
    const done = step.books.reduce((s, b) => s + b.pagesDone, 0);
    const total = step.books.reduce((s, b) => s + b.total, 0);
    console.log(`progress ${done}/${total}${step.error ? ` (${step.error})` : ""}`);
    if (step.allDone) {
      console.log("all done ✅");
      process.exit(0);
    }
    await sleep(Math.min(step.retryInMs ?? 1500, 60_000));
  }
  console.error("did not finish within step limit");
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
