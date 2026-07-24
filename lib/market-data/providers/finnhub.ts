import type { AdjustedPricePoint } from "@/lib/calculateHunterIndex";
import { withMemoryCache } from "@/lib/market-data/cache";
import { MarketDataError } from "@/lib/market-data/errors";
import { fetchJsonWithRetry } from "@/lib/market-data/http";
import { getUsMarketStatus } from "@/lib/market-data/marketClock";
import { BaseMarketDataProvider } from "@/lib/market-data/provider-base";
import type { MarketDataProvider, MarketStatus, ProviderQuote } from "@/lib/market-data/types";

interface FinnhubQuoteResponse { c?: number; d?: number; dp?: number; pc?: number; t?: number }
interface FinnhubCandleResponse { s?: string; c?: number[]; t?: number[] }
interface FinnhubMarketStatusResponse { isOpen?: boolean }

export class FinnhubProvider extends BaseMarketDataProvider implements MarketDataProvider {
  readonly name = "finnhub" as const;
  readonly label = "Finnhub";

  private get apiKey() { return process.env.FINNHUB_API_KEY?.trim() ?? ""; }

  isConfigured() { return Boolean(this.apiKey); }

  async getQuote(ticker: string): Promise<ProviderQuote> {
    return withMemoryCache(`${this.name}:quote:${ticker}`, 10_000, async () => {
      const url = new URL("https://finnhub.io/api/v1/quote");
      url.searchParams.set("symbol", ticker);
      url.searchParams.set("token", this.apiKey);
      const data = await fetchJsonWithRetry<FinnhubQuoteResponse>(url, { provider: this.name, operation: "quote", ticker });
      if (!data.c || data.c <= 0) throw new MarketDataError(`${ticker} 行情无效`, "INVALID_SYMBOL");
      const previousClose = data.pc && data.pc > 0 ? data.pc : data.c;
      return {
        ticker,
        current: data.c,
        previousClose,
        change: data.d ?? data.c - previousClose,
        changePercent: data.dp ?? ((data.c / previousClose) - 1) * 100,
        timestamp: (data.t ?? Math.floor(Date.now() / 1000)) * 1000,
      };
    });
  }

  async getHistory(ticker: string): Promise<AdjustedPricePoint[]> {
    return withMemoryCache(`${this.name}:history:${ticker}`, 15 * 60_000, async () => {
      const to = Math.floor(Date.now() / 1000);
      const from = to - 400 * 24 * 60 * 60;
      const url = new URL("https://finnhub.io/api/v1/stock/candle");
      url.searchParams.set("symbol", ticker);
      url.searchParams.set("resolution", "D");
      url.searchParams.set("from", String(from));
      url.searchParams.set("to", String(to));
      url.searchParams.set("token", this.apiKey);
      const data = await fetchJsonWithRetry<FinnhubCandleResponse>(url, { provider: this.name, operation: "history", ticker });
      if (data.s !== "ok" || !data.c || !data.t) throw new MarketDataError(`${ticker} 历史行情不足`, "INSUFFICIENT_DATA");
      return data.t.map((timestamp, index) => ({
        date: new Date(timestamp * 1000).toISOString().slice(0, 10),
        adjustedClose: Number(data.c?.[index]),
      })).filter((point) => Number.isFinite(point.adjustedClose) && point.adjustedClose! > 0);
    });
  }

  async getMarketStatus(): Promise<MarketStatus> {
    return withMemoryCache(`${this.name}:market-status`, 60_000, async () => {
      try {
        const url = new URL("https://finnhub.io/api/v1/stock/market-status");
        url.searchParams.set("exchange", "US");
        url.searchParams.set("token", this.apiKey);
        const data = await fetchJsonWithRetry<FinnhubMarketStatusResponse>(url, { provider: this.name, operation: "market-status" });
        return { session: data.isOpen ? "open" : "closed", checkedAt: new Date().toISOString() };
      } catch (error) {
        console.warn(JSON.stringify({ level: "warn", event: "market_status_fallback", provider: this.name, message: error instanceof Error ? error.message : String(error) }));
        return getUsMarketStatus();
      }
    });
  }
}
