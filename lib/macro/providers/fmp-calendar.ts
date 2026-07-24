import { withMemoryCache } from "@/lib/market-data/cache";
import { fetchJsonWithRetry } from "@/lib/market-data/http";
import type { MacroCountry, MacroEvent, MacroEventImportance, MacroEventTopic } from "@/lib/macro/types";

interface FmpCalendarRow {
  event?: unknown;
  name?: unknown;
  date?: unknown;
  country?: unknown;
  actual?: unknown;
  previous?: unknown;
  estimate?: unknown;
  consensus?: unknown;
  impact?: unknown;
  unit?: unknown;
}

interface EventMapping {
  country: MacroCountry;
  pattern: RegExp;
  exclude?: RegExp;
  nameZh: string;
  topic: MacroEventTopic;
  importance: MacroEventImportance;
  relatedSeriesId: string;
}

const eventMappings: readonly EventMapping[] = [
  { country: "US", pattern: /FOMC|Fed(?:eral Reserve)? Interest Rate Decision/i, nameZh: "美联储利率决议", topic: "central-bank", importance: "high", relatedSeriesId: "US_FED_TARGET" },
  { country: "US", pattern: /Consumer Price Index|\bCPI\b.*(?:YoY|Year)/i, exclude: /Core/i, nameZh: "美国消费者价格指数（CPI）", topic: "inflation", importance: "high", relatedSeriesId: "US_CPI_YY" },
  { country: "US", pattern: /Core PCE|Core Personal Consumption Expenditure/i, nameZh: "美国核心PCE", topic: "inflation", importance: "high", relatedSeriesId: "US_CORE_PCE" },
  { country: "US", pattern: /Non[- ]?farm Payrolls|Employment Situation/i, nameZh: "美国非农就业", topic: "employment", importance: "high", relatedSeriesId: "US_NFP" },
  { country: "US", pattern: /ISM Manufacturing PMI/i, nameZh: "美国ISM制造业PMI", topic: "growth", importance: "high", relatedSeriesId: "US_ISM_MFG" },
  { country: "US", pattern: /Gross Domestic Product|\bGDP\b/i, exclude: /Price|Deflator/i, nameZh: "美国国内生产总值（GDP）", topic: "growth", importance: "high", relatedSeriesId: "US_GDP" },
  { country: "CN", pattern: /Medium[- ]term Lending Facility|\bMLF\b/i, nameZh: "中国MLF操作", topic: "central-bank", importance: "high", relatedSeriesId: "CN_MLF_1Y" },
  { country: "CN", pattern: /(?:1[- ]?Year|1Y).*Loan Prime Rate|Loan Prime Rate.*(?:1[- ]?Year|1Y)|LPR.*(?:1Y|1 Year)/i, nameZh: "中国1年期LPR", topic: "central-bank", importance: "high", relatedSeriesId: "CN_LPR_1Y" },
  { country: "CN", pattern: /(?:5[- ]?Year|5Y).*Loan Prime Rate|Loan Prime Rate.*(?:5[- ]?Year|5Y)|LPR.*(?:5Y|5 Year)/i, nameZh: "中国5年期以上LPR", topic: "central-bank", importance: "high", relatedSeriesId: "CN_LPR_5Y" },
  { country: "CN", pattern: /Manufacturing PMI/i, exclude: /Caixin/i, nameZh: "中国官方制造业PMI", topic: "growth", importance: "high", relatedSeriesId: "CN_PMI_MFG" },
  { country: "CN", pattern: /Consumer Price Index|\bCPI\b/i, exclude: /Core/i, nameZh: "中国消费者价格指数（CPI）", topic: "inflation", importance: "high", relatedSeriesId: "CN_CPI" },
  { country: "CN", pattern: /Producer Price Index|\bPPI\b/i, nameZh: "中国工业生产者出厂价格（PPI）", topic: "inflation", importance: "high", relatedSeriesId: "CN_PPI" },
  { country: "CN", pattern: /Total Social Financing|Aggregate Financing|Social Financing/i, nameZh: "中国社会融资规模", topic: "liquidity", importance: "high", relatedSeriesId: "CN_TSF_FLOW" },
];

function isoDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeCountry(value: unknown): MacroCountry | null {
  const country = asString(value)?.toUpperCase();
  if (country === "US" || country === "USA" || country === "UNITED STATES") return "US";
  if (country === "CN" || country === "CHN" || country === "CHINA") return "CN";
  return null;
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const normalized = value.trim().replaceAll(",", "");
  if (!normalized || normalized === "-" || /^n\/?a$/i.test(normalized)) return null;
  const match = normalized.match(/^([-+]?\d+(?:\.\d+)?)\s*([KMBT%])?/i);
  if (!match) return null;
  const number = Number(match[1]);
  return Number.isFinite(number) ? number : null;
}

function inferUnit(row: FmpCalendarRow): string | null {
  const explicit = asString(row.unit);
  if (explicit) return explicit;
  for (const value of [row.actual, row.estimate, row.consensus, row.previous]) {
    if (typeof value !== "string") continue;
    const suffix = value.trim().match(/(%|K|M|B|T)$/i)?.[1];
    if (suffix) return suffix.toUpperCase();
  }
  return null;
}

function normalizeDate(value: unknown): string | null {
  const raw = asString(value);
  if (!raw) return null;
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw);
  const normalized = raw.replace(" ", "T") + (hasZone ? "" : "Z");
  const parsed = Date.parse(normalized);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

function normalizeImportance(value: unknown, fallback: MacroEventImportance): MacroEventImportance {
  const impact = asString(value)?.toLowerCase();
  if (impact === "high") return "high";
  if (impact === "medium" || impact === "moderate") return "medium";
  if (impact === "low") return "low";
  return fallback;
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64) || "event";
}

function parseRow(row: FmpCalendarRow, start: Date, end: Date): MacroEvent | null {
  const eventName = asString(row.event) ?? asString(row.name);
  const country = normalizeCountry(row.country);
  const scheduledAt = normalizeDate(row.date);
  if (!eventName || !country || !scheduledAt) return null;
  const scheduledTime = Date.parse(scheduledAt);
  if (scheduledTime < start.getTime() || scheduledTime > end.getTime()) return null;
  const mapping = eventMappings.find((item) => item.country === country && item.pattern.test(eventName) && !item.exclude?.test(eventName));
  if (!mapping) return null;
  const actual = parseNumber(row.actual);
  return {
    id: `fmp-${country.toLowerCase()}-${slug(eventName)}-${scheduledAt.slice(0, 10)}`,
    country,
    eventName,
    eventNameZh: mapping.nameZh,
    scheduledAt,
    importance: normalizeImportance(row.impact, mapping.importance),
    topic: mapping.topic,
    previous: parseNumber(row.previous),
    consensus: parseNumber(row.estimate ?? row.consensus),
    actual,
    unit: inferUnit(row),
    status: actual === null ? (scheduledTime < Date.now() ? "delayed" : "upcoming") : "released",
    source: "Financial Modeling Prep Economic Calendar",
    sourceUrl: "https://site.financialmodelingprep.com/developer/docs/stable/economics-calendar",
    relatedSeriesId: mapping.relatedSeriesId,
  };
}

export async function getFmpCalendar(start: Date, end: Date): Promise<MacroEvent[]> {
  const apiKey = process.env.FMP_API_KEY?.trim();
  if (!apiKey) return [];
  return withMemoryCache(`macro:calendar:fmp:${isoDay(start)}:${isoDay(end)}`, 10 * 60 * 1000, async () => {
    const url = new URL("https://financialmodelingprep.com/stable/economic-calendar");
    url.searchParams.set("from", isoDay(start));
    url.searchParams.set("to", isoDay(end));
    const payload = await fetchJsonWithRetry<unknown>(
      url,
      { provider: "fmp", operation: "economic-calendar", timeoutMs: 12_000 },
      { headers: { apikey: apiKey } },
    );
    if (!Array.isArray(payload)) throw new Error("FMP economic calendar returned an invalid payload");
    return payload.flatMap((item) => {
      if (typeof item !== "object" || item === null) return [];
      const event = parseRow(item as FmpCalendarRow, start, end);
      return event ? [event] : [];
    });
  });
}
