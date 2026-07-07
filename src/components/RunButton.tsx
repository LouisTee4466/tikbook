"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface BookProgress {
  bookId: string;
  title: string;
  pagesDone: number;
  total: number;
}

interface StepResult {
  allDone: boolean;
  worked: boolean;
  books: BookProgress[];
  retryInMs?: number;
  error?: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function RunButton({
  hasPick,
  incomplete,
}: {
  hasPick: boolean;
  incomplete: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const running = useRef(false);

  // 页面打开时如果今天的摘要还没生成完（比如中途关过页面），自动续跑。
  useEffect(() => {
    if (incomplete && !running.current) void drive(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomplete]);

  async function drive(needSelect: boolean, force = false) {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError(null);
    try {
      if (needSelect) {
        setStatus("正在挑选今日三本…");
        const res = await fetch(`/api/run${force ? "?force=1" : ""}`, { method: "POST" });
        const data = await res.json();
        if (!data.ok) {
          setError(data.error ?? "选书失败");
          return;
        }
        router.refresh();
      }

      // 分批接力生成，直到全部完成（撞限流会按服务端建议的间隔等待）
      for (let i = 0; i < 200; i++) {
        const res = await fetch("/api/generate", { method: "POST" });
        const step = (await res.json()) as StepResult;

        if (step.books?.length) {
          const done = step.books.reduce((s, b) => s + b.pagesDone, 0);
          const total = step.books.reduce((s, b) => s + b.total, 0);
          const current = step.books.find((b) => b.pagesDone < b.total);
          setStatus(
            current
              ? `生成中 ${done}/${total} 页 · 《${current.title.replace(/\s*\(.*\)$/, "")}》`
              : `生成中 ${done}/${total} 页`,
          );
        }
        if (step.worked) router.refresh();

        if (step.allDone) {
          setStatus(null);
          router.refresh();
          return;
        }
        await sleep(Math.min(step.retryInMs ?? 2500, 60_000));
      }
      setError("生成超时，刷新页面后点按钮可继续");
    } catch (e) {
      setError(String(e));
    } finally {
      running.current = false;
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <button
        className="btn primary"
        onClick={() => drive(true, hasPick && !incomplete)}
        disabled={busy}
      >
        {busy
          ? (status ?? "生成中…")
          : incomplete
            ? "继续生成"
            : hasPick
              ? "重新生成今日三本"
              : "生成今日三本"}
      </button>
      {error && <span style={{ color: "var(--accent)", fontSize: 13 }}>{error}</span>}
    </div>
  );
}
