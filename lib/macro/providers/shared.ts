import type { MacroObservation, MacroSeries } from "@/lib/macro/types";
import type { MacroSeriesDefinition, MacroValueTransform } from "@/lib/macro/series-config";

export function round(value: number, digits = 4) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function transformObservations(
  observations: MacroObservation[],
  transform: MacroValueTransform = "level",
  scale = 1,
): MacroObservation[] {
  const scaled = observations.map((observation) => ({ ...observation, value: observation.value * scale }));
  if (transform === "level") return scaled;
  const lag = transform === "yoy" ? 12 : 1;
  return scaled.flatMap((observation, index) => {
    const prior = scaled[index - lag];
    if (!prior) return [];
    const value = transform === "monthly-change"
      ? observation.value - prior.value
      : prior.value === 0 ? Number.NaN : ((observation.value / prior.value) - 1) * 100;
    return Number.isFinite(value) ? [{ ...observation, value: round(value) }] : [];
  });
}

export function buildSeries(definition: MacroSeriesDefinition, observations: MacroObservation[]): MacroSeries {
  return {
    code: definition.code,
    name: definition.name,
    nameZh: definition.nameZh,
    country: definition.country,
    category: definition.category,
    unit: definition.unit,
    frequency: definition.frequency,
    source: definition.source,
    sourceUrl: definition.sourceUrl,
    observations,
  };
}

export function latestObservation(observations: MacroObservation[], code: string): MacroObservation {
  const latest = observations.at(-1);
  if (!latest) throw new Error(`${code} has no valid observations`);
  return latest;
}
