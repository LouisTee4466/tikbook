import { notFound } from "next/navigation";
import Reader from "./Reader";
import { asPages, getBookWithSummary } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = await getBookWithSummary(id);
  if (!book) notFound();

  const pages = asPages(book.summary?.pages);
  if (pages.length === 0) {
    return (
      <div className="container">
        <div className="empty">
          这本书的摘要还没生成。<br />
          <a href="/" style={{ color: "var(--accent)" }}>
            返回首页
          </a>
        </div>
      </div>
    );
  }

  return (
    <Reader
      bookId={book.id}
      title={book.title}
      author={book.author}
      coverUrl={book.coverUrl}
      pages={pages}
      initialFeedback={(book.feedback?.value as "like" | "dislike") ?? null}
    />
  );
}
