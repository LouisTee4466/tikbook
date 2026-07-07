"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import FeedbackButtons from "@/components/FeedbackButtons";
import type { SummaryPage } from "@/lib/types";

type Size = "s" | "m" | "l";

export default function Reader({
  bookId,
  title,
  author,
  coverUrl,
  pages,
  initialFeedback,
}: {
  bookId: string;
  title: string;
  author: string;
  coverUrl: string | null;
  pages: SummaryPage[];
  initialFeedback: "like" | "dislike" | null;
}) {
  // index 0 = cover, 1..N = summary pages
  const total = pages.length + 1;
  const [index, setIndex] = useState(0);
  const [size, setSize] = useState<Size>("m");
  const [tocOpen, setTocOpen] = useState(false);

  const go = useCallback(
    (next: number) => setIndex((cur) => Math.min(total - 1, Math.max(0, next))),
    [total],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, go]);

  const cycleSize = () => setSize((s) => (s === "s" ? "m" : s === "m" ? "l" : "s"));
  const progress = Math.round(((index + 1) / total) * 100);
  const onCover = index === 0;
  const current = onCover ? null : pages[index - 1];

  return (
    <div className={`reader size-${size}`}>
      <div className="reader-top">
        <div className="tools">
          <button className="icon-btn" onClick={() => setTocOpen((v) => !v)} title="目录" aria-label="目录">
            ☰
          </button>
          <Link href="/" className="icon-btn" title="返回" aria-label="返回">
            ←
          </Link>
        </div>
        <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink-soft)" }}>{title}</div>
        <div className="tools">
          <button className="icon-btn" onClick={cycleSize} title="字号" aria-label="字号">
            A<sup style={{ fontSize: 11 }}>A</sup>
          </button>
          <FeedbackButtons bookId={bookId} initial={initialFeedback} />
        </div>
      </div>

      <div className="reader-stage">
        {tocOpen && (
          <div className="toc">
            <h3>目录</h3>
            <ul>
              <li className={onCover ? "current" : ""} onClick={() => { go(0); setTocOpen(false); }}>
                <span className="num">·</span> 封面
              </li>
              {pages.map((p, i) => (
                <li
                  key={p.page}
                  className={index === i + 1 ? "current" : ""}
                  onClick={() => { go(i + 1); setTocOpen(false); }}
                >
                  <span className="num">{p.page}</span> {p.title}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button className="pager" onClick={() => go(index - 1)} disabled={index === 0} aria-label="上一页">
          ‹
        </button>

        {onCover ? (
          <div className="page cover-page">
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="big-cover" src={coverUrl} alt={title} />
            ) : (
              <div className="big-cover" />
            )}
            <h1>{title}</h1>
            <div className="author">{author}</div>
            <div style={{ marginTop: 8, color: "var(--ink-soft)", fontSize: 14 }}>
              10 页摘要 · 点击右侧箭头或按 → 开始
            </div>
          </div>
        ) : (
          <div className="page">
            <div className="page-inner">
              <h2>{current!.title}</h2>
              {current!.body.split(/\n{2,}/).map((para, i) => (
                <p key={i}>{para.trim()}</p>
              ))}
            </div>
          </div>
        )}

        <button
          className="pager"
          onClick={() => go(index + 1)}
          disabled={index === total - 1}
          aria-label="下一页"
        >
          ›
        </button>
      </div>

      <div className="reader-bottom">
        <span>{progress}%</span>
        <div className="progress-track">
          <i style={{ width: `${progress}%` }} />
        </div>
        <span>{onCover ? "封面" : `第 ${index} 页 / 共 ${pages.length} 页`}</span>
      </div>
    </div>
  );
}
