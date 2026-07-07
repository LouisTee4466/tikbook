// A single page of a generated summary.
export interface SummaryPage {
  page: number; // 1..10
  title: string;
  body: string; // markdown-ish plain text
}

export const SUMMARY_PAGE_COUNT = 10;

// Normalized book coming out of a source adapter, before it is persisted.
export interface SourceBook {
  source: "pool" | "gutenberg" | "googlebooks";
  externalId: string;
  title: string;
  author: string;
  coverUrl?: string;
  description?: string;
  hasFullText: boolean;
  genres: string[];
  topics: string[];
  publishYear?: number;
  // Full text, only present for gutenberg books. Used for map-reduce summary.
  fullText?: string;
}

export type FeedbackValue = "like" | "dislike";
export type PickReason = "preference" | "exploration";
