import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tikbook · 每日三本书摘",
    short_name: "Tikbook", // 主屏幕图标下显示的名字
    description: "每天自动精选三本书，各配十页中文摘要。",
    start_url: "/",
    display: "standalone", // 从主屏幕打开时全屏、无浏览器地址栏
    background_color: "#f4f1ea",
    theme_color: "#b4472e",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
