import { macroSeriesDefinitions, emptyMacroSnapshot, type MacroSeriesDefinition } from "@/lib/macro/series-config";
import type { MacroDashboardPayload, MacroDataProvider, MacroDataStatus, MacroMetricSnapshot, MacroObservation, MacroSeries } from "@/lib/macro/types";
import { FredMacroProvider } from "@/lib/macro/providers/fred";
import { BlsMacroProvider } from "@/lib/macro/providers/bls";
import { BeaMacroProvider } from "@/lib/macro/providers/bea";
import { PbcMacroProvider } from "@/lib/macro/providers/pbc";
import { ChinaStatsMacroProvider } from "@/lib/macro/providers/china-stats";
import { ChinaBondMacroProvider } from "@/lib/macro/providers/china-bond";
import { ManualMacroProvider } from "@/lib/macro/providers/manual";
import { loadStoredMacroSeries, logMacroFetch, persistMacroSeries } from "@/lib/macro/repository";
import { getMacroCalendar } from "@/lib/macro/calendar";
import { featuredMacroCodes } from "@/lib/macro/featured";
import { withMemoryCache } from "@/lib/market-data/cache";
import { getVerifiedManualObservations, verifiedManualMacroData } from "@/app/config/macro-manual-data";

const providers: Partial<Record<MacroSeriesDefinition["provider"], MacroDataProvider>> = {
  fred: new FredMacroProvider(),
  bls: new BlsMacroProvider(),
  bea: new BeaMacroProvider(),
  pbc: new PbcMacroProvider(),
  "china-stats": new ChinaStatsMacroProvider(),
  "china-bond": new ChinaBondMacroProvider(),
  manual: new ManualMacroProvider(),
};

const staleAfterDays = { intraday: 1, daily: 7, weekly: 16, monthly: 50, quarterly: 140 } as const;

function statusFor(definition: MacroSeriesDefinition, latest: MacroObservation): MacroDataStatus {
  const periodTime = Date.parse(latest.period);
  if (!Number.isFinite(periodTime)) return "fresh";
  const ageDays = (Date.now() - periodTime) / 86_400_000;
  return ageDays > staleAfterDays[definition.frequency] ? "stale" : "fresh";
}

function seriesToSnapshot(definition: MacroSeriesDefinition, series: MacroSeries): MacroMetricSnapshot {
  const latest = series.observations.at(-1);
  const previous = series.observations.at(-2);
  if (!latest) return { ...emptyMacroSnapshot(definition), status: "unavailable" };
  const change = previous ? latest.value - previous.value : null;
  return {
    ...emptyMacroSnapshot(definition),
    value: latest.value,
    previous: previous?.value ?? null,
    change,
    direction: change === null ? "unknown" : change > 0 ? "up" : change < 0 ? "down" : "flat",
    period: latest.period,
    publishedAt: latest.publishedAt,
    updatedAt: latest.fetchedAt,
    status: statusFor(definition, latest),
    history: series.observations.slice(-24),
  };
}

function verifiedManualSnapshot(definition: MacroSeriesDefinition): MacroMetricSnapshot | null {
  const observations = getVerifiedManualObservations(definition.code);
  const manualSeries = verifiedManualMacroData[definition.code];
  if (!observations || !manualSeries) return null;
  return {
    ...seriesToSnapshot(definition, {
      code: definition.code,
      name: definition.name,
      nameZh: definition.nameZh,
      country: definition.country,
      category: definition.category,
      unit: definition.unit,
      frequency: definition.frequency,
      source: manualSeries.source,
      sourceUrl: manualSeries.sourceUrl,
      observations,
    }),
    source: manualSeries.source,
    sourceUrl: manualSeries.sourceUrl,
    provenance: "manual",
  };
}

interface LoadDefinitionOptions {
  record: boolean;
  storedFallback: boolean;
}

const defaultLoadOptions: LoadDefinitionOptions = { record: true, storedFallback: true };

async function loadDefinition(definition: MacroSeriesDefinition, options: LoadDefinitionOptions = defaultLoadOptions): Promise<MacroMetricSnapshot> {
  const provider = providers[definition.provider];
  const hasDirectOrDerivedFredSeries = Boolean(definition.providerCode || definition.fredDerivedSpread);
  if (!provider || (definition.provider === "fred" && !hasDirectOrDerivedFredSeries)) return verifiedManualSnapshot(definition) ?? emptyMacroSnapshot(definition);
  const startedAt = new Date();
  try {
    const series = await provider.getSeries(definition.code);
    if (options.record) {
      await persistMacroSeries(definition, series).catch(() => undefined);
      await logMacroFetch({ provider: definition.provider, operation: "refresh-series", seriesCode: definition.code, status: "success", startedAt, recordsRead: series.observations.length, recordsSaved: series.observations.length }).catch(() => undefined);
    }
    return seriesToSnapshot(definition, series);
  } catch (error) {
    console.warn(JSON.stringify({
      level: "warn",
      event: "macro_series_fetch_failed",
      code: definition.code,
      provider: definition.provider,
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    }));
    if (options.record) await logMacroFetch({ provider: definition.provider, operation: "refresh-series", seriesCode: definition.code, status: "failed", message: error instanceof Error ? error.message : String(error), startedAt }).catch(() => undefined);
    if (definition.fredFallbackCode) {
      const fallbackStartedAt = new Date();
      try {
        const fallbackSeries = await providers.fred!.getSeries(definition.code);
        if (options.record) {
          await persistMacroSeries(definition, fallbackSeries).catch(() => undefined);
          await logMacroFetch({ provider: "fred-fallback", operation: "refresh-series", seriesCode: definition.code, status: "success", startedAt: fallbackStartedAt, recordsRead: fallbackSeries.observations.length, recordsSaved: fallbackSeries.observations.length }).catch(() => undefined);
        }
        return seriesToSnapshot(definition, fallbackSeries);
      } catch (fallbackError) {
        if (options.record) await logMacroFetch({ provider: "fred-fallback", operation: "refresh-series", seriesCode: definition.code, status: "failed", message: fallbackError instanceof Error ? fallbackError.message : String(fallbackError), startedAt: fallbackStartedAt }).catch(() => undefined);
      }
    }
    if (options.storedFallback) {
      const stored = await loadStoredMacroSeries(definition).catch(() => null);
      if (stored) return { ...seriesToSnapshot(definition, stored), status: "stale" };
    }
    return verifiedManualSnapshot(definition) ?? { ...emptyMacroSnapshot(definition), status: "unavailable" };
  }
}

