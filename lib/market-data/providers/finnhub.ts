import type { AdjustedPricePoint } from "@/lib/calculateHunterIndex";
import { withMemoryCache } from "@/lib/market-data/cache";
import { MarketDataError } from "@/lib/market-data/errors";
import { fetchJsonWithRetry } from "@/lib/market-data/http";
import { getUsMarketStatus } from "@/lib/market-data/marketClock";
import type { MarketDataProvider, MarketStatus, ProviderQuote, ProviderTrade } from "@/lib/market-data/types";

interface FinnhubQuoteResponse { c?: number; d?: number; dp?: number; pc?: number; t?: number }
interface FinnhubCandleResponse { s?: string; c?: number[]; t?: number[] }
interface FinnhubMarketStatusResponse { isOpen?: boolean }

export class FinnhubProvider implements MarketDataProvider {
  readonly name = "finnhub" as const;
  readonly label = "Finnhub";
  readonly supportsWebSocket = true;

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

  subscribe(tickers: string[], onTrade: (trade: ProviderTrade) => void, onError: (error: Error) => void) {
    if (typeof WebSocket === "undefined") throw new MarketDataError("当前服务运行环境不支持 WebSocket", "UPSTREAM");
    const socket = new WebSocket(`wss://ws.finnhub.io?token=${encodeURIComponent(this.apiKey)}`);
    socket.addEventListener("open", () => {
      tickers.forEach((ticker) => socket.send(JSON.stringify({ type: "subscribe", symbol: ticker })));
    });
    socket.addEventListener("message", (event) => {
      try {
        const payload = JSON.parse(String(event.data)) as { type?: string; data?: Array<{ s?: string; p?: number; t?: number }> };
        if (payload.type !== "trade") return;
        payload.data?.forEach((item) => {
          if (item.s && item.p && item.t) onTrade({ ticker: item.s, price: item.p, timestamp: item.t });
        });
      } catch (error) {
        onError(error instanceof Error ? error : new Error("Finnhub WebSocket 消息无效"));
      }
    });
    socket.addEventListener("error", () => onError(new Error("Finnhub WebSocket 连接失败")));
    return () => {
      if (socket.readyState === WebSocket.OPEN) tickers.forEach((ticker) => socket.send(JSON.stringify({ type: "unsubscribe", symbol: ticker })));
      socket.close();
    };
  }
}
