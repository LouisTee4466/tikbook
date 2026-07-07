import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tikbook · 每日三本书摘",
  description: "每天精选三本书，各生成十页摘要。",
  appleWebApp: {
    capable: true,
    title: "Tikbook", // iOS 添加到主屏幕时的名字
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#b4472e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
