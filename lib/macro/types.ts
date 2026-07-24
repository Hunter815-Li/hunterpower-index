export type MacroCountry = "CN" | "US";
export type MacroDataStatus = "fresh" | "stale" | "pending" | "unavailable" | "error";
export type MacroDirection = "up" | "down" | "flat" | "unknown";
export type MacroFrequency = "intraday" | "daily" | "weekly" | "monthly" | "quarterly";
export type MacroCategory = "policy" | "rates" | "growth" | "inflation" | "employment" | "liquidity" | "credit";

export interface MacroObservation {
  seriesCode: string;
  period: string;
  value: number;
  publishedAt: string | null;
  fetchedAt: string;
  isPreliminary: boolean;
  isRevised: boolean;
}

export interface MacroSeries {
  code: string;
  name: string;
  nameZh: string;
  country: MacroCountry;
  category: MacroCategory;
  unit: string;
  frequency: MacroFrequency;
  source: string;
  sourceUrl: string;
  observations: MacroObservation[];
}

export interface MacroMetricSnapshot {
  code: string;
  name: string;
  nameZh: string;
  country: MacroCountry;
  category: MacroCategory;
  value: number | null;
  unit: string;
  previous: number | null;
  change: number | null;
  direction: MacroDirection;
  period: string | null;
  publishedAt: string | null;
  nextReleaseAt: string | null;
  source: string;
  sourceUrl: string;
  updatedAt: string | null;
  frequency: MacroFrequency;
  status: MacroDataStatus;
  consensus?: number | null;
  surprise?: number | null;
  revision?: string | null;
  provenance?: "automatic" | "manual";
  history: MacroObservation[];
}

export type MacroEventStatus = "upcoming" | "released" | "delayed" | "cancelled";
export type MacroEventImportance = "low" | "medium" | "high";
export type MacroEventTopic = "inflation" | "employment" | "central-bank" | "growth" | "liquidity";

export interface MacroEvent {
  id: string;
  country: MacroCountry;
  eventName: string;
  eventNameZh: string;
  scheduledAt: string;
  importance: MacroEventImportance;
  topic: MacroEventTopic;
  previous: number | null;
  consensus: number | null;
  actual: number | null;
  unit: string | null;
  status: MacroEventStatus;
  source: string;
  sourceUrl: string;
  relatedSeriesId: string | null;
}

export interface MacroDataProvider {
  getSeries(seriesCode: string): Promise<MacroSeries>;
  getLatestObservation(seriesCode: string): Promise<MacroObservation>;
  getHistoricalObservations(seriesCode: string, startDate: string, endDate: string): Promise<MacroObservation[]>;
}

export interface MacroDashboardPayload {
  country: MacroCountry;
  data: MacroMetricSnapshot[];
  status: MacroDataStatus;
  updatedAt: string | null;
}
