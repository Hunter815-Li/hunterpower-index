import { constituents, type Constituent } from "@/data/constituents";
import {
  calculateHunterIndex,
  type AdjustedPricePoint,
  type HunterIndexPoint,
} from "@/lib/calculateHunterIndex";
import { withMemoryCache } from "@/lib/market-data/cache";
import { MarketDataError } from "@/lib/market-data/errors";
import { easternDate, getUsMarketStatus } from "@/lib/market-data/marketClock";
import { getConfiguredProviderChain, getProviderByName } from "@/lib/market-data/providers";
import type {
  MarketDataProvider,
  MarketDataProviderName,
  MarketSession,
  ProviderQuote,
  ProviderTrade,
} from "@/lib/market-data/types";

export { MarketDataError } from "@/lib/market-data/errors";

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
  source: MarketDataProviderName | "simulation" | "mixed";
  provider: MarketDataProviderName | "simulation";
  providerLabel: string;
  sourceLabel: string;
  marketSession: MarketSession;
  transport: "rest" | "websocket";
  streamAvailable: boolean;
  refreshIntervalMs: 30000;
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

export interface RealtimeMarketUpdate {
  kind: "market-update";
  provider: MarketDataProviderName | "simulation";
  providerLabel: string;
  sourceLabel: string;
  marketSession: MarketSession;
  transport: "websocket";
  updatedAt: string;
  latestValue: number;
  dailyChange: number;
  dailyChangePercent: number;
  latestIndexPoint: HunterIndexPoint;
  latestComparisonPoint: ComparisonPoint;
  constituents: Array<Pick<ConstituentPerformance,
    "ticker" | "latestPrice" | "dailyReturn" | "oneMonthReturn" | "threeMonthReturn" | "oneYearReturn" | "contributionOneYear" | "dataStatus"
  >>;
  sectors: SectorPerformance[];
}

interface LoadedTicker {
  ticker: string;
  history: AdjustedPricePoint[];
  quote: ProviderQuote;
  provider: MarketDataProvider;
}

const INDEX_TICKERS = [...constituents.map((item) => item.ticker), "SPY", "QQQ"];
const round = (value: number, digits = 2) => Number(value.toFixed(digits));

type LiveTradeStore = Map<string, ProviderTrade>;
const globalMarket = globalThis as typeof globalThis & { __hunterLiveTrades?: LiveTradeStore };
const liveTrades = globalMarket.__hunterLiveTrades ?? new Map<string, ProviderTrade>();
globalMarket.__hunterLiveTrades = liveTrades;

function liveTradeKey(provider: MarketDataProviderName, ticker: string) {
  return `${provider}:${ticker}`;
}

export function recordRealtimeTrade(provider: MarketDataProviderName, trade: ProviderTrade) {
  const key = liveTradeKey(provider, trade.ticker);
  const current = liveTrades.get(key);
  if (!current || trade.timestamp >= current.timestamp) liveTrades.set(key, trade);
}

function mergeLatestQuote(history: AdjustedPricePoint[], quote: ProviderQuote): AdjustedPricePoint[] {
  const points = new Map(history.map((point) => [point.date, point]));
  points.set(easternDate(quote.timestamp), { date: easternDate(quote.timestamp), adjustedClose: quote.current });
  return Array.from(points.values()).sort((a, b) => a.date.localeCompare(b.date));
}

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
  return new Map(history.filter((point) => point.adjustedClose).map((point) => [point.date, round((point.adjustedClose! / base) * 100)]));
}

function formatUpdatedAt(timestamp: number) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(timestamp)) + " ET";
}

