import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tikbook · 每日三本书摘",
  description: "每天精选三本书，各生成十页摘要。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
