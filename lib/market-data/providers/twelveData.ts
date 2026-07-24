import type { AdjustedPricePoint } from "@/lib/calculateHunterIndex";
import { withMemoryCache } from "@/lib/market-data/cache";
import { MarketDataError } from "@/lib/market-data/errors";
import { fetchJsonWithRetry } from "@/lib/market-data/http";
import { getUsMarketStatus } from "@/lib/market-data/marketClock";
import { BaseMarketDataProvider } from "@/lib/market-data/provider-base";
import type { MarketDataProvider, ProviderQuote } from "@/lib/market-data/types";

interface TwelveQuote { close?: string; previous_close?: string; change?: string; percent_change?: string; timestamp?: number; status?: string; message?: string }
interface TwelveSeries { values?: Array<{ datetime: string; close: string }>; status?: string; message?: string }

export class TwelveDataProvider extends BaseMarketDataProvider implements MarketDataProvider {
  readonly name = "twelvedata" as const;
  readonly label = "Twelve Data";
  private get apiKey() { return process.env.TWELVE_DATA_API_KEY?.trim() ?? ""; }
  isConfigured() { return Boolean(this.apiKey); }

  async getQuote(ticker: string): Promise<ProviderQuote> {
    return withMemoryCache(`${this.name}:quote:${ticker}`, 10_000, async () => {
      const url = new URL("https://api.twelvedata.com/quote");
      url.searchParams.set("symbol", ticker);
      url.searchParams.set("apikey", this.apiKey);
      const data = await fetchJsonWithRetry<TwelveQuote>(url, { provider: this.name, operation: "quote", ticker });
      const current = Number(data.close);
      if (data.status === "error" || !Number.isFinite(current) || current <= 0) throw new MarketDataError(data.message ?? `${ticker} 行情无效`, "INVALID_SYMBOL");
      const previousClose = Number(data.previous_close) || current;
      return {
        ticker,
        current,
        previousClose,
        change: Number(data.change) || current - previousClose,
        changePercent: Number(data.percent_change) || ((current / previousClose) - 1) * 100,
        timestamp: (data.timestamp ?? Math.floor(Date.now() / 1000)) * 1000,
      };
    });
  }

  async getHistory(ticker: string): Promise<AdjustedPricePoint[]> {
    return withMemoryCache(`${this.name}:history:${ticker}`, 15 * 60_000, async () => {
      const url = new URL("https://api.twelvedata.com/time_series");
      url.searchParams.set("symbol", ticker);
      url.searchParams.set("interval", "1day");
      url.searchParams.set("outputsize", "280");
      url.searchParams.set("order", "ASC");
      url.searchParams.set("apikey", this.apiKey);
      const data = await fetchJsonWithRetry<TwelveSeries>(url, { provider: this.name, operation: "history", ticker });
      if (data.status === "error" || !data.values?.length) throw new MarketDataError(data.message ?? `${ticker} 历史行情不足`, "INSUFFICIENT_DATA");
      return data.values.map((item) => ({ date: item.datetime.slice(0, 10), adjustedClose: Number(item.close) })).filter((item) => Number.isFinite(item.adjustedClose));
    });
  }

  async getMarketStatus() { return getUsMarketStatus(); }
}
