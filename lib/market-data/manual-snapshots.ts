import type { DailySeries } from "@/lib/market-data/daily-series";

export const verifiedManualMarketSeries: Readonly<Record<string, DailySeries>> = {
  MOVE: {
    symbol: "MOVE",
    source: "ICE BofA MOVE via Investing.com",
    sourceUrl: "https://ca.investing.com/indices/ice-bofaml-move-historical-data",
    updatedAt: "2026-07-22T00:00:00.000Z",
    points: [
      { date: "2026-07-17", value: 70.88 },
      { date: "2026-07-20", value: 72.66 },
    ],
  },
};
