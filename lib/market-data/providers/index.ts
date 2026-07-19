import { MarketDataError } from "@/lib/market-data/errors";
import { FinnhubProvider } from "@/lib/market-data/providers/finnhub";
import { PolygonProvider } from "@/lib/market-data/providers/polygon";
import { TwelveDataProvider } from "@/lib/market-data/providers/twelveData";
import type { MarketDataProvider, MarketDataProviderName } from "@/lib/market-data/types";

const providers: Record<MarketDataProviderName, MarketDataProvider> = {
  finnhub: new FinnhubProvider(),
  polygon: new PolygonProvider(),
  twelvedata: new TwelveDataProvider(),
};

function isProviderName(value: string): value is MarketDataProviderName {
  return value === "finnhub" || value === "polygon" || value === "twelvedata";
}

export function getConfiguredProviderChain(): MarketDataProvider[] {
  const requested = (process.env.MARKET_DATA_PROVIDER?.trim().toLowerCase() || "finnhub");
  const primary: MarketDataProviderName = isProviderName(requested) ? requested : "finnhub";
  const configuredFallbacks = (process.env.MARKET_DATA_FALLBACKS || "polygon,twelvedata")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(isProviderName);
  const order = [primary, ...configuredFallbacks, "finnhub", "polygon", "twelvedata"] as MarketDataProviderName[];
  const unique = Array.from(new Set(order)).map((name) => providers[name]).filter((provider) => provider.isConfigured());
  if (!unique.length) {
    throw new MarketDataError("未配置行情 API Key。请至少设置 FINNHUB_API_KEY。", "CONFIGURATION");
  }
  return unique;
}

export function getProviderByName(name: MarketDataProviderName) { return providers[name]; }
