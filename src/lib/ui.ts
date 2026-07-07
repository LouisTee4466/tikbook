// 选书原因 → 卡片标签文案与样式
export function reasonTag(reason: string): { label: string; cls: string } {
  if (reason === "business") return { label: "商业·营销", cls: "biz" };
  if (reason === "preference") return { label: "偏好推荐", cls: "pref" };
  return { label: "探索发现", cls: "" };
}
