import { constituents, type Constituent } from "@/data/constituents";
import {
  calculateHunterIndex,
  type AdjustedPricePoint,
  type HunterIndexPoint,
} from "@/lib/calculateHunterIndex";

export interface ConstituentPerformance extends Constituent {
  latestPrice: number;
  dailyReturn: number;
  oneMonthReturn: number | null;
  threeMonthReturn: number | null;
  oneYearReturn: number | null;
  contributionOneYear: number | null;
  history: AdjustedPricePoint[];
  dataStatus: "complete" | "limited";
}

export interface SectorPerformance {
  sector: string;
  count: number;
  equalWeight: number;
  averageOneYearReturn: number;
  contribution: number;
}

export interface ComparisonPoint {
  date: string;
  hunter: number;
  sp500: number;
  nasdaq100: number;
}

export interface MarketSnapshot {
  source: "simulation" | "twelvedata" | "mixed";
  sourceLabel: string;
  updatedAt: string;
  baseDate: string;
  baseValue: 100;
  latestValue: number;
  dailyChange: number;
  dailyChangePercent: number;
  constituentCount: number;
  indexSeries: HunterIndexPoint[];
  comparisonSeries: ComparisonPoint[];
  constituents: ConstituentPerformance[];
  sectors: SectorPerformance[];
  warnings: string[];
}

export class MarketDataError extends Error {
  constructor(
    message: string,
    public code: "TIMEOUT" | "RATE_LIMIT" | "INVALID_SYMBOL" | "UPSTREAM" | "INSUFFICIENT_DATA",
  ) {
    super(message);
  }
}

const BASE_PRICES: Record<string, number> = {
  GEV: 510, ETN: 378, HUBB: 436, PWR: 405, POWL: 245, VRT: 154,
  CEG: 338, VST: 213, NEE: 84, DUK: 125, SO: 96, EXC: 48,
  AEP: 113, XEL: 79, NRG: 166, BWXT: 178, SMR: 46, OKLO: 69,
  FLNC: 9.8, STEM: 1.4, SPY: 626, QQQ: 562,
};

const TRENDS: Record<string, number> = {
  GEV: 0.55, ETN: 0.18, HUBB: 0.16, PWR: 0.39, POWL: 0.44, VRT: 0.62,
  CEG: 0.47, VST: 0.49, NEE: 0.08, DUK: 0.12, SO: 0.16, EXC: 0.06,
  AEP: 0.14, XEL: 0.1, NRG: 0.45, BWXT: 0.36, SMR: 0.72, OKLO: 0.88,
  FLNC: -0.28, STEM: -0.55, SPY: 0.15, QQQ: 0.2,
};

const VOLATILITY: Record<string, number> = {
  SMR: 0.045, OKLO: 0.052, FLNC: 0.038, STEM: 0.06, VRT: 0.032,
  GEV: 0.028, NRG: 0.027, CEG: 0.026, VST: 0.028, QQQ: 0.015,
  SPY: 0.01,
};

const LIMITED_HISTORY: Record<string, number> = { OKLO: 168, SMR: 205, STEM: 225 };
const round = (value: number, digits = 2) => Number(value.toFixed(digits));

function hashString(value: string) {
  return Array.from(value).reduce((hash, char) => Math.imul(hash ^ char.charCodeAt(0), 2654435761), 2166136261) >>> 0;
}

function seededRandom(seed: number) {
  let state = seed || 1;
  return () => {
    state = Math.imul(1664525, state) + 1013904223 >>> 0;
    return state / 4294967296;
  };
}

function businessDates(count: number) {
  const dates: string[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (dates.length < count) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) dates.unshift(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() - 1);
  }
  return dates;
}

