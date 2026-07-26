import type { DailySeries, DailySeriesProvider } from "@/lib/market-data/daily-series";
import { MarketDataError } from "@/lib/market-data/errors";
import { FmpProvider } from "@/lib/market-data/providers/fmp";
import type { HistoricalRange } from "@/lib/market-data/types";

/**
 * Adapts FMP's documented commodity symbols (for example GCUSD for gold)
 * to the cross-asset daily-series interface used by the market terminal.
 */
export class FmpCommoditiesProvider implements DailySeriesProvider {
  readonly name = "fmp-commodities";
  readonly label = "Financial Modeling Prep Commodities";
  private readonly provider = new FmpProvider();

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
      throw new MarketDataError(`${symbol} commodity history is unavailable`, "INSUFFICIENT_DATA");
    }

    return {
      symbol,
      points,
      source: `Financial Modeling Prep (${symbol})`,
      sourceUrl: "https://financialmodelingprep.com",
      updatedAt: `${points.at(-1)!.date}T21:00:00.000Z`,
    };
  }
}
