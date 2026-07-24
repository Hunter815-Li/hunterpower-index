import { getMacroDb } from "@/lib/macro/db";
import { getMacroSeriesDefinition } from "@/lib/macro/series-config";

export interface ManualOverrideInput {
  code: string;
  period: string;
  value: number;
  publishedAt: string | null;
  source: string;
  revisionReason?: string | null;
  isPreliminary?: boolean;
}

export async function saveManualOverride(input: ManualOverrideInput) {
  const db = getMacroDb();
  if (!db) throw new Error("DATABASE_URL is not configured");
  const definition = getMacroSeriesDefinition(input.code);
  const series = await db.macroSeries.upsert({
    where: { code: definition.code },
    create: { code: definition.code, name: definition.name, nameZh: definition.nameZh, country: definition.country, category: definition.category, unit: definition.unit, frequency: definition.frequency, provider: definition.provider, providerCode: definition.providerCode, source: definition.source, sourceUrl: definition.sourceUrl },
    update: { name: definition.name, nameZh: definition.nameZh, source: definition.source, sourceUrl: definition.sourceUrl },
  });
  const existing = await db.macroObservation.findUnique({ where: { seriesId_period: { seriesId: series.id, period: input.period } } });
  return db.$transaction(async (transaction) => {
    if (existing && !existing.value.equals(input.value)) {
      await transaction.macroRevision.create({ data: { seriesId: series.id, observationId: existing.id, period: input.period, previousValue: existing.value, revisedValue: input.value, reason: input.revisionReason ?? "Manual verified override" } });
    }
    return transaction.macroObservation.upsert({
      where: { seriesId_period: { seriesId: series.id, period: input.period } },
      create: { seriesId: series.id, period: input.period, value: input.value, publishedAt: input.publishedAt ? new Date(input.publishedAt) : null, fetchedAt: new Date(), isPreliminary: input.isPreliminary ?? false, isRevised: false, source: input.source },
      update: { value: input.value, publishedAt: input.publishedAt ? new Date(input.publishedAt) : null, fetchedAt: new Date(), isPreliminary: input.isPreliminary ?? false, isRevised: Boolean(existing && !existing.value.equals(input.value)), source: input.source },
    });
  });
}