function buildSnapshot(
  loaded: LoadedTicker[],
  session: MarketSession,
  warnings: string[],
  simulation = false,
): MarketSnapshot {
  const histories = Object.fromEntries(loaded.map((item) => [item.ticker, mergeLatestQuote(item.history, item.quote)]));
  const providerNames = Array.from(new Set(loaded.map((item) => item.provider.name)));
  const providerCounts = loaded.reduce((counts, item) => counts.set(item.provider.name, (counts.get(item.provider.name) ?? 0) + 1), new Map<MarketDataProviderName, number>());
  const primary = loaded.map((item) => item.provider).sort((a, b) => (providerCounts.get(b.name) ?? 0) - (providerCounts.get(a.name) ?? 0))[0];
  if (!primary) throw new MarketDataError("没有可用行情，无法计算指数", "INSUFFICIENT_DATA");
  const source = simulation ? "simulation" : providerNames.length === 1 ? providerNames[0] : "mixed";
  const provider = simulation ? "simulation" : primary.name;
  const providerLabel = simulation ? "开发模拟数据" : providerNames.length > 1 ? `${primary.label}（含备用源）` : primary.label;
  const transport = session === "open" && !simulation && primary.supportsWebSocket ? "websocket" : "rest";
  const streamAvailable = transport === "websocket";

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
  if (limited.length) warnings.push(`${limited.join("、")} 历史数据不足一年，年度收益显示为空`);
  const quoteTimestamps = loaded.map((item) => item.quote.timestamp).filter(Number.isFinite);
  const latestTimestamp = quoteTimestamps.length ? Math.max(...quoteTimestamps) : Date.now();

  return {
    source,
    provider,
    providerLabel,
    sourceLabel: `${providerLabel} · ${transport === "websocket" ? "WebSocket 实时" : "REST 行情"}`,
    marketSession: session,
    transport,
    streamAvailable,
    refreshIntervalMs: 30_000,
    updatedAt: formatUpdatedAt(latestTimestamp),
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
      const [history, restQuote] = await Promise.all([provider.getHistory(ticker), provider.getQuote(ticker)]);
      if (history.length < 2) throw new MarketDataError(`${ticker} 历史数据不足`, "INSUFFICIENT_DATA");
      const trade = liveTrades.get(liveTradeKey(provider.name, ticker));
      const quote = trade && trade.timestamp >= restQuote.timestamp
        ? {
            ...restQuote,
            current: trade.price,
            change: trade.price - restQuote.previousClose,
            changePercent: ((trade.price / restQuote.previousClose) - 1) * 100,
            timestamp: trade.timestamp,
          }
        : restQuote;
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
    const current = history.at(-1)!.adjustedClose!;
    const previousClose = history.at(-2)!.adjustedClose!;
    return {
      ticker,
      history,
      quote: { ticker, current, previousClose, change: current - previousClose, changePercent: ((current / previousClose) - 1) * 100, timestamp: Date.now() },
      provider: { name: "finnhub", label: "开发模拟数据", supportsWebSocket: false } as MarketDataProvider,
    };
  });
  return buildSnapshot(loaded, getUsMarketStatus().session, ["仅开发环境：未配置行情 API Key，当前显示模拟数据"], true);
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
    const marketStatus = await chain[0].getMarketStatus().catch(() => getUsMarketStatus());
    const results = await mapWithConcurrency(INDEX_TICKERS, 4, (ticker) => loadTicker(ticker, chain, warnings));
    const loaded = results.filter((item): item is LoadedTicker => item !== null);
    return buildSnapshot(loaded, marketStatus.session, Array.from(new Set(warnings)));
  };

  if (options.bypassCache) return load();
  let providerKey = "unconfigured";
  try { providerKey = getConfiguredProviderChain().map((provider) => provider.name).join("-"); } catch { /* handled by load */ }
  return withMemoryCache(`snapshot:${providerKey}`, 10_000, load);
}

export async function getRealtimeProvider() {
  const snapshot = await getMarketSnapshot();
  const provider = snapshot.provider === "simulation"
    ? getConfiguredProviderChain()[0]
    : getProviderByName(snapshot.provider);
  const marketStatus = await provider.getMarketStatus().catch(() => ({ session: snapshot.marketSession, checkedAt: new Date().toISOString() }));
  return { provider, marketStatus, tickers: INDEX_TICKERS };
}

export function toRealtimeMarketUpdate(snapshot: MarketSnapshot): RealtimeMarketUpdate {
  return {
    kind: "market-update",
    provider: snapshot.provider,
    providerLabel: snapshot.providerLabel,
    sourceLabel: `${snapshot.providerLabel} · WebSocket 实时`,
    marketSession: snapshot.marketSession,
    transport: "websocket",
    updatedAt: snapshot.updatedAt,
    latestValue: snapshot.latestValue,
    dailyChange: snapshot.dailyChange,
    dailyChangePercent: snapshot.dailyChangePercent,
    latestIndexPoint: snapshot.indexSeries.at(-1)!,
    latestComparisonPoint: snapshot.comparisonSeries.at(-1)!,
    constituents: snapshot.constituents.map((item) => ({
      ticker: item.ticker,
      latestPrice: item.latestPrice,
      dailyReturn: item.dailyReturn,
      oneMonthReturn: item.oneMonthReturn,
      threeMonthReturn: item.threeMonthReturn,
      oneYearReturn: item.oneYearReturn,
      contributionOneYear: item.contributionOneYear,
      dataStatus: item.dataStatus,
    })),
    sectors: snapshot.sectors,
  };
}
