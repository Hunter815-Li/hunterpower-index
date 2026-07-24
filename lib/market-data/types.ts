import type { AdjustedPricePoint } from "@/lib/calculateHunterIndex";

export type MarketDataProviderName = "marketdata" | "finnhub" | "polygon" | "twelvedata";
export type MarketSession = "open" | "closed";
export type HistoricalRange = "1M" | "3M" | "6M" | "YTD" | "1Y" | "3Y" | "MAX";

export interface ProviderQuote {
  ticker: string;
  current: number;
  previousClose: number;
  change: number;
  changePercent: number;
  timestamp: number;
}

export interface MarketStatus {
  session: MarketSession;
  checkedAt: string;
}

export interface MarketDataProvider {
  readonly name: MarketDataProviderName;
  readonly label: string;
  isConfigured(): boolean;
  getQuote(ticker: string): Promise<ProviderQuote>;
  getQuotes(tickers: string[]): Promise<ProviderQuote[]>;
  getHistory(ticker: string): Promise<AdjustedPricePoint[]>;
  getHistoricalPrices(ticker: string, range: HistoricalRange): Promise<AdjustedPricePoint[]>;
  getMarketStatus(): Promise<MarketStatus>;
  getFundamentals(ticker: string): Promise<MarketFundamentals>;
}

export interface MarketFundamentals {
  ticker: string;
  marketCapitalization: number | null;
  currency: string | null;
  asOf: string;
}
