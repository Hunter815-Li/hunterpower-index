import type { MacroDataProvider, MacroObservation, MacroSeries } from "@/lib/macro/types";
import { ManualMacroProvider } from "@/lib/macro/providers/manual";

/**
 * PBOC does not expose one stable public JSON API for all requested series.
 * Values entered here must be verified against a PBOC release and are stored
 * with revision history by the protected admin endpoint.
 */
export class PbcMacroProvider implements MacroDataProvider {
  private readonly verified = new ManualMacroProvider();
  getSeries(seriesCode: string): Promise<MacroSeries> { return this.verified.getSeries(seriesCode); }
  getLatestObservation(seriesCode: string): Promise<MacroObservation> { return this.verified.getLatestObservation(seriesCode); }
  getHistoricalObservations(seriesCode: string, startDate: string, endDate: string): Promise<MacroObservation[]> { return this.verified.getHistoricalObservations(seriesCode, startDate, endDate); }
}
