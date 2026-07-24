import { MarketDataError } from "@/lib/market-data/errors";
import { FinnhubProvider } from "@/lib/market-data/providers/finnhub";
import { FmpProvider } from "@/lib/market-data/providers/fmp";
import { MarketDataAppProvider } from "@/lib/market-data/providers/marketDataApp";
import { PolygonProvider } from "@/lib/market-data/providers/polygon";
import { TwelveDataProvider } from "@/lib/market-data/providers/twelveData";
import type { MarketDataProvider, MarketDataProviderName } from "@/lib/market-data/types";

const providers: Record<MarketDataProviderName, MarketDataProvider> = {
  fmp: new FmpProvider(),
  marketdata: new MarketDataAppProvider(),
  finnhub: new FinnhubProvider(),
  polygon: new PolygonProvider(),
  twelvedata: new TwelveDataProvider(),
};

function isProviderName(value: string): value is MarketDataProviderName {
  return value === "fmp" || value === "marketdata" || value === "finnhub" || value === "polygon" || value === "twelvedata";
}

export function getConfiguredProviderChain(): MarketDataProvider[] {
  const requested = (process.env.MARKET_DATA_PROVIDER?.trim().toLowerCase() || "marketdata");
  const primary: MarketDataProviderName = isProviderName(requested) ? requested : "marketdata";
  const configuredFallbacks = (process.env.MARKET_DATA_FALLBACKS || "fmp,twelvedata,polygon")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(isProviderName);
  const order = [primary, ...configuredFallbacks, "fmp", "marketdata", "twelvedata", "polygon", "finnhub"] as MarketDataProviderName[];
  const unique = Array.from(new Set(order)).map((name) => providers[name]).filter((provider) => provider.isConfigured());
  if (!unique.length) {
    throw new MarketDataError("未配置日线行情密钥。请设置 MARKETDATA_TOKEN。", "CONFIGURATION");
  }
  return unique;
}

export function getProviderByName(name: MarketDataProviderName) { return providers[name]; }
