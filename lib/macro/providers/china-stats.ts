import type { MacroDataProvider, MacroObservation, MacroSeries } from "@/lib/macro/types";
import { ManualMacroProvider } from "@/lib/macro/providers/manual";

/**
 * NBS pages remain the authoritative source. Their internal query endpoint can
 * reject server traffic, so the provider falls back to audited database values
 * instead of scraping an unstable page or guessing indicator codes.
 */
export class ChinaStatsMacroProvider implements MacroDataProvider {
  private readonly verified = new ManualMacroProvider();
  getSeries(seriesCode: string): Promise<MacroSeries> { return this.verified.getSeries(seriesCode); }
  getLatestObservation(seriesCode: string): Promise<MacroObservation> { return this.verified.getLatestObservation(seriesCode); }
  getHistoricalObservations(seriesCode: string, startDate: string, endDate: string): Promise<MacroObservation[]> { return this.verified.getHistoricalObservations(seriesCode, startDate, endDate); }
}
