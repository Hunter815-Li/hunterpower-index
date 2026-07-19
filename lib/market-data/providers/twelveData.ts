import type { AdjustedPricePoint } from "@/lib/calculateHunterIndex";
import { withMemoryCache } from "@/lib/market-data/cache";
import { MarketDataError } from "@/lib/market-data/errors";
import { fetchJsonWithRetry } from "@/lib/market-data/http";
import { getUsMarketStatus } from "@/lib/market-data/marketClock";
import type { MarketDataProvider, ProviderQuote, ProviderTrade } from "@/lib/market-data/types";

interface TwelveQuote { close?: string; previous_close?: string; change?: string; percent_change?: string; timestamp?: number; status?: string; message?: string }
interface TwelveSeries { values?: Array<{ datetime: string; close: string }>; status?: string; message?: string }

export class TwelveDataProvider implements MarketDataProvider {
  readonly name = "twelvedata" as const;
  readonly label = "Twelve Data";
  readonly supportsWebSocket = true;
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

  subscribe(tickers: string[], onTrade: (trade: ProviderTrade) => void, onError: (error: Error) => void) {
    if (typeof WebSocket === "undefined") throw new MarketDataError("当前服务运行环境不支持 WebSocket", "UPSTREAM");
    const socket = new WebSocket(`wss://ws.twelvedata.com/v1/quotes/price?apikey=${encodeURIComponent(this.apiKey)}`);
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    socket.addEventListener("open", () => {
      socket.send(JSON.stringify({ action: "subscribe", params: { symbols: tickers.join(",") } }));
      heartbeat = setInterval(() => socket.send(JSON.stringify({ action: "heartbeat" })), 10_000);
    });
    socket.addEventListener("message", (event) => {
      try {
        const item = JSON.parse(String(event.data)) as { event?: string; symbol?: string; price?: number; timestamp?: number };
        if (item.event === "price" && item.symbol && item.price) {
          const rawTimestamp = item.timestamp ?? Date.now();
          onTrade({ ticker: item.symbol, price: item.price, timestamp: rawTimestamp > 1_000_000_000_000 ? rawTimestamp : rawTimestamp * 1000 });
        }
      } catch (error) { onError(error instanceof Error ? error : new Error("Twelve Data WebSocket 消息无效")); }
    });
    socket.addEventListener("error", () => onError(new Error("Twelve Data WebSocket 连接失败")));
    return () => { if (heartbeat) clearInterval(heartbeat); socket.close(); };
  }
}
