"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RunButton({ hasPick }: { hasPick: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/run${hasPick ? "?force=1" : ""}`, { method: "POST" });
      const data = await res.json();
      if (!data.ok) setError(data.error ?? "生成失败");
      else router.refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <button className="btn primary" onClick={run} disabled={busy}>
        {busy ? "生成中…（约 1-2 分钟）" : hasPick ? "重新生成今日三本" : "生成今日三本"}
      </button>
      {error && <span style={{ color: "var(--accent)", fontSize: 13 }}>{error}</span>}
    </div>
  );
}
