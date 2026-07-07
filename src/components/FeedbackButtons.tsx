"use client";

import { useState } from "react";

export default function FeedbackButtons({
  bookId,
  initial,
}: {
  bookId: string;
  initial: "like" | "dislike" | null;
}) {
  const [value, setValue] = useState<"like" | "dislike" | null>(initial);
  const [busy, setBusy] = useState(false);

  async function send(next: "like" | "dislike") {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, value: next }),
      });
      const data = await res.json();
      if (data.ok) setValue(data.value);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fb" onClick={(e) => e.stopPropagation()}>
      <button
        className={`like ${value === "like" ? "active like" : ""}`}
        onClick={() => send("like")}
        disabled={busy}
        title="喜欢"
        aria-label="喜欢"
      >
        👍
      </button>
      <button
        className={`dislike ${value === "dislike" ? "active dislike" : ""}`}
        onClick={() => send("dislike")}
        disabled={busy}
        title="不喜欢"
        aria-label="不喜欢"
      >
        👎
      </button>
    </div>
  );
}