export async function refreshMacroDefinitions(definitions: readonly MacroSeriesDefinition[]) {
  const data = await Promise.all(definitions.map((definition) => loadDefinition(definition)));
  return { total: data.length, available: data.filter((item) => item.value !== null).length, refreshedAt: new Date().toISOString() };
}

export async function getMacroDashboard(country: "CN" | "US"): Promise<MacroDashboardPayload> {
  const definitions = macroSeriesDefinitions.filter((series) => series.country === country);
  const data = await Promise.all(definitions.map((definition) => loadDefinition(definition)));
  const available = data.filter((metric) => metric.value !== null);
  const status: MacroDataStatus = available.length === 0 ? "unavailable" : available.some((metric) => metric.status === "stale") ? "stale" : "fresh";
  return { country, data, status, updatedAt: available.map((metric) => metric.updatedAt).filter((value): value is string => Boolean(value)).sort().at(-1) ?? null };
}

export async function getMacroSummary() {
  const [china, us, calendar] = await Promise.all([getMacroDashboard("CN"), getMacroDashboard("US"), getMacroCalendar(30)]);
  const nextReleaseByCode = new Map<string, string>();
  for (const event of calendar.data) if (event.relatedSeriesId && !nextReleaseByCode.has(event.relatedSeriesId)) nextReleaseByCode.set(event.relatedSeriesId, event.scheduledAt);
  china.data = china.data.map((metric) => ({ ...metric, nextReleaseAt: nextReleaseByCode.get(metric.code) ?? metric.nextReleaseAt }));
  us.data = us.data.map((metric) => ({ ...metric, nextReleaseAt: nextReleaseByCode.get(metric.code) ?? metric.nextReleaseAt }));
  return {
    china,
    us,
    status: china.status === "unavailable" && us.status === "unavailable" ? "unavailable" as const : "fresh" as const,
    updatedAt: [china.updatedAt, us.updatedAt].filter((value): value is string => Boolean(value)).sort().at(-1) ?? null,
  };
}

export async function getFeaturedMacroSummary() {
  return withMemoryCache("macro:featured-summary:v2", 10 * 60 * 1000, async () => {
    const definitions = macroSeriesDefinitions.filter((definition) => featuredMacroCodes.has(definition.code));
    const databaseProviders = new Set(["manual", "pbc", "china-stats"]);
    const snapshots = await Promise.all(definitions.map(async (definition) => {
      const request = loadDefinition(definition, { record: false, storedFallback: false });
      const timeoutMs = databaseProviders.has(definition.provider) ? 2_000 : 20_000;
      const snapshot = await Promise.race([
        request,
        new Promise<MacroMetricSnapshot>((resolve) => setTimeout(() => resolve(emptyMacroSnapshot(definition)), timeoutMs)),
      ]);
      return snapshot.value === null ? verifiedManualSnapshot(definition) ?? snapshot : snapshot;
    }));
    const dashboard = (country: "CN" | "US"): MacroDashboardPayload => {
      const data = snapshots.filter((metric) => metric.country === country);
      const available = data.filter((metric) => metric.value !== null);
      const status: MacroDataStatus = available.length === 0
        ? "unavailable"
        : available.some((metric) => metric.status === "stale") ? "stale" : "fresh";
      return {
        country,
        data,
        status,
        updatedAt: available.map((metric) => metric.updatedAt).filter((value): value is string => Boolean(value)).sort().at(-1) ?? null,
      };
    };
    const china = dashboard("CN");
    const us = dashboard("US");
    return {
      china,
      us,
      status: china.status === "unavailable" && us.status === "unavailable" ? "unavailable" as const : "fresh" as const,
      updatedAt: [china.updatedAt, us.updatedAt].filter((value): value is string => Boolean(value)).sort().at(-1) ?? null,
    };
  });
}

export async function getMacroSeries(code: string): Promise<MacroSeries | null> {
  const definition = macroSeriesDefinitions.find((series) => series.code === code);
  if (!definition) return null;
  const provider = providers[definition.provider];
  const hasDirectOrDerivedFredSeries = Boolean(definition.providerCode || definition.fredDerivedSpread);
  if (!provider || (definition.provider === "fred" && !hasDirectOrDerivedFredSeries)) return null;
  try {
    return await provider.getSeries(code);
  } catch {
    if (!definition.fredFallbackCode) return null;
    try { return await providers.fred!.getSeries(code); } catch { return null; }
  }
}
