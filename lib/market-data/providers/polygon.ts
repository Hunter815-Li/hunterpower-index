import type { AdjustedPricePoint } from "@/lib/calculateHunterIndex";
import { withMemoryCache } from "@/lib/market-data/cache";
import { MarketDataError } from "@/lib/market-data/errors";
import { fetchJsonWithRetry } from "@/lib/market-data/http";
import { getUsMarketStatus } from "@/lib/market-data/marketClock";
import type { MarketDataProvider, ProviderQuote, ProviderTrade } from "@/lib/market-data/types";

interface PolygonSnapshot {
  ticker?: { lastTrade?: { p?: number; t?: number }; prevDay?: { c?: number }; todaysChange?: number; todaysChangePerc?: number };
}
interface PolygonAggregates { results?: Array<{ c?: number; t?: number }>; status?: string }

export class PolygonProvider implements MarketDataProvider {
  readonly name = "polygon" as const;
  readonly label = "Polygon";
  readonly supportsWebSocket = true;
  private get apiKey() { return process.env.POLYGON_API_KEY?.trim() ?? ""; }
  isConfigured() { return Boolean(this.apiKey); }

  async getQuote(ticker: string): Promise<ProviderQuote> {
    return withMemoryCache(`${this.name}:quote:${ticker}`, 10_000, async () => {
      const url = new URL(`https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/${encodeURIComponent(ticker)}`);
      url.searchParams.set("apiKey", this.apiKey);
      const data = await fetchJsonWithRetry<PolygonSnapshot>(url, { provider: this.name, operation: "quote", ticker });
      const current = data.ticker?.lastTrade?.p;
      if (!current || current <= 0) throw new MarketDataError(`${ticker} 行情无效`, "INVALID_SYMBOL");
      const previousClose = data.ticker?.prevDay?.c || current;
      return {
        ticker,
        current,
        previousClose,
        change: data.ticker?.todaysChange ?? current - previousClose,
        changePercent: data.ticker?.todaysChangePerc ?? ((current / previousClose) - 1) * 100,
        timestamp: Math.floor((data.ticker?.lastTrade?.t ?? Date.now() * 1_000_000) / 1_000_000),
      };
    });
  }

  async getHistory(ticker: string): Promise<AdjustedPricePoint[]> {
    return withMemoryCache(`${this.name}:history:${ticker}`, 15 * 60_000, async () => {
      const end = new Date().toISOString().slice(0, 10);
      const start = new Date(Date.now() - 400 * 86_400_000).toISOString().slice(0, 10);
      const url = new URL(`https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(ticker)}/range/1/day/${start}/${end}`);
      url.searchParams.set("adjusted", "true");
      url.searchParams.set("sort", "asc");
      url.searchParams.set("limit", "5000");
      url.searchParams.set("apiKey", this.apiKey);
      const data = await fetchJsonWithRetry<PolygonAggregates>(url, { provider: this.name, operation: "history", ticker });
      if (!data.results?.length) throw new MarketDataError(`${ticker} 历史行情不足`, "INSUFFICIENT_DATA");
      return data.results.map((item) => ({ date: new Date(item.t ?? 0).toISOString().slice(0, 10), adjustedClose: item.c ?? null }));
    });
  }

  async getMarketStatus() { return getUsMarketStatus(); }

  subscribe(tickers: string[], onTrade: (trade: ProviderTrade) => void, onError: (error: Error) => void) {
    if (typeof WebSocket === "undefined") throw new MarketDataError("当前服务运行环境不支持 WebSocket", "UPSTREAM");
    const socket = new WebSocket("wss://socket.polygon.io/stocks");
    socket.addEventListener("open", () => socket.send(JSON.stringify({ action: "auth", params: this.apiKey })));
    socket.addEventListener("message", (event) => {
      try {
        const parsed = JSON.parse(String(event.data)) as { ev?: string; sym?: string; p?: number; t?: number; status?: string } | Array<{ ev?: string; sym?: string; p?: number; t?: number; status?: string }>;
        const items = Array.isArray(parsed) ? parsed : [parsed];
        if (items.some((item) => item.status === "auth_success")) {
          socket.send(JSON.stringify({ action: "subscribe", params: tickers.map((ticker) => `T.${ticker}`).join(",") }));
        }
        items.filter((item) => item.ev === "T" && item.sym && item.p && item.t).forEach((item) => onTrade({ ticker: item.sym!, price: item.p!, timestamp: item.t! }));
      } catch (error) { onError(error instanceof Error ? error : new Error("Polygon WebSocket 消息无效")); }
    });
    socket.addEventListener("error", () => onError(new Error("Polygon WebSocket 连接失败")));
    return () => socket.close();
  }
}
