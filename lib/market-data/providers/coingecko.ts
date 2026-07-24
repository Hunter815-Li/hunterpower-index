import { withMemoryCache } from "@/lib/market-data/cache";
import type { DailySeries, DailySeriesProvider } from "@/lib/market-data/daily-series";
import { rangeStart } from "@/lib/market-data/daily-series";
import { MarketDataError } from "@/lib/market-data/errors";
import { fetchJsonWithRetry } from "@/lib/market-data/http";
import type { HistoricalRange } from "@/lib/market-data/types";

const DAILY_CACHE_MS = 20 * 60 * 60 * 1000;
const DAILY_REVALIDATE_SECONDS = 20 * 60 * 60;
interface CoinGeckoChart { prices?: Array<[number, number]>; status?: { error_message?: string } }

export class CoinGeckoProvider implements DailySeriesProvider {
  readonly name = "coingecko";
  readonly label = "CoinGecko";
  isConfigured() { return true; }

  async getDailySeries(symbol: string, range: HistoricalRange): Promise<DailySeries> {
    if (symbol !== "bitcoin") throw new MarketDataError(`${symbol} 暂未配置 CoinGecko 映射`, "INVALID_SYMBOL");
    return withMemoryCache(`${this.name}:daily:${symbol}:${range}`, DAILY_CACHE_MS, async () => {
      const yesterday = new Date(); yesterday.setUTCDate(yesterday.getUTCDate() - 1); yesterday.setUTCHours(23, 59, 59, 0);
      const from = Math.floor(Date.parse(`${rangeStart(range)}T00:00:00Z`) / 1000);
      const url = new URL(`https://api.coingecko.com/api/v3/coins/${symbol}/market_chart/range`);
      url.searchParams.set("vs_currency", "usd"); url.searchParams.set("from", String(from)); url.searchParams.set("to", String(Math.floor(yesterday.getTime() / 1000))); url.searchParams.set("interval", "daily");
      const demoKey = process.env.COINGECKO_DEMO_API_KEY?.trim();
      const data = await fetchJsonWithRetry<CoinGeckoChart>(url, { provider: this.name, operation: "daily-market-chart", ticker: symbol, timeoutMs: 3_000 }, { headers: demoKey ? { "x-cg-demo-api-key": demoKey } : undefined, next: { revalidate: DAILY_REVALIDATE_SECONDS, tags: ["market-board-eod"] } });
      const byDate = new Map<string, number>();
      for (const [timestamp, value] of data.prices ?? []) if (Number.isFinite(value)) byDate.set(new Date(timestamp).toISOString().slice(0, 10), value);
      const points = Array.from(byDate, ([date, value]) => ({ date, value })).sort((a, b) => a.date.localeCompare(b.date));
      if (points.length < 2) throw new MarketDataError(data.status?.error_message ?? "BTC 日线数据不足", "INSUFFICIENT_DATA");
      return { symbol: "BTCUSD", points, source: "CoinGecko", sourceUrl: "https://www.coingecko.com/en/coins/bitcoin", updatedAt: `${points.at(-1)!.date}T00:00:00.000Z` };
    });
  }
}
