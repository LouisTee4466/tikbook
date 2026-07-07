import Link from "next/link";
import BookCover from "@/components/BookCover";
import { getArchive } from "@/lib/queries";
import { reasonTag } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  const days = await getArchive();

  return (
    <div className="container">
      <div className="topbar">
        <div className="brand">
          Tik<span>book</span>
        </div>
        <nav className="nav">
          <Link href="/">今日</Link>
          <Link href="/archive">归档</Link>
        </nav>
      </div>

      <div className="section-title">全部归档</div>

      {days.length === 0 ? (
        <div className="empty">还没有历史记录。</div>
      ) : (
        days.map((day) => (
          <div key={day.id} style={{ marginBottom: 30 }}>
            <div style={{ fontWeight: 700, margin: "10px 0 12px" }}>{day.date}</div>
            <div className="grid">
              {day.books.map(({ book, reason }) => (
                <Link className="card" href={`/book/${book.id}`} key={book.id}>
                  <div className="cover">
                    <BookCover title={book.title} author={book.author} coverUrl={book.coverUrl} />
                  </div>
                  <div className="body">
                    <span className={`tag ${reasonTag(reason).cls}`}>{reasonTag(reason).label}</span>
                    <div className="title">{book.title}</div>
                    <span className="author">{book.author}</span>
                    {book.feedback && (
                      <span style={{ fontSize: 13 }}>
                        {book.feedback.value === "like" ? "👍 已喜欢" : "👎 不喜欢"}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
