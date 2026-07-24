import { getMacroDb } from "@/lib/macro/db";
import type { MacroSeriesDefinition } from "@/lib/macro/series-config";
import type { MacroEvent, MacroObservation, MacroSeries } from "@/lib/macro/types";

export async function persistMacroSeries(definition: MacroSeriesDefinition, series: MacroSeries): Promise<void> {
  const db = getMacroDb();
  if (!db || series.observations.length === 0) return;
  const storedSeries = await db.macroSeries.upsert({
    where: { code: definition.code },
    create: { code: definition.code, name: definition.name, nameZh: definition.nameZh, country: definition.country, category: definition.category, unit: definition.unit, frequency: definition.frequency, provider: definition.provider, providerCode: definition.providerCode, source: definition.source, sourceUrl: definition.sourceUrl },
    update: { name: definition.name, nameZh: definition.nameZh, source: definition.source, sourceUrl: definition.sourceUrl },
  });
  const recent = series.observations.slice(-120);
  const existing = await db.macroObservation.findMany({ where: { seriesId: storedSeries.id, period: { in: recent.map((item) => item.period) } } });
  const byPeriod = new Map(existing.map((item) => [item.period, item]));
  await db.$transaction(async (transaction) => {
    for (const observation of recent) {
      const current = byPeriod.get(observation.period);
      if (current && !current.value.equals(observation.value)) {
        await transaction.macroRevision.create({ data: { seriesId: storedSeries.id, observationId: current.id, period: observation.period, previousValue: current.value, revisedValue: observation.value, reason: "Upstream data revision", fetchedAt: new Date(observation.fetchedAt) } });
      }
      await transaction.macroObservation.upsert({
        where: { seriesId_period: { seriesId: storedSeries.id, period: observation.period } },
        create: { seriesId: storedSeries.id, period: observation.period, value: observation.value, publishedAt: observation.publishedAt ? new Date(observation.publishedAt) : null, fetchedAt: new Date(observation.fetchedAt), isPreliminary: observation.isPreliminary, isRevised: observation.isRevised, source: series.source },
        update: { value: observation.value, publishedAt: observation.publishedAt ? new Date(observation.publishedAt) : null, fetchedAt: new Date(observation.fetchedAt), isPreliminary: observation.isPreliminary, isRevised: Boolean(current && !current.value.equals(observation.value)) || observation.isRevised, source: series.source },
      });
    }
  });
}

export async function loadStoredMacroSeries(definition: MacroSeriesDefinition): Promise<MacroSeries | null> {
  const db = getMacroDb();
  if (!db) return null;
  const stored = await db.macroSeries.findUnique({ where: { code: definition.code }, include: { observations: { orderBy: { period: "desc" }, take: 120 } } });
  if (!stored || stored.observations.length === 0) return null;
  const observations: MacroObservation[] = stored.observations.reverse().map((item) => ({ seriesCode: definition.code, period: item.period, value: item.value.toNumber(), publishedAt: item.publishedAt?.toISOString() ?? null, fetchedAt: item.fetchedAt.toISOString(), isPreliminary: item.isPreliminary, isRevised: item.isRevised }));
  return { code: definition.code, name: definition.name, nameZh: definition.nameZh, country: definition.country, category: definition.category, unit: definition.unit, frequency: definition.frequency, source: definition.source, sourceUrl: definition.sourceUrl, observations };
}

export async function logMacroFetch(input: { provider: string; operation: string; seriesCode?: string; status: "success" | "failed"; message?: string; startedAt: Date; recordsRead?: number; recordsSaved?: number }) {
  const db = getMacroDb();
  if (!db) return;
  await db.macroFetchLog.create({ data: { ...input, completedAt: new Date(), recordsRead: input.recordsRead ?? 0, recordsSaved: input.recordsSaved ?? 0 } });
}

export async function persistMacroEvents(events: MacroEvent[]) {
  const db = getMacroDb();
  if (!db) return;
  await db.$transaction(events.map((event) => db.macroEvent.upsert({
    where: { externalId: event.id },
    create: { externalId: event.id, country: event.country, eventName: event.eventName, eventNameZh: event.eventNameZh, scheduledAt: new Date(event.scheduledAt), importance: event.importance, topic: event.topic, previous: event.previous, consensus: event.consensus, actual: event.actual, unit: event.unit, status: event.status, source: event.source, sourceUrl: event.sourceUrl },
    update: { scheduledAt: new Date(event.scheduledAt), importance: event.importance, topic: event.topic, status: event.status, source: event.source, sourceUrl: event.sourceUrl },
  })));
}
