import type { AdjustedPricePoint } from "@/lib/calculateHunterIndex";
import { withMemoryCache } from "@/lib/market-data/cache";
import { MarketDataError } from "@/lib/market-data/errors";
import { fetchJsonWithRetry } from "@/lib/market-data/http";
import { easternDate } from "@/lib/market-data/marketClock";
import type { MarketDataProvider, MarketStatus, ProviderQuote } from "@/lib/market-data/types";

const DAILY_CACHE_MS = 20 * 60 * 60 * 1000;
const DAILY_REVALIDATE_SECONDS = 20 * 60 * 60;

interface MarketDataCandleResponse {
  s?: "ok" | "error";
  c?: number[];
  t?: number[];
  errmsg?: string;
}

/**
 * Market Data daily-candle adapter.
 *
 * One split-adjusted candle request supplies both the one-year history and the
 * latest/previous close, keeping the daily credit usage to one request per symbol.
 */
export class MarketDataAppProvider implements MarketDataProvider {
  readonly name = "marketdata" as const;
  readonly label = "Market Data";

  private get apiToken() { return process.env.MARKETDATA_TOKEN?.trim() ?? ""; }

  isConfigured() { return Boolean(this.apiToken); }

  async getHistory(ticker: string): Promise<AdjustedPricePoint[]> {
    return withMemoryCache(`${this.name}:history:${ticker}`, DAILY_CACHE_MS, async () => {
      const url = new URL(`https://api.marketdata.app/v1/stocks/candles/D/${encodeURIComponent(ticker)}/`);
      url.searchParams.set("countback", "280");
      // The public research edition intentionally stops at least one calendar day
      // before today; non-trading days naturally resolve to the latest prior candle.
      url.searchParams.set("to", easternDate(Date.now() - 86_400_000));
      url.searchParams.set("adjustsplits", "true");
      const data = await fetchJsonWithRetry<MarketDataCandleResponse>(url, {
        provider: this.name,
        operation: "daily-history",
        ticker,
      }, {
        headers: { Authorization: `Bearer ${this.apiToken}` },
        next: { revalidate: DAILY_REVALIDATE_SECONDS, tags: ["market-data-eod"] },
      });

      if (data.s !== "ok" || !data.c?.length || !data.t?.length) {
        throw new MarketDataError(data.errmsg ?? `${ticker} 历史行情不足`, "INSUFFICIENT_DATA");
      }

      return data.t.map((timestamp, index) => ({
        date: new Date(timestamp * 1000).toISOString().slice(0, 10),
        adjustedClose: Number(data.c?.[index]),
      })).filter((point) => Number.isFinite(point.adjustedClose) && point.adjustedClose! > 0);
    });
  }

  async getQuote(ticker: string): Promise<ProviderQuote> {
    const history = await this.getHistory(ticker);
    const latest = history.at(-1);
    const previous = history.at(-2);
    if (!latest?.adjustedClose || !previous?.adjustedClose) {
      throw new MarketDataError(`${ticker} 收盘数据不足`, "INSUFFICIENT_DATA");
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

  async getMarketStatus(): Promise<MarketStatus> {
    return { session: "closed", checkedAt: new Date().toISOString() };
  }
}
