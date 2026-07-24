import type { HistoricalRange } from "@/lib/market-data/types";

export interface DailySeriesPoint {
  date: string;
  value: number;
}

export interface DailySeries {
  symbol: string;
  points: DailySeriesPoint[];
  source: string;
  sourceUrl: string;
  updatedAt: string;
}

export interface DailySeriesProvider {
  readonly name: string;
  readonly label: string;
  isConfigured(): boolean;
  getDailySeries(symbol: string, range: HistoricalRange): Promise<DailySeries>;
}

export const RANGE_DAYS: Record<HistoricalRange, number> = {
  "1M": 35,
  "3M": 100,
  "6M": 190,
  YTD: 370,
  "1Y": 370,
  "3Y": 1_100,
  MAX: 5_000,
};

export function rangeStart(range: HistoricalRange) {
  if (range === "YTD") return `${new Date().getUTCFullYear()}-01-01`;
  const days = RANGE_DAYS[range];
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}