function generateMockSeries(ticker: string, dates: string[]): AdjustedPricePoint[] {
  const random = seededRandom(hashString(ticker));
  const startIndex = Math.max(0, dates.length - (LIMITED_HISTORY[ticker] ?? dates.length));
  const annualTrend = TRENDS[ticker] ?? 0.12;
  const volatility = VOLATILITY[ticker] ?? 0.018;
  const target = BASE_PRICES[ticker] ?? 100;
  let value = target / (1 + annualTrend);
  const series: AdjustedPricePoint[] = [];

  for (let index = startIndex; index < dates.length; index += 1) {
    const cyclical = Math.sin((index + hashString(ticker) % 31) / 16) * 0.0025;
    const shock = (random() + random() + random() - 1.5) * volatility;
    const drift = Math.log(1 + annualTrend) / 252;
    value *= Math.exp(drift + cyclical + shock);
    series.push({ date: dates[index], adjustedClose: round(Math.max(0.2, value), 4) });
  }

  const scale = target / (series.at(-1)?.adjustedClose ?? target);
  return series.map((point) => ({ ...point, adjustedClose: round(point.adjustedClose! * scale, 4) }));
}

function priceAtOffset(history: AdjustedPricePoint[], offset: number) {
  const point = history.at(-1 - offset);
  return point?.adjustedClose ?? null;
}

function returnFor(history: AdjustedPricePoint[], offset: number) {
  const latest = history.at(-1)?.adjustedClose;
  const previous = priceAtOffset(history, offset);
  if (!latest || !previous) return null;
  return round(((latest / previous) - 1) * 100);
}

function normalizeSeries(history: AdjustedPricePoint[]) {
  const base = history.find((point) => point.adjustedClose)?.adjustedClose;
  if (!base) return new Map<string, number>();
  return new Map(history.filter((point) => point.adjustedClose).map((point) => [point.date, round((point.adjustedClose! / base) * 100)]));
}

function buildSnapshot(
  histories: Record<string, AdjustedPricePoint[]>,
  source: MarketSnapshot["source"],
  warnings: string[],
): MarketSnapshot {
  const constituentHistories = Object.fromEntries(constituents.map(({ ticker }) => [ticker, histories[ticker] ?? []]));
  const calculated = calculateHunterIndex(constituentHistories);
  const indexSeries = calculated.points;
  if (!indexSeries.length) throw new MarketDataError("有效行情不足，无法计算指数", "INSUFFICIENT_DATA");

  const performances = constituents.map((item) => {
    const history = histories[item.ticker] ?? [];
    const latest = history.at(-1)?.adjustedClose ?? 0;
    const oneYearReturn = returnFor(history, 251);
    return {
      ...item,
      latestPrice: round(latest),
      dailyReturn: returnFor(history, 1) ?? 0,
      oneMonthReturn: returnFor(history, 21),
      threeMonthReturn: returnFor(history, 63),
      oneYearReturn,
      contributionOneYear: oneYearReturn === null ? null : round(oneYearReturn * item.weight),
      history,
      dataStatus: history.length >= 252 ? "complete" as const : "limited" as const,
    };
  });

  const sectorNames = Array.from(new Set(constituents.map((item) => item.sector)));
  const sectors = sectorNames.map((sector) => {
    const members = performances.filter((item) => item.sector === sector);
    const validReturns = members.map((item) => item.oneYearReturn).filter((value): value is number => value !== null);
    const average = validReturns.length ? validReturns.reduce((sum, value) => sum + value, 0) / validReturns.length : 0;
    return {
      sector,
      count: members.length,
      equalWeight: round(members.reduce((sum, item) => sum + item.weight, 0) * 100),
      averageOneYearReturn: round(average),
      contribution: round(members.reduce((sum, item) => sum + (item.contributionOneYear ?? 0), 0)),
    };
  }).sort((a, b) => b.contribution - a.contribution);

  const spyMap = normalizeSeries(histories.SPY ?? []);
  const qqqMap = normalizeSeries(histories.QQQ ?? []);
  const comparisonSeries = indexSeries.map((point) => ({
    date: point.date,
    hunter: point.value,
    sp500: spyMap.get(point.date) ?? 100,
    nasdaq100: qqqMap.get(point.date) ?? 100,
  }));

  const latest = indexSeries.at(-1)!;
  const previous = indexSeries.at(-2) ?? latest;
  const limited = performances.filter((item) => item.dataStatus === "limited").map((item) => item.ticker);
  if (limited.length) warnings.push(`${limited.join("、")} 上市或有效行情不足一年，年度收益按可用区间展示为空`);

  return {
    source,
    sourceLabel: source === "simulation" ? "模拟行情 · 可交互预览" : source === "mixed" ? "实时与模拟混合数据" : "Twelve Data 实时行情",
    updatedAt: `${latest.date} 16:00 ET`,
    baseDate: indexSeries[0].date,
    baseValue: 100,
    latestValue: latest.value,
    dailyChange: round(latest.value - previous.value),
    dailyChangePercent: latest.dailyReturn,
    constituentCount: constituents.length,
    indexSeries,
    comparisonSeries,
    constituents: performances,
    sectors,
    warnings: [...warnings, ...calculated.warnings],
  };
}

