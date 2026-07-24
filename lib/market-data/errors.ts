export type MarketDataErrorCode =
  | "TIMEOUT"
  | "RATE_LIMIT"
  | "INVALID_SYMBOL"
  | "UPSTREAM"
  | "INSUFFICIENT_DATA"
  | "CONFIGURATION"
  | "UNSUPPORTED";

export class MarketDataError extends Error {
  constructor(message: string, public code: MarketDataErrorCode, public status?: number) {
    super(message);
    this.name = "MarketDataError";
  }
}
