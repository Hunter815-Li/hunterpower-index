import { withMemoryCache } from "@/lib/market-data/cache";
import { fetchJsonWithRetry } from "@/lib/market-data/http";
import { getMacroSeriesDefinition } from "@/lib/macro/series-config";
import type { MacroDataProvider, MacroObservation, MacroSeries } from "@/lib/macro/types";
import { buildSeries, latestObservation, transformObservations } from "@/lib/macro/providers/shared";

const CACHE_MS = 12 * 60 * 60 * 1000;

interface BlsResponse {
  status?: string;
  message?: string[];
  Results?: { series?: Array<{ seriesID?: string; data?: Array<{ year?: string; period?: string; value?: string; latest?: string; footnotes?: Array<{ text?: string }> }> }> };
}

function blsPeriod(year: string, period: string) {
  const month = Number(period.slice(1));
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

export class BlsMacroProvider implements MacroDataProvider {
  async getSeries(seriesCode: string): Promise<MacroSeries> {
    const definition = getMacroSeriesDefinition(seriesCode);
    if (definition.provider !== "bls" || !definition.providerCode) throw new Error(`${seriesCode} is not a BLS series`);
    const currentYear = new Date().getUTCFullYear();
    const observations = await this.fetch(definition.code, String(currentYear - 2), String(currentYear));
    return buildSeries(definition, observations);
  }

  async getLatestObservation(seriesCode: string): Promise<MacroObservation> {
    const series = await this.getSeries(seriesCode);
    return latestObservation(series.observations, seriesCode);
  }

  async getHistoricalObservations(seriesCode: string, startDate: string, endDate: string): Promise<MacroObservation[]> {
    const startYear = startDate.slice(0, 4);
    const endYear = endDate.slice(0, 4);
    const observations = await this.fetch(seriesCode, startYear, endYear);
    return observations.filter((observation) => observation.period >= startDate && observation.period <= endDate);
  }

  private async fetch(seriesCode: string, startYear: string, endYear: string): Promise<MacroObservation[]> {
    const definition = getMacroSeriesDefinition(seriesCode);
    if (definition.provider !== "bls" || !definition.providerCode) throw new Error(`${seriesCode} is not a BLS series`);
    return withMemoryCache(`macro:bls:${definition.providerCode}:${startYear}:${endYear}`, CACHE_MS, async () => {
      const body: Record<string, string | string[]> = { seriesid: [definition.providerCode!], startyear: startYear, endyear: endYear };
      const key = process.env.BLS_API_KEY?.trim();
      if (key) body.registrationkey = key;
      const payload = await fetchJsonWithRetry<BlsResponse>(new URL("https://api.bls.gov/publicAPI/v2/timeseries/data/"), { provider: "bls", operation: "timeseries", ticker: definition.providerCode, timeoutMs: 12_000 }, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (payload.status !== "REQUEST_SUCCEEDED") throw new Error(payload.message?.join("; ") || "BLS request failed");
      const fetchedAt = new Date().toISOString();
      const raw = (payload.Results?.series?.[0]?.data ?? []).flatMap((item) => {
        const value = Number(item.value);
        if (!item.year || !item.period?.match(/^M(0[1-9]|1[0-2])$/) || !Number.isFinite(value)) return [];
        return [{
          seriesCode: definition.code,
          period: blsPeriod(item.year, item.period),
          value,
          publishedAt: null,
          fetchedAt,
          isPreliminary: item.footnotes?.some((note) => note.text?.toLowerCase().includes("preliminary")) ?? false,
          isRevised: false,
        } satisfies MacroObservation];
      }).sort((a, b) => a.period.localeCompare(b.period));
      if (raw.length === 0) throw new Error(`${definition.code} has no valid BLS observations`);
      return transformObservations(raw, definition.transform, definition.scale);
    });
  }
}
