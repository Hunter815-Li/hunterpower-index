export const marketRegime = {
  updatedAt: "待首次维护",
  dimensions: [
    { name: "Growth", signal: "Unrated", score: 50, view: "等待研究者更新增长判断。" },
    { name: "Inflation", signal: "Unrated", score: 50, view: "等待研究者更新通胀判断。" },
    { name: "Liquidity", signal: "Unrated", score: 50, view: "等待研究者更新流动性判断。" },
    { name: "Risk Appetite", signal: "Unrated", score: 50, view: "等待研究者更新风险偏好判断。" },
  ],
} as const;
