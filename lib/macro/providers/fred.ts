import { withMemoryCache } from "@/lib/market-data/cache";
import { fetchJsonWithRetry } from "@/lib/market-data/http";
import { getMacroSeriesDefinition } from "@/lib/macro/series-config";
import type { MacroDataProvider, MacroObservation, MacroSeries } from "@/lib/macro/types";
import { buildSeries, latestObservation, transformObservations } from "@/lib/macro/providers/shared";
import type { MacroSeriesDefinition } from "@/lib/macro/series-config";

const CACHE_MS = 30 * 60 * 1000;
let fredRequestQueue: Promise<void> = Promise.resolve();

function scheduleFredRequest<T>(loader: () => Promise<T>): Promise<T> {
  const result = fredRequestQueue.then(async () => {
    await new Promise((resolve) => setTimeout(resolve, 520));
    return loader();
  });
  fredRequestQueue = result.then(() => undefined, () => undefined);
  return result;
}

interface FredResponse {
  observations?: Array<{ date?: string; value?: string; realtime_start?: string }>;
  error_message?: string;
}

export class FredMacroProvider implements MacroDataProvider {
  private get apiKey() { return process.env.FRED_API_KEY?.trim() ?? ""; }

  async getSeries(seriesCode: string): Promise<MacroSeries> {
    const definition = getMacroSeriesDefinition(seriesCode);
    const providerCode = this.getProviderCode(definition);
    if (!providerCode && !definition.fredDerivedSpread) throw new Error(`${seriesCode} has no FRED series mapping`);
    if (!this.apiKey) throw new Error("FRED_API_KEY is not configured");
    const end = new Date().toISOString().slice(0, 10);
    const lookbackDays = definition.frequency === "quarterly"
      ? 2_200
      : definition.frequency === "monthly"
        ? 1_100
        : definition.frequency === "weekly"
          ? 800
          : 400;
    const start = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const observations = definition.fredDerivedSpread
      ? await this.getDerivedSpread(definition, start, end)
      : await this.fetchObservations(definition, providerCode!, start, end);
    return buildSeries(definition, observations);
  }

  async getLatestObservation(seriesCode: string): Promise<MacroObservation> {
    const series = await this.getSeries(seriesCode);
    return latestObservation(series.observations, seriesCode);
  }

  async getHistoricalObservations(seriesCode: string, startDate: string, endDate: string): Promise<MacroObservation[]> {
    const definition = getMacroSeriesDefinition(seriesCode);
    const providerCode = this.getProviderCode(definition);
    if (definition.fredDerivedSpread) return this.getDerivedSpread(definition, startDate, endDate);
    if (!providerCode) throw new Error(`${seriesCode} has no FRED series mapping`);
    if (!this.apiKey) throw new Error("FRED_API_KEY is not configured");
    return this.fetchObservations(definition, providerCode, startDate, endDate);
  }

  private getProviderCode(definition: MacroSeriesDefinition): string | undefined {
    return definition.provider === "fred" ? definition.providerCode : definition.fredFallbackCode;
  }

  private async getDerivedSpread(definition: MacroSeriesDefinition, startDate: string, endDate: string): Promise<MacroObservation[]> {
    const spread = definition.fredDerivedSpread;
    if (!spread) throw new Error(`${definition.code} has no derived FRED definition`);
    const [minuend, subtrahend] = await Promise.all([
      this.fetchRawObservations(definition.code, spread.minuendCode, startDate, endDate),
      this.fetchRawObservations(definition.code, spread.subtrahendCode, startDate, endDate),
    ]);
    const subtrahendByPeriod = new Map(subtrahend.map((observation) => [observation.period, observation.value]));
    return minuend.flatMap((observation) => {
      const otherValue = subtrahendByPeriod.get(observation.period);
      if (otherValue === undefined) return [];
      return [{ ...observation, value: Math.round((observation.value - otherValue) * spread.scale * 10_000) / 10_000 }];
    });
  }

  private async fetchObservations(definition: MacroSeriesDefinition, providerCode: string, startDate: string, endDate: string): Promise<MacroObservation[]> {
    const raw = await this.fetchRawObservations(definition.code, providerCode, startDate, endDate);
    return transformObservations(raw, definition.transform, definition.scale);
  }

  private async fetchRawObservations(seriesCode: string, providerCode: string, startDate: string, endDate: string): Promise<MacroObservation[]> {
    if (!this.apiKey) throw new Error("FRED_API_KEY is not configured");
    return withMemoryCache(`macro:fred:${providerCode}:${startDate}:${endDate}`, CACHE_MS, async () => {
      const url = new URL("https://api.stlouisfed.org/fred/series/observations");
      url.searchParams.set("series_id", providerCode);
      url.searchParams.set("api_key", this.apiKey);
      url.searchParams.set("file_type", "json");
      url.searchParams.set("observation_start", startDate);
      url.searchParams.set("observation_end", endDate);
      url.searchParams.set("sort_order", "asc");
      const payload = await scheduleFredRequest(() => fetchJsonWithRetry<FredResponse>(url, { provider: "fred-macro", operation: "series-observations", ticker: providerCode }));
      const fetchedAt = new Date().toISOString();
      const raw = (payload.observations ?? []).flatMap((item) => {
        const value = Number(item.value);
        if (!item.date || !Number.isFinite(value)) return [];
        return [{ seriesCode, period: item.date, value, publishedAt: null, fetchedAt, isPreliminary: false, isRevised: false } satisfies MacroObservation];
      });
      if (raw.length === 0) throw new Error(payload.error_message ?? `${seriesCode} has no valid FRED observations`);
      return raw;
    });
  }
}
