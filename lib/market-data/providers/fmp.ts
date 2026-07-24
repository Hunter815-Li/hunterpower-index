import type { AdjustedPricePoint } from "@/lib/calculateHunterIndex";
import { withMemoryCache } from "@/lib/market-data/cache";
import { MarketDataError } from "@/lib/market-data/errors";
import { fetchJsonWithRetry } from "@/lib/market-data/http";
import { easternDate } from "@/lib/market-data/marketClock";
import { BaseMarketDataProvider } from "@/lib/market-data/provider-base";
import type { MarketStatus, ProviderQuote } from "@/lib/market-data/types";

const DAILY_CACHE_MS = 20 * 60 * 60 * 1000;
const DAILY_REVALIDATE_SECONDS = 20 * 60 * 60;
const HISTORY_CALENDAR_DAYS = 370;

interface FmpHistoricalPoint {
  date?: string;
  price?: number;
  close?: number;
  adjClose?: number;
  adjustedClose?: number;
}

interface FmpObjectResponse {
  historical?: FmpHistoricalPoint[];
  message?: string;
  error?: string;
  "Error Message"?: string;
}

type FmpHistoricalResponse =
  | FmpHistoricalPoint[]
  | FmpObjectResponse;

function responsePoints(data: FmpHistoricalResponse): FmpHistoricalPoint[] {
  if (Array.isArray(data)) return data;
  if ("historical" in data && Array.isArray(data.historical)) return data.historical;
  return [];
}

function responseError(data: FmpHistoricalResponse) {
  if (Array.isArray(data)) return null;
  return data.message ?? data.error ?? data["Error Message"] ?? null;
}

export class FmpProvider extends BaseMarketDataProvider {
  readonly name = "fmp" as const;
  readonly label = "Financial Modeling Prep";

  private get apiKey() {
    return process.env.FMP_API_KEY?.trim() ?? "";
  }

  isConfigured() {
    return Boolean(this.apiKey);
  }

  async getHistory(ticker: string): Promise<AdjustedPricePoint[]> {
    return withMemoryCache(`${this.name}:history:${ticker}`, DAILY_CACHE_MS, async () => {
      if (!this.isConfigured()) {
        throw new MarketDataError("FMP_API_KEY 未配置", "CONFIGURATION");
      }

      const cutoff = easternDate(Date.now() - 86_400_000);
      const start = new Date(`${cutoff}T12:00:00Z`);
      start.setUTCDate(start.getUTCDate() - HISTORY_CALENDAR_DAYS);

      const url = new URL("https://financialmodelingprep.com/stable/historical-price-eod/light");
      url.searchParams.set("symbol", ticker);
      url.searchParams.set("from", start.toISOString().slice(0, 10));
      url.searchParams.set("to", cutoff);
      url.searchParams.set("apikey", this.apiKey);

      const data = await fetchJsonWithRetry<FmpHistoricalResponse>(
        url,
        { provider: this.name, operation: "daily-history", ticker },
        { next: { revalidate: DAILY_REVALIDATE_SECONDS, tags: ["market-data-eod"] } },
      );

      const points = responsePoints(data)
        .map((point) => ({
          date: point.date ?? "",
          adjustedClose: Number(point.adjustedClose ?? point.adjClose ?? point.close ?? point.price),
        }))
        .filter((point) => /^\d{4}-\d{2}-\d{2}$/.test(point.date)
          && Number.isFinite(point.adjustedClose)
          && point.adjustedClose > 0)
        .sort((left, right) => left.date.localeCompare(right.date));

      if (points.length < 2) {
        throw new MarketDataError(
          responseError(data) ?? `${ticker} 日线历史不足`,
          "INSUFFICIENT_DATA",
        );
      }
      return points;
    });
  }

  async getQuote(ticker: string): Promise<ProviderQuote> {
    const history = await this.getHistory(ticker);
    const latest = history.at(-1);
    const previous = history.at(-2);
    if (!latest?.adjustedClose || !previous?.adjustedClose) {
      throw new MarketDataError(`${ticker} 收盘数据不足`, "INSUFFICIENT_DATA");
    }
    return {
      ticker,
      current: latest.adjustedClose,
      previousClose: previous.adjustedClose,
      change: latest.adjustedClose - previous.adjustedClose,
      changePercent: ((latest.adjustedClose / previous.adjustedClose) - 1) * 100,
      timestamp: Date.parse(`${latest.date}T21:00:00Z`),
    };
  }

  async getMarketStatus(): Promise<MarketStatus> {
    return { session: "closed", checkedAt: new Date().toISOString() };
  }
}
