import Link from "next/link";
import BookCover from "@/components/BookCover";
import FeedbackButtons from "@/components/FeedbackButtons";
import RunButton from "@/components/RunButton";
import { asPages, getLatestDailyPick, getPreferenceStatus } from "@/lib/queries";
import { reasonTag } from "@/lib/ui";

export const dynamic = "force-dynamic";

function TopBar() {
  return (
    <div className="topbar">
      <div className="brand">
        Tik<span>book</span>
      </div>
      <nav className="nav">
        <Link href="/">今日</Link>
        <Link href="/archive">归档</Link>
      </nav>
    </div>
  );
}

function PreferenceBar({
  ratedCount,
  unlockThreshold,
  personalized,
  remaining,
}: {
  ratedCount: number;
  unlockThreshold: number;
  personalized: boolean;
  remaining: number;
}) {
  const pct = Math.min(100, Math.round((ratedCount / unlockThreshold) * 100));
  return (
    <div className={`pref ${personalized ? "unlocked" : ""}`}>
      {personalized ? (
        <>✅ 个性化推荐已解锁 · 每日三本中 1 本按你的偏好挑选，2 本随机探索。</>
      ) : (
        <>
          再评价 <b>{remaining}</b> 本书解锁个性化推荐（已评价 {ratedCount}/{unlockThreshold}）。
          在此之前，每天都是随机去重选书。
          <div className="bar">
            <i style={{ width: `${pct}%` }} />
          </div>
        </>
      )}
    </div>
  );
}

export default async function Home() {
  const [pick, pref] = await Promise.all([getLatestDailyPick(), getPreferenceStatus()]);
  const incomplete = Boolean(pick && pick.books.some(({ book }) => !book.summary?.complete));

  return (
    <div className="container">
      <TopBar />
      <PreferenceBar {...pref} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="section-title" style={{ margin: 0 }}>
          {pick ? `${pick.date} · 今日三本` : "还没有今日选书"}
        </div>
        <RunButton hasPick={Boolean(pick)} incomplete={incomplete} />
      </div>

      {!pick ? (
        <div className="empty">
          点击右上角「生成今日三本」开始，大约需要 1-2 分钟。
          <br />
          之后每天会自动生成，无需手动操作。
        </div>
      ) : (
        <div className="grid" style={{ marginTop: 16 }}>
          {pick.books.map(({ book, reason }) => (
            <div className="card" key={book.id}>
              <Link href={`/book/${book.id}`} className="cover">
                <BookCover title={book.title} author={book.author} coverUrl={book.coverUrl} />
              </Link>
              <div className="body">
                <span className={`tag ${reasonTag(reason).cls}`}>{reasonTag(reason).label}</span>
                <Link href={`/book/${book.id}`} className="title">
                  {book.title}
                </Link>
                <span className="author">{book.author}</span>
                <div className="foot">
                  <FeedbackButtons
                    bookId={book.id}
                    initial={(book.feedback?.value as "like" | "dislike") ?? null}
                  />
                  {book.summary?.complete ? (
                    <Link href={`/book/${book.id}`} style={{ fontSize: 13, color: "var(--accent)" }}>
                      阅读 10 页 →
                    </Link>
                  ) : (
                    <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                      ✍️ 生成中 {asPages(book.summary?.pages).length}/10
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
