import type { DailySeries, DailySeriesProvider } from "@/lib/market-data/daily-series";
import { MarketDataError } from "@/lib/market-data/errors";
import { CoinGeckoProvider } from "@/lib/market-data/providers/coingecko";
import { FredProvider } from "@/lib/market-data/providers/fred";
import { MarketDataStocksProvider } from "@/lib/market-data/providers/marketDataStocks";
import type { HistoricalRange } from "@/lib/market-data/types";
import { verifiedManualMarketSeries } from "@/lib/market-data/manual-snapshots";

export type AssetGroup = "Equities" | "Rates" | "FX & Commodities" | "Alternative Assets" | "Volatility";
type SourceProvider = "marketdata-stocks" | "fred" | "coingecko" | "manual" | "unavailable";
type ChangeKind = "percent" | "basisPoints";

export interface MarketInstrument {
  key: string;
  name: string;
  symbol: string;
  sourceSymbol: string;
  provider: SourceProvider;
  group: AssetGroup;
  decimals: number;
  changeKind: ChangeKind;
  unavailableReason?: string;
}

export interface MarketBoardQuote extends MarketInstrument {
  price: number | null;
  changePercent: number | null;
  changeLabel: string | null;
  updatedAt: string | null;
  marketStatus: "delayed" | "unavailable";
  source: string | null;
  sourceUrl: string | null;
  error?: string;
}

export const marketInstruments: MarketInstrument[] = [
  { key: "sp500", name: "S&P 500", symbol: "SPX", sourceSymbol: "SP500", provider: "fred", group: "Equities", decimals: 2, changeKind: "percent" },
  { key: "nasdaq100", name: "Nasdaq 100", symbol: "NDX", sourceSymbol: "NASDAQ100", provider: "fred", group: "Equities", decimals: 2, changeKind: "percent" },
  { key: "us10y", name: "US 10Y", symbol: "DGS10", sourceSymbol: "DGS10", provider: "fred", group: "Rates", decimals: 2, changeKind: "basisPoints" },
  { key: "dxy", name: "USD Broad Index", symbol: "DTWEXBGS", sourceSymbol: "DTWEXBGS", provider: "fred", group: "FX & Commodities", decimals: 2, changeKind: "percent" },
  { key: "gold", name: "Gold ETF", symbol: "GLD", sourceSymbol: "GLD", provider: "marketdata-stocks", group: "FX & Commodities", decimals: 2, changeKind: "percent" },
  { key: "wti", name: "WTI", symbol: "WTI Spot", sourceSymbol: "DCOILWTICO", provider: "fred", group: "FX & Commodities", decimals: 2, changeKind: "percent" },
  { key: "btc", name: "BTC", symbol: "BTC/USD", sourceSymbol: "CBBTCUSD", provider: "fred", group: "Alternative Assets", decimals: 0, changeKind: "percent" },
  { key: "vix", name: "VIX", symbol: "VIX", sourceSymbol: "VIXCLS", provider: "fred", group: "Volatility", decimals: 2, changeKind: "percent" },
  { key: "move", name: "MOVE", symbol: "MOVE", sourceSymbol: "MOVE", provider: "manual", group: "Volatility", decimals: 2, changeKind: "percent" },
];

const providers: Record<SourceProvider, DailySeriesProvider> = {
  "marketdata-stocks": new MarketDataStocksProvider(),
  fred: new FredProvider(),
  coingecko: new CoinGeckoProvider(),
  manual: {
    name: "manual",
    label: "Verified manual snapshot",
    isConfigured: () => true,
    async getDailySeries(symbol) {
      const series = verifiedManualMarketSeries[symbol];
      if (!series) throw new MarketDataError("Verified manual snapshot unavailable", "CONFIGURATION");
      return series;
    },
  },
  unavailable: {
    name: "unavailable",
    label: "Unavailable",
    isConfigured: () => false,
    async getDailySeries() { throw new MarketDataError("Data unavailable", "CONFIGURATION"); },
  },
};

