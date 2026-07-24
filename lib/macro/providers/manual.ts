import { getMacroDb } from "@/lib/macro/db";
import { getMacroSeriesDefinition } from "@/lib/macro/series-config";
import type { MacroDataProvider, MacroObservation, MacroSeries } from "@/lib/macro/types";
import { buildSeries, latestObservation } from "@/lib/macro/providers/shared";

export class ManualMacroProvider implements MacroDataProvider {
  async getSeries(seriesCode: string): Promise<MacroSeries> {
    const definition = getMacroSeriesDefinition(seriesCode);
    const db = getMacroDb();
    if (!db) throw new Error("DATABASE_URL is not configured for manual macro observations");
    const stored = await db.macroSeries.findUnique({ where: { code: definition.code }, include: { observations: { orderBy: { period: "asc" } } } });
    if (!stored || stored.observations.length === 0) throw new Error(`${seriesCode} has no verified manual observations`);
    return buildSeries(definition, stored.observations.map((observation) => ({
      seriesCode: definition.code,
      period: observation.period,
      value: observation.value.toNumber(),
      publishedAt: observation.publishedAt?.toISOString() ?? null,
      fetchedAt: observation.fetchedAt.toISOString(),
      isPreliminary: observation.isPreliminary,
      isRevised: observation.isRevised,
    })));
  }

  async getLatestObservation(seriesCode: string): Promise<MacroObservation> {
    const series = await this.getSeries(seriesCode);
    return latestObservation(series.observations, seriesCode);
  }

  async getHistoricalObservations(seriesCode: string, startDate: string, endDate: string): Promise<MacroObservation[]> {
    const series = await this.getSeries(seriesCode);
    return series.observations.filter((observation) => observation.period >= startDate && observation.period <= endDate);
  }
}
