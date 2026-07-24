import { withMemoryCache } from "@/lib/market-data/cache";
import { getMacroSeriesDefinition } from "@/lib/macro/series-config";
import { buildSeries, latestObservation, round } from "@/lib/macro/providers/shared";
import type { MacroDataProvider, MacroObservation, MacroSeries } from "@/lib/macro/types";

const SOURCE_URL = "https://yield.chinabond.com.cn/cbweb-pbc-web/pbc/more?locale=cn_zh";
const CACHE_MS = 30 * 60 * 1000;

interface ChinaBondSnapshot {
  period: string;
  oneYear: number;
  tenYear: number;
  thirtyYear: number;
}

function decodeHtml(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function parseSnapshot(html: string): ChinaBondSnapshot {
  const text = decodeHtml(html);
  const period = text.match(/(20\d{2}-\d{2}-\d{2})\s*\(%\)/)?.[1];
  const row = text.match(/中债国债收益率曲线\s+((?:-?\d+(?:\.\d+)?\s+){7}-?\d+(?:\.\d+)?)/)?.[1];
  const values = row?.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  if (!period || values.length !== 8 || values.some((value) => !Number.isFinite(value))) {
    throw new Error("ChinaBond government yield curve could not be parsed");
  }
  return { period, oneYear: values[2], tenYear: values[6], thirtyYear: values[7] };
}

async function loadSnapshot(): Promise<ChinaBondSnapshot> {
  return withMemoryCache("macro:china-bond:government-curve", CACHE_MS, async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    try {
      const response = await fetch(SOURCE_URL, {
        signal: controller.signal,
        cache: "no-store",
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
          "User-Agent": "TaoTalk-Finance/1.0 (+personal research; contact: libangtao0815@gmail.com)",
        },
      });
      if (!response.ok) throw new Error(`ChinaBond returned ${response.status}`);
      return parseSnapshot(await response.text());
    } finally {
      clearTimeout(timeout);
    }
  });
}

function observationFor(seriesCode: string, snapshot: ChinaBondSnapshot): MacroObservation {
  const value = seriesCode === "CN_GB_10Y"
    ? snapshot.tenYear
    : seriesCode === "CN_GB_30Y"
      ? snapshot.thirtyYear
      : seriesCode === "CN_10Y1Y"
        ? round((snapshot.tenYear - snapshot.oneYear) * 100)
        : Number.NaN;
  if (!Number.isFinite(value)) throw new Error(`${seriesCode} is not supported by ChinaBond provider`);
  return {
    seriesCode,
    period: snapshot.period,
    value,
    publishedAt: `${snapshot.period}T17:30:00+08:00`,
    fetchedAt: new Date().toISOString(),
    isPreliminary: false,
    isRevised: false,
  };
}

export class ChinaBondMacroProvider implements MacroDataProvider {
  async getSeries(seriesCode: string): Promise<MacroSeries> {
    const definition = getMacroSeriesDefinition(seriesCode);
    if (definition.provider !== "china-bond") throw new Error(`${seriesCode} is not a ChinaBond series`);
    const observation = observationFor(definition.code, await loadSnapshot());
    return buildSeries(definition, [observation]);
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
