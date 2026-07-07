import { complete, llmModel } from "@/lib/llm";
import { SUMMARY_PAGE_COUNT, type SourceBook, type SummaryPage } from "@/lib/types";

// Fixed 10-page structure so every book reads consistently.
const PAGE_PLAN: { title: string; instruction: string }[] = [
  { title: "书籍概览", instruction: "What the book is, its central promise, and who it is for." },
  { title: "作者与背景", instruction: "The author, their background, and the context in which the book was written." },
  { title: "核心论点", instruction: "The single most important thesis or argument of the book." },
  { title: "关键概念 (一)", instruction: "The first major idea / framework, with a concrete example." },
  { title: "关键概念 (二)", instruction: "The second major idea / framework, with a concrete example." },
  { title: "关键概念 (三)", instruction: "The third major idea / framework, with a concrete example." },
  { title: "章节精华", instruction: "A walk through the book's structure and how the argument builds." },
  { title: "金句摘录", instruction: "5-8 memorable quotes or paraphrased lines that capture the book." },
  { title: "批判性评价", instruction: "Strengths, weaknesses, and who might disagree with the book." },
  { title: "行动清单", instruction: "Concrete takeaways the reader can apply, as a short list." },
];

interface RawPage {
  page: number;
  title: string;
  body: string;
}

function parsePages(text: string): SummaryPage[] {
  // The model returns a JSON array. Be forgiving about surrounding prose/fences.
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("No JSON array in model output");
  const json = text.slice(start, end + 1);
  const parsed = JSON.parse(json) as RawPage[];
  return parsed
    .slice(0, SUMMARY_PAGE_COUNT)
    .map((p, i) => ({
      page: i + 1,
      title: String(p.title ?? PAGE_PLAN[i]?.title ?? `Page ${i + 1}`),
      body: String(p.body ?? "").trim(),
    }));
}

// Map step: condense a long text into chunk notes so we stay within context.
async function condenseFullText(book: SourceBook, fullText: string): Promise<string> {
  const CHUNK = 40_000; // characters per chunk
  const MAX_CHUNKS = 12; // cap cost for very long books
  const chunks: string[] = [];
  for (let i = 0; i < fullText.length && chunks.length < MAX_CHUNKS; i += CHUNK) {
    chunks.push(fullText.slice(i, i + CHUNK));
  }

  // Process chunks sequentially. Free tiers (Groq/Gemini) have low
  // requests-per-minute limits, and a local Ollama model serves one at a time
  // anyway — so firing all chunks in parallel would only cause rate-limit errors.
  const notes: string[] = [];
  for (let idx = 0; idx < chunks.length; idx++) {
    notes.push(
      await complete(
        "You are a meticulous reading assistant. Summarize the excerpt into dense bullet notes capturing plot/argument, key ideas, and notable passages. No preamble.",
        `Book: "${book.title}" by ${book.author}.\nExcerpt ${idx + 1}/${chunks.length}:\n\n${chunks[idx]}`,
        1200,
      ),
    );
  }
  return notes.map((n, i) => `## Section ${i + 1}\n${n}`).join("\n\n");
}

function buildPagePrompt(book: SourceBook, sourceMaterial: string, basis: string): string {
  const plan = PAGE_PLAN.map((p, i) => `${i + 1}. ${p.title} — ${p.instruction}`).join("\n");
  return `Produce a ${SUMMARY_PAGE_COUNT}-page summary of the book below, in Simplified Chinese.

Book: "${book.title}" by ${book.author}
Basis for your summary: ${basis}

Source material:
${sourceMaterial}

Write exactly ${SUMMARY_PAGE_COUNT} pages following this plan (keep the titles):
${plan}

Each page's body should be 150-300 words, substantive and specific to THIS book (no filler).
Return ONLY a JSON array of objects: [{"page": 1, "title": "...", "body": "..."}, ...].`;
}

// Public entry point: generate a 10-page summary for a book.
export async function summarizeBook(
  book: SourceBook,
): Promise<{ pages: SummaryPage[]; model: string }> {
  let sourceMaterial: string;
  let basis: string;

  if (book.hasFullText && book.fullText) {
    sourceMaterial = await condenseFullText(book, book.fullText);
    basis = "the full text of the book (condensed notes above)";
  } else if (book.description) {
    sourceMaterial = book.description;
    basis =
      "the publisher description above PLUS your own knowledge of this book. If unsure about a detail, stay general rather than inventing specifics.";
  } else {
    sourceMaterial = "(no description available)";
    basis =
      "your own knowledge of this book. If you do not know it well, say so honestly on page 1 and keep claims general.";
  }

  const raw = await complete(
    "You are an expert book summarizer who writes clear, structured Simplified Chinese summaries. You never fabricate specific facts you are unsure of.",
    buildPagePrompt(book, sourceMaterial, basis),
    8000,
  );

  const pages = parsePages(raw);
  if (pages.length < SUMMARY_PAGE_COUNT) {
    // Pad defensively so the reader always has 10 pages.
    for (let i = pages.length; i < SUMMARY_PAGE_COUNT; i++) {
      pages.push({ page: i + 1, title: PAGE_PLAN[i].title, body: "（本页内容生成不完整。）" });
    }
  }
  return { pages, model: llmModel() };
}
