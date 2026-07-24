import { withMemoryCache } from "@/lib/market-data/cache";
import type { DailySeries, DailySeriesProvider } from "@/lib/market-data/daily-series";
import { rangeStart } from "@/lib/market-data/daily-series";
import { MarketDataError } from "@/lib/market-data/errors";
import { fetchJsonWithRetry } from "@/lib/market-data/http";
import type { HistoricalRange } from "@/lib/market-data/types";

const DAILY_CACHE_MS = 20 * 60 * 60 * 1000;
const DAILY_REVALIDATE_SECONDS = 20 * 60 * 60;

interface FredResponse {
  observations?: Array<{ date?: string; value?: string }>;
  error_message?: string;
}

export class FredProvider implements DailySeriesProvider {
  readonly name = "fred";
  readonly label = "FRED";
  private get apiKey() { return process.env.FRED_API_KEY?.trim() ?? ""; }
  isConfigured() { return Boolean(this.apiKey); }

  async getDailySeries(symbol: string, range: HistoricalRange): Promise<DailySeries> {
    if (!this.isConfigured()) throw new MarketDataError("FRED_API_KEY 未配置", "CONFIGURATION");
    return withMemoryCache(`${this.name}:daily:${symbol}:${range}`, DAILY_CACHE_MS, async () => {
      const url = new URL("https://api.stlouisfed.org/fred/series/observations");
      url.searchParams.set("series_id", symbol);
      url.searchParams.set("api_key", this.apiKey);
      url.searchParams.set("file_type", "json");
      url.searchParams.set("observation_start", rangeStart(range));
      url.searchParams.set("sort_order", "asc");
      const data = await fetchJsonWithRetry<FredResponse>(url, { provider: this.name, operation: "series-observations", ticker: symbol }, { next: { revalidate: DAILY_REVALIDATE_SECONDS, tags: ["market-board-eod"] } });
      const points = (data.observations ?? []).flatMap((item) => {
        const value = Number(item.value);
        return item.date && Number.isFinite(value) ? [{ date: item.date, value }] : [];
      });
      if (points.length < 2) throw new MarketDataError(data.error_message ?? `${symbol} FRED 日线数据不足`, "INSUFFICIENT_DATA");
      const source = symbol === "CBBTCUSD"
        ? "Coinbase Bitcoin via FRED"
        : "Federal Reserve Bank of St. Louis (FRED)";
      return { symbol, points, source, sourceUrl: `https://fred.stlouisfed.org/series/${encodeURIComponent(symbol)}`, updatedAt: `${points.at(-1)!.date}T00:00:00.000Z` };
    });
  }
}
