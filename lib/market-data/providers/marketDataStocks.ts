import type { DailySeries, DailySeriesProvider } from "@/lib/market-data/daily-series";
import { MarketDataError } from "@/lib/market-data/errors";
import { MarketDataAppProvider } from "@/lib/market-data/providers/marketDataApp";
import type { HistoricalRange } from "@/lib/market-data/types";

/** Adapts the existing Market Data stock/ETF provider to cross-asset charts. */
export class MarketDataStocksProvider implements DailySeriesProvider {
  readonly name = "marketdata-stocks";
  readonly label = "Market Data Stocks & ETFs";
  private readonly provider = new MarketDataAppProvider();

  isConfigured() {
    return this.provider.isConfigured();
  }

  async getDailySeries(symbol: string, range: HistoricalRange): Promise<DailySeries> {
    const history = await this.provider.getHistoricalPrices(symbol, range);
    const points = history.flatMap((point) =>
      point.adjustedClose && Number.isFinite(point.adjustedClose)
        ? [{ date: point.date, value: point.adjustedClose }]
        : [],
    );
    if (points.length < 2) {
      throw new MarketDataError(`${symbol} daily history is unavailable`, "INSUFFICIENT_DATA");
    }
    return {
      symbol,
      points,
      source: `Market Data (${symbol})`,
      sourceUrl: "https://www.marketdata.app",
      updatedAt: `${points.at(-1)!.date}T21:00:00.000Z`,
    };
  }
}
