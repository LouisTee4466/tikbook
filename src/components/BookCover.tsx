// 书籍封面：有真实封面图就用图；没有则渲染一个设计感的生成式封面
// （按书名哈希取色 + 竖排式排版），保证每本书都有封面。
// 服务端组件友好（纯展示，无状态）。

const PALETTES: [string, string, string][] = [
  ["#2c3e50", "#4ca1af", "#f5f0e8"],
  ["#5d4157", "#a8caba", "#fdf8f2"],
  ["#845007", "#d8a034", "#fff8ec"],
  ["#1d4350", "#a43931", "#fdf1ec"],
  ["#3a4a2b", "#8fa66a", "#f7f8ef"],
  ["#4b2c4f", "#b06a8f", "#fbf2f7"],
  ["#23404e", "#116064", "#eef7f6"],
  ["#6d3b2c", "#c1683e", "#fdf3ec"],
];

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export default function BookCover({
  title,
  author,
  coverUrl,
}: {
  title: string;
  author: string;
  coverUrl?: string | null;
}) {
  if (coverUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="cover-img" src={coverUrl} alt={title} />;
  }

  // 展示时去掉括号里的英文原名，主标题更醒目
  const zhTitle = title.replace(/\s*[(（].*[)）]\s*$/, "").trim() || title;
  const [c1, c2, text] = PALETTES[hashCode(title) % PALETTES.length];

  return (
    <div
      className="gen-cover"
      style={{ background: `linear-gradient(155deg, ${c1} 0%, ${c2} 100%)`, color: text }}
    >
      <span className="gen-cover-rule" style={{ background: text }} />
      <span className="gen-cover-title">{zhTitle}</span>
      <span className="gen-cover-author">{author}</span>
    </div>
  );
}
