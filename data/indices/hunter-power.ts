import { constituents } from "@/data/constituents";
import type { IndexDefinition } from "@/lib/index-engine/types";

export const hunterPowerIndex: IndexDefinition = {
  slug: "hunter-power",
  name: "Hunter Power Index",
  nameZh: "Hunter 电力指数",
  ticker: "HPI",
  baseValue: 100,
  currency: "USD",
  weighting: "Equal Weight",
  rebalance: "Quarterly",
  benchmarks: ["SPY", "QQQ", "XLU"],
  constituents,
};
