import type { AdjustedPricePoint } from "@/lib/calculateHunterIndex";

export type MarketDataProviderName = "finnhub" | "polygon" | "twelvedata";
export type MarketSession = "open" | "closed";

export interface ProviderQuote {
  ticker: string;
  current: number;
  previousClose: number;
  change: number;
  changePercent: number;
  timestamp: number;
}

export interface ProviderTrade {
  ticker: string;
  price: number;
  timestamp: number;
}

export interface MarketStatus {
  session: MarketSession;
  checkedAt: string;
}

export interface MarketDataProvider {
  readonly name: MarketDataProviderName;
  readonly label: string;
  readonly supportsWebSocket: boolean;
  isConfigured(): boolean;
  getQuote(ticker: string): Promise<ProviderQuote>;
  getHistory(ticker: string): Promise<AdjustedPricePoint[]>;
  getMarketStatus(): Promise<MarketStatus>;
  subscribe?(tickers: string[], onTrade: (trade: ProviderTrade) => void, onError: (error: Error) => void): () => void;
}