function quoteFromSeries(instrument: MarketInstrument, series: DailySeries): MarketBoardQuote {
  const latest = series.points.at(-1)!;
  const previous = series.points.at(-2)!;
  const changePercent = ((latest.value / previous.value) - 1) * 100;
  const changeLabel = instrument.changeKind === "basisPoints"
    ? `${(latest.value - previous.value) * 100 >= 0 ? "+" : ""}${((latest.value - previous.value) * 100).toFixed(0)} bp`
    : `${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}%`;
  return { ...instrument, price: latest.value, changePercent, changeLabel, updatedAt: series.updatedAt, marketStatus: "delayed", source: series.source, sourceUrl: series.sourceUrl };
}

async function loadInstrumentSeries(instrument: MarketInstrument, range: HistoricalRange) {
  if (instrument.unavailableReason) throw new MarketDataError(instrument.unavailableReason, "CONFIGURATION");
  const provider = providers[instrument.provider];
  if (!provider.isConfigured()) throw new MarketDataError(`${provider.label} 未配置`, "CONFIGURATION");
  return provider.getDailySeries(instrument.sourceSymbol, range);
}

async function loadInstrumentQuote(instrument: MarketInstrument): Promise<MarketBoardQuote> {
  try { return quoteFromSeries(instrument, await loadInstrumentSeries(instrument, "1M")); }
  catch (error) { return { ...instrument, price: null, changePercent: null, changeLabel: null, updatedAt: null, marketStatus: "unavailable", source: null, sourceUrl: null, error: error instanceof Error ? error.message : "Data unavailable" }; }
}

async function mapLimited<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>) {
  const results: R[] = new Array(items.length); let cursor = 0;
  async function run() { while (cursor < items.length) { const index = cursor++; results[index] = await worker(items[index]); } }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run)); return results;
}

export function getMarketDataConfiguration() {
  return {
    marketData: providers["marketdata-stocks"].isConfigured(),
    fred: providers.fred.isConfigured(),
    coinGecko: false,
    cadence: "next-day-eod" as const,
  };
}

export async function getMarketBoard(): Promise<MarketBoardQuote[]> {
  return mapLimited(marketInstruments, 3, loadInstrumentQuote);
}

export async function getHomeMarketBoard() {
  const quotes = await getMarketBoard();
  let hpi: MarketBoardQuote = { key: "hpi", name: "Hunter Power Index", symbol: "HPI", sourceSymbol: "HPI", provider: "marketdata-stocks", group: "Equities", decimals: 2, changeKind: "percent", price: null, changePercent: null, changeLabel: null, updatedAt: null, marketStatus: "unavailable", source: null, sourceUrl: null, error: "Index data unavailable" };
  try {
    const { getMarketSnapshot } = await import("@/lib/marketData"); const snapshot = await getMarketSnapshot();
    hpi = { ...hpi, price: snapshot.latestValue, changePercent: snapshot.dailyChangePercent, changeLabel: `${snapshot.dailyChangePercent >= 0 ? "+" : ""}${snapshot.dailyChangePercent.toFixed(2)}%`, updatedAt: `${snapshot.dataDate}T21:00:00.000Z`, marketStatus: "delayed", source: snapshot.providerLabel, sourceUrl: "https://www.marketdata.app" };
  } catch { /* explicit unavailable state retained */ }
  return [...quotes.slice(0, 7), hpi];
}

export async function getNormalizedComparison(keys: string[], range: HistoricalRange) {
  const instruments = keys.flatMap((key) => { const instrument = marketInstruments.find((item) => item.key === key); return instrument ? [instrument] : []; });
  return mapLimited(instruments, 3, async (instrument) => {
    try {
      const series = await loadInstrumentSeries(instrument, range); const base = series.points[0]?.value;
      if (!base) return null;
      return { symbol: instrument.symbol, name: instrument.name, source: series.source, updatedAt: series.updatedAt, points: series.points.map((point) => ({ date: point.date, value: Number(((point.value / base) * 100).toFixed(2)) })) };
    } catch { return null; }
  }).then((items) => items.filter((item): item is NonNullable<typeof item> => item !== null));
}
