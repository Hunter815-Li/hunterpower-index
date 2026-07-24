import type { AdjustedPricePoint } from "@/lib/calculateHunterIndex";
import { MarketDataError } from "@/lib/market-data/errors";
import type { HistoricalRange, MarketDataProvider, MarketDataProviderName, MarketFundamentals, MarketStatus, ProviderQuote } from "@/lib/market-data/types";

const RANGE_DAYS: Record<HistoricalRange, number> = { "1M": 31, "3M": 93, "6M": 186, YTD: 370, "1Y": 370, "3Y": 1_100, MAX: Number.POSITIVE_INFINITY };

export abstract class BaseMarketDataProvider implements MarketDataProvider {
  abstract readonly name: MarketDataProviderName;
  abstract readonly label: string;
  abstract isConfigured(): boolean;
  abstract getQuote(ticker: string): Promise<ProviderQuote>;
  abstract getHistory(ticker: string): Promise<AdjustedPricePoint[]>;
  abstract getMarketStatus(): Promise<MarketStatus>;

  getQuotes(tickers: string[]) { return Promise.all(tickers.map((ticker) => this.getQuote(ticker))); }
  async getHistoricalPrices(ticker: string, range: HistoricalRange) {
    const history = await this.getHistory(ticker);
    if (range === "MAX") return history;
    const cutoff = Date.now() - RANGE_DAYS[range] * 86_400_000;
    return history.filter((point) => Date.parse(`${point.date}T00:00:00Z`) >= cutoff);
  }
  async getFundamentals(ticker: string): Promise<MarketFundamentals> {
    throw new MarketDataError(`${this.label} 暂未实现 ${ticker} 基本面数据`, "UNSUPPORTED");
  }
}
