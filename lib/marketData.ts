import { constituents, type Constituent } from "@/data/constituents";
import {
  calculateHunterIndex,
  type AdjustedPricePoint,
  type HunterIndexPoint,
} from "@/lib/calculateHunterIndex";
import { clearMemoryCache, withMemoryCache } from "@/lib/market-data/cache";
import { MarketDataError } from "@/lib/market-data/errors";
import { easternDate } from "@/lib/market-data/marketClock";
import { getConfiguredProviderChain } from "@/lib/market-data/providers";
import type { MarketDataProvider, MarketDataProviderName, ProviderQuote } from "@/lib/market-data/types";

export { MarketDataError } from "@/lib/market-data/errors";

const DAILY_CACHE_MS = 20 * 60 * 60 * 1000;

export interface ConstituentPerformance extends Constituent {
  latestPrice: number;
  dailyReturn: number;
  oneMonthReturn: number | null;
  threeMonthReturn: number | null;
  oneYearReturn: number | null;
  contributionOneYear: number | null;
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
  source: MarketDataProviderName | "simulation" | "mixed";
  provider: MarketDataProviderName | "simulation";
  providerLabel: string;
  sourceLabel: string;
  cadence: "daily";
  dataDate: string;
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

interface LoadedTicker {
  ticker: string;
  history: AdjustedPricePoint[];
  quote: ProviderQuote;
  provider: MarketDataProvider;
}

const INDEX_TICKERS = [...constituents.map((item) => item.ticker), "SPY", "QQQ"];
const round = (value: number, digits = 2) => Number(value.toFixed(digits));

function priceAtOffset(history: AdjustedPricePoint[], offset: number) {
  return history.at(-1 - offset)?.adjustedClose ?? null;
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
  return new Map(history
    .filter((point) => point.adjustedClose)
    .map((point) => [point.date, round((point.adjustedClose! / base) * 100)]));
}

function quoteFromHistory(ticker: string, history: AdjustedPricePoint[]): ProviderQuote {
  const latest = history.at(-1);
  const previous = history.at(-2);
  if (!latest?.adjustedClose || !previous?.adjustedClose) {
    throw new MarketDataError(`${ticker} 历史数据不足`, "INSUFFICIENT_DATA");
  }
  const current = latest.adjustedClose;
  const previousClose = previous.adjustedClose;
  return {
    ticker,
    current,
    previousClose,
    change: current - previousClose,
    changePercent: ((current / previousClose) - 1) * 100,
    timestamp: Date.parse(`${latest.date}T21:00:00Z`),
  };
}

function formatUpdatedAt(dataDate: string) {
  return `${dataDate} 美股收盘`;
}

function buildSnapshot(loaded: LoadedTicker[], warnings: string[], simulation = false): MarketSnapshot {
  const histories = Object.fromEntries(loaded.map((item) => [item.ticker, item.history]));
  const providerNames = Array.from(new Set(loaded.map((item) => item.provider.name)));
  const providerCounts = loaded.reduce(
    (counts, item) => counts.set(item.provider.name, (counts.get(item.provider.name) ?? 0) + 1),
    new Map<MarketDataProviderName, number>(),
  );
  const primary = loaded.map((item) => item.provider)
    .sort((a, b) => (providerCounts.get(b.name) ?? 0) - (providerCounts.get(a.name) ?? 0))[0];
  if (!primary) throw new MarketDataError("没有可用行情，无法计算指数", "INSUFFICIENT_DATA");

  const source = simulation ? "simulation" : providerNames.length === 1 ? providerNames[0] : "mixed";
  const provider = simulation ? "simulation" : primary.name;
  const providerLabel = simulation ? "开发模拟数据" : providerNames.length > 1 ? `${primary.label}（含备用源）` : primary.label;

  const constituentHistories = Object.fromEntries(constituents.map(({ ticker }) => [ticker, histories[ticker] ?? []]));
  const calculated = calculateHunterIndex(constituentHistories);
  const indexSeries = calculated.points;
  if (!indexSeries.length) throw new MarketDataError("有效行情不足，无法计算指数", "INSUFFICIENT_DATA");

  const quoteByTicker = new Map(loaded.map((item) => [item.ticker, item.quote]));
  const performances = constituents.map((item) => {
    const history = histories[item.ticker] ?? [];
    const quote = quoteByTicker.get(item.ticker);
    const latest = quote?.current ?? history.at(-1)?.adjustedClose ?? 0;
    const oneYearReturn = returnFor(history, 251);
    return {
      ...item,
      latestPrice: round(latest),
      dailyReturn: round(quote?.changePercent ?? returnFor(history, 1) ?? 0),
      oneMonthReturn: returnFor(history, 21),
      threeMonthReturn: returnFor(history, 63),
      oneYearReturn,
      contributionOneYear: oneYearReturn === null ? null : round(oneYearReturn * item.weight),
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
  if (limited.length) warnings.push(`${limited.join("、")} 历史数据不足一年，年度收益显示为空`);

  return {
    source,
    provider,
    providerLabel,
    sourceLabel: `${providerLabel} · 延迟日线复权收盘价`,
    cadence: "daily",
    dataDate: latest.date,
    updatedAt: formatUpdatedAt(latest.date),
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

async function loadTicker(ticker: string, chain: MarketDataProvider[], warnings: string[]): Promise<LoadedTicker | null> {
  let lastError: unknown;
  for (const provider of chain) {
    try {
      const publicCutoffDate = easternDate(Date.now() - 86_400_000);
      const history = (await provider.getHistory(ticker)).filter((point) => point.date <= publicCutoffDate);
      const quote = quoteFromHistory(ticker, history);
      return { ticker, history, quote, provider };
    } catch (error) {
      lastError = error;
      warnings.push(`${provider.label} 获取 ${ticker} 失败，正在尝试备用数据源`);
    }
  }
  const message = lastError instanceof Error ? lastError.message : "行情不可用";
  warnings.push(`${ticker} 暂无有效行情，已从本次指数计算中跳过：${message}`);
  return null;
}

function businessDates(count: number) {
  const dates: string[] = [];
  const cursor = new Date();
  while (dates.length < count) {
    if (cursor.getDay() !== 0 && cursor.getDay() !== 6) dates.unshift(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() - 1);
  }
  return dates;
}

function buildDevelopmentSimulation(): MarketSnapshot {
  const dates = businessDates(262);
  const loaded = INDEX_TICKERS.map((ticker, tickerIndex) => {
    const history = dates.map((date, index) => ({
      date,
      adjustedClose: round(80 + tickerIndex * 4 + index * (0.08 + tickerIndex * 0.002) + Math.sin(index / 11 + tickerIndex) * 3, 4),
    }));
    return {
      ticker,
      history,
      quote: quoteFromHistory(ticker, history),
      provider: { name: "marketdata", label: "开发模拟数据" } as MarketDataProvider,
    };
  });
  return buildSnapshot(loaded, ["仅开发环境：未配置日线行情密钥，当前显示模拟数据"], true);
}

export async function getMarketSnapshot(options: { bypassCache?: boolean } = {}): Promise<MarketSnapshot> {
  const load = async () => {
    let chain: MarketDataProvider[];
    try {
      chain = getConfiguredProviderChain();
    } catch (error) {
      if (process.env.NODE_ENV !== "production" || process.env.ALLOW_MOCK_MARKET_DATA === "true") return buildDevelopmentSimulation();
      throw error;
    }

    const warnings: string[] = [];
    const results = await mapWithConcurrency(INDEX_TICKERS, 4, (ticker) => loadTicker(ticker, chain, warnings));
    const loaded = results.filter((item): item is LoadedTicker => item !== null);
    return buildSnapshot(loaded, Array.from(new Set(warnings)));
  };

  if (options.bypassCache) {
    clearMemoryCache("snapshot:");
    return load();
  }
  let providerKey = "unconfigured";
  try { providerKey = getConfiguredProviderChain().map((provider) => provider.name).join("-"); } catch { /* handled by load */ }
  return withMemoryCache(`snapshot:${providerKey}`, DAILY_CACHE_MS, load);
}