async function fetchTwelveDataSeries(ticker: string, apiKey: string): Promise<AdjustedPricePoint[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const url = new URL("https://api.twelvedata.com/time_series");
    url.searchParams.set("symbol", ticker);
    url.searchParams.set("interval", "1day");
    url.searchParams.set("outputsize", "280");
    url.searchParams.set("order", "ASC");
    url.searchParams.set("apikey", apiKey);
    const response = await fetch(url, { signal: controller.signal });
    if (response.status === 429) throw new MarketDataError("行情服务请求过于频繁", "RATE_LIMIT");
    if (!response.ok) throw new MarketDataError(`行情服务返回 ${response.status}`, "UPSTREAM");
    const payload = await response.json() as { status?: string; code?: number; message?: string; values?: Array<{ datetime: string; close: string }> };
    if (payload.code === 429) throw new MarketDataError(payload.message ?? "API 限流", "RATE_LIMIT");
    if (payload.status === "error" || !payload.values) throw new MarketDataError(payload.message ?? `${ticker} 代码无效`, "INVALID_SYMBOL");
    return payload.values
      .map((item) => ({ date: item.datetime.slice(0, 10), adjustedClose: Number(item.close) }))
      .filter((item) => Number.isFinite(item.adjustedClose));
  } catch (error) {
    if (error instanceof MarketDataError) throw error;
    if (error instanceof Error && error.name === "AbortError") throw new MarketDataError(`${ticker} 行情请求超时`, "TIMEOUT");
    throw new MarketDataError(`${ticker} 行情请求失败`, "UPSTREAM");
  } finally {
    clearTimeout(timeout);
  }
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>) {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

export async function getMarketSnapshot(): Promise<MarketSnapshot> {
  const dates = businessDates(262);
  const tickers = [...constituents.map((item) => item.ticker), "SPY", "QQQ"];
  const mock = Object.fromEntries(tickers.map((ticker) => [ticker, generateMockSeries(ticker, dates)]));
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) return buildSnapshot(mock, "simulation", ["未配置行情 API 密钥，当前使用确定性模拟行情"]);

  const warnings: string[] = [];
  let successful = 0;
  const entries = await mapWithConcurrency(tickers, 4, async (ticker) => {
    try {
      const series = await fetchTwelveDataSeries(ticker, apiKey);
      if (series.length < 2) throw new MarketDataError(`${ticker} 数据不足`, "INSUFFICIENT_DATA");
      successful += 1;
      return [ticker, series] as const;
    } catch (error) {
      const message = error instanceof Error ? error.message : `${ticker} 行情不可用`;
      warnings.push(`${message}，已回退到模拟数据`);
      return [ticker, mock[ticker]] as const;
    }
  });

  return buildSnapshot(Object.fromEntries(entries), successful === tickers.length ? "twelvedata" : "mixed", warnings);
}
