import { MarketDataError } from "@/lib/market-data/errors";

const MAX_RETRIES = 3;
const DEFAULT_TIMEOUT_MS = 8_000;

interface RequestContext {
  provider: string;
  operation: string;
  ticker?: string;
  timeoutMs?: number;
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function logFailure(context: RequestContext, attempt: number, error: unknown) {
  console.warn(JSON.stringify({
    level: "warn",
    event: "market_data_request_failed",
    provider: context.provider,
    operation: context.operation,
    ticker: context.ticker,
    attempt,
    message: error instanceof Error ? error.message : String(error),
    timestamp: new Date().toISOString(),
  }));
}

/** Fetch JSON with an 8-second timeout and three automatic retries. */
export async function fetchJsonWithRetry<T>(url: URL, context: RequestContext, init?: RequestInit): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), context.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    try {
      const response = await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
      if (response.status === 429) throw new MarketDataError("行情服务请求过于频繁", "RATE_LIMIT", 429);
      if (!response.ok) {
        const code = response.status >= 500 ? "UPSTREAM" : "INVALID_SYMBOL";
        throw new MarketDataError(`行情服务返回 ${response.status}`, code, response.status);
      }
      return await response.json() as T;
    } catch (error) {
      lastError = error instanceof Error && error.name === "AbortError"
        ? new MarketDataError("行情请求超时", "TIMEOUT")
        : error;
      logFailure(context, attempt + 1, lastError);
      if (attempt < MAX_RETRIES) await pause(250 * 2 ** attempt);
    } finally {
      clearTimeout(timeout);
    }
  }

  if (lastError instanceof MarketDataError) throw lastError;
  throw new MarketDataError(lastError instanceof Error ? lastError.message : "行情服务不可用", "UPSTREAM");
}
