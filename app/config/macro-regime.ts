export type MacroRegimeDirection = "up" | "down" | "flat";
export type MacroRegimeScore = 1 | 2 | 3 | 4 | 5;

export interface MacroRegimeItem {
  id: "growth" | "inflation" | "liquidity" | "risk-appetite";
  name: string;
  nameZh: string;
  score: MacroRegimeScore | null;
  direction: MacroRegimeDirection | null;
  comment: string;
  commentZh: string;
  updatedAt: string | null;
}

/**
 * Editorial configuration only. Scores, directions and comments are human
 * research judgements; they must never be generated from market data.
 */
export const macroRegime: readonly MacroRegimeItem[] = [
  {
    id: "growth",
    name: "Growth",
    nameZh: "增长",
    score: null,
    direction: null,
    comment: "Awaiting the researcher's current growth assessment.",
    commentZh: "等待研究者更新当前增长判断。",
    updatedAt: null,
  },
  {
    id: "inflation",
    name: "Inflation",
    nameZh: "通胀",
    score: null,
    direction: null,
    comment: "Awaiting the researcher's current inflation assessment.",
    commentZh: "等待研究者更新当前通胀判断。",
    updatedAt: null,
  },
  {
    id: "liquidity",
    name: "Liquidity",
    nameZh: "流动性",
    score: null,
    direction: null,
    comment: "Awaiting the researcher's current liquidity assessment.",
    commentZh: "等待研究者更新当前流动性判断。",
    updatedAt: null,
  },
  {
    id: "risk-appetite",
    name: "Risk Appetite",
    nameZh: "风险偏好",
    score: null,
    direction: null,
    comment: "Awaiting the researcher's current risk-appetite assessment.",
    commentZh: "等待研究者更新当前风险偏好判断。",
    updatedAt: null,
  },
] as const;
