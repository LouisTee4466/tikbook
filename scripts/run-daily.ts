// Run the daily pipeline from the command line: `npm run run:daily`
// Useful for local testing and for scheduling outside Vercel (e.g. cron).
import { runDailyPipeline } from "../src/lib/pipeline";

async function main() {
  const force = process.argv.includes("--force");
  const result = await runDailyPipeline(new Date(), { force });
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
