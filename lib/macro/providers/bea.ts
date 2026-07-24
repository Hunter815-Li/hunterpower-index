import { withMemoryCache } from "@/lib/market-data/cache";
import { fetchJsonWithRetry } from "@/lib/market-data/http";
import { getMacroSeriesDefinition } from "@/lib/macro/series-config";
import type { MacroDataProvider, MacroObservation, MacroSeries } from "@/lib/macro/types";
import { buildSeries, latestObservation, transformObservations } from "@/lib/macro/providers/shared";

const CACHE_MS = 12 * 60 * 60 * 1000;

interface BeaRow { TimePeriod?: string; DataValue?: string; LineNumber?: string; LineDescription?: string }
interface BeaResponse { BEAAPI?: { Results?: { Data?: BeaRow[]; Error?: { APIErrorDescription?: string } } } }

const mappings = {
  US_GDP: { table: "T10101", frequency: "Q", line: "1", transform: "level" as const },
  US_CORE_PCE: { table: "T20804U", frequency: "M", description: /excluding food and energy/i, transform: "yoy" as const },
};

export class BeaMacroProvider implements MacroDataProvider {
  private get apiKey() { return process.env.BEA_API_KEY?.trim() ?? ""; }

  async getSeries(seriesCode: string): Promise<MacroSeries> {
    const definition = getMacroSeriesDefinition(seriesCode);
    if (definition.provider !== "bea") throw new Error(`${seriesCode} is not a BEA series`);
    const year = new Date().getUTCFullYear();
    const observations = await this.fetch(definition.code, `${year - 3},${year - 2},${year - 1},${year}`);
    return buildSeries(definition, observations);
  }

  async getLatestObservation(seriesCode: string): Promise<MacroObservation> {
    const series = await this.getSeries(seriesCode);
    return latestObservation(series.observations, seriesCode);
  }

  async getHistoricalObservations(seriesCode: string, startDate: string, endDate: string): Promise<MacroObservation[]> {
    const startYear = Number(startDate.slice(0, 4));
    const endYear = Number(endDate.slice(0, 4));
    const years = Array.from({ length: endYear - startYear + 1 }, (_, index) => String(startYear + index)).join(",");
    const observations = await this.fetch(seriesCode, years);
    return observations.filter((observation) => observation.period >= startDate && observation.period <= endDate);
  }

  private async fetch(seriesCode: string, years: string): Promise<MacroObservation[]> {
    if (!this.apiKey) throw new Error("BEA_API_KEY is not configured");
    const mapping = mappings[seriesCode as keyof typeof mappings];
    if (!mapping) throw new Error(`${seriesCode} has no BEA mapping`);
    return withMemoryCache(`macro:bea:${seriesCode}:${years}`, CACHE_MS, async () => {
      const url = new URL("https://apps.bea.gov/api/data");
      const params = { UserID: this.apiKey, method: "GetData", DatasetName: "NIPA", TableName: mapping.table, Frequency: mapping.frequency, Year: years, ResultFormat: "JSON" };
      Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
      const payload = await fetchJsonWithRetry<BeaResponse>(url, { provider: "bea", operation: "nipa", ticker: seriesCode, timeoutMs: 12_000 });
      const error = payload.BEAAPI?.Results?.Error?.APIErrorDescription;
      if (error) throw new Error(error);
      const fetchedAt = new Date().toISOString();
      const raw = (payload.BEAAPI?.Results?.Data ?? []).flatMap((row) => {
        const matches = "line" in mapping ? row.LineNumber === mapping.line : mapping.description.test(row.LineDescription ?? "");
        const value = Number(row.DataValue?.replace(/,/g, ""));
        if (!matches || !row.TimePeriod || !Number.isFinite(value)) return [];
        const period = row.TimePeriod.replace(/Q([1-4])$/, (_, quarter: string) => `-${String((Number(quarter) - 1) * 3 + 1).padStart(2, "0")}-01`).replace(/^([0-9]{4})M([0-9]{2})$/, "$1-$2-01");
        return [{ seriesCode, period, value, publishedAt: null, fetchedAt, isPreliminary: false, isRevised: false } satisfies MacroObservation];
      }).sort((a, b) => a.period.localeCompare(b.period));
      if (raw.length === 0) throw new Error(`${seriesCode} has no valid BEA observations`);
      return transformObservations(raw, mapping.transform);
    });
  }
}
