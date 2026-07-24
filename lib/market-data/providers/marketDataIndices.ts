import { withMemoryCache } from "@/lib/market-data/cache";
import type { DailySeries, DailySeriesProvider } from "@/lib/market-data/daily-series";
import { RANGE_DAYS } from "@/lib/market-data/daily-series";
import { MarketDataError } from "@/lib/market-data/errors";
import { fetchJsonWithRetry } from "@/lib/market-data/http";
import { easternDate } from "@/lib/market-data/marketClock";
import type { HistoricalRange } from "@/lib/market-data/types";

const DAILY_CACHE_MS = 20 * 60 * 60 * 1000;
const DAILY_REVALIDATE_SECONDS = 20 * 60 * 60;
interface IndexCandleResponse { s?: "ok" | "error"; c?: number[]; t?: number[]; errmsg?: string }

export class MarketDataIndicesProvider implements DailySeriesProvider {
  readonly name = "marketdata-indices";
  readonly label = "Market Data Indices";
  private get apiToken() { return process.env.MARKETDATA_TOKEN?.trim() ?? ""; }
  isConfigured() { return Boolean(this.apiToken); }

  async getDailySeries(symbol: string, range: HistoricalRange): Promise<DailySeries> {
    if (!this.isConfigured()) throw new MarketDataError("MARKETDATA_TOKEN 未配置", "CONFIGURATION");
    return withMemoryCache(`${this.name}:daily:${symbol}:${range}`, DAILY_CACHE_MS, async () => {
      const url = new URL(`https://api.marketdata.app/v1/indices/candles/D/${encodeURIComponent(symbol)}/`);
      url.searchParams.set("countback", String(RANGE_DAYS[range]));
      url.searchParams.set("to", easternDate(Date.now() - 86_400_000));
      const data = await fetchJsonWithRetry<IndexCandleResponse>(url, { provider: this.name, operation: "daily-index-candles", ticker: symbol }, { headers: { Authorization: `Bearer ${this.apiToken}` }, next: { revalidate: DAILY_REVALIDATE_SECONDS, tags: ["market-board-eod"] } });
      if (data.s !== "ok" || !data.c?.length || !data.t?.length) throw new MarketDataError(data.errmsg ?? `${symbol} 指数日线数据不足`, "INSUFFICIENT_DATA");
      const points = data.t.flatMap((timestamp, index) => { const value = Number(data.c?.[index]); return Number.isFinite(value) ? [{ date: new Date(timestamp * 1000).toISOString().slice(0, 10), value }] : []; });
      if (points.length < 2) throw new MarketDataError(`${symbol} 指数日线数据不足`, "INSUFFICIENT_DATA");
      return { symbol, points, source: "Market Data", sourceUrl: "https://www.marketdata.app", updatedAt: `${points.at(-1)!.date}T21:00:00.000Z` };
    });
  }
}
