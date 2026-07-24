import { withMemoryCache } from "@/lib/market-data/cache";
import { fetchJsonWithRetry } from "@/lib/market-data/http";
import { verifiedChinaMacroEvents, verifiedUsMacroEvents } from "@/app/config/macro-events";
import type { MacroEvent, MacroEventImportance, MacroEventTopic } from "@/lib/macro/types";
import { persistMacroEvents } from "@/lib/macro/repository";
import { getFmpCalendar } from "@/lib/macro/providers/fmp-calendar";

interface FredReleaseDate { release_id?: number; release_name?: string; date?: string }
interface FredReleaseDatesResponse { release_dates?: FredReleaseDate[] }

const relevantReleases: Array<{ pattern: RegExp; topic: MacroEventTopic; importance: MacroEventImportance; relatedSeriesId: string | null }> = [
  { pattern: /^Consumer Price Index$/, topic: "inflation", importance: "high", relatedSeriesId: "US_CPI_YY" },
  { pattern: /^Producer Price Index$/, topic: "inflation", importance: "high", relatedSeriesId: "US_PPI_YY" },
  { pattern: /^Employment Situation$/, topic: "employment", importance: "high", relatedSeriesId: "US_NFP" },
  { pattern: /^Unemployment Insurance Weekly Claims Report$/, topic: "employment", importance: "medium", relatedSeriesId: "US_CLAIMS" },
  { pattern: /^Gross Domestic Product$/, topic: "growth", importance: "high", relatedSeriesId: "US_GDP" },
  { pattern: /^Personal Income and Outlays$/, topic: "inflation", importance: "high", relatedSeriesId: "US_CORE_PCE" },
  { pattern: /^Advance Monthly Sales for Retail and Food Services$/, topic: "growth", importance: "high", relatedSeriesId: "US_RETAIL" },
  { pattern: /^Industrial Production and Capacity Utilization$/, topic: "growth", importance: "medium", relatedSeriesId: "US_IP" },
  { pattern: /^Job Openings and Labor Turnover Survey$/, topic: "employment", importance: "medium", relatedSeriesId: null },
];

function isoDay(date: Date) { return date.toISOString().slice(0, 10); }

function dedupeEvents(events: MacroEvent[]) {
  const unique = new Map<string, MacroEvent>();
  for (const event of events) {
    const identity = event.relatedSeriesId ?? event.eventName.toLowerCase().replace(/\W+/g, "-");
    const key = `${event.country}:${identity}:${event.scheduledAt.slice(0, 10)}`;
    if (!unique.has(key)) unique.set(key, event);
  }
  return [...unique.values()];
}

async function getFredCalendar(start: Date, end: Date): Promise<MacroEvent[]> {
  const apiKey = process.env.FRED_API_KEY?.trim();
  if (!apiKey) return [];
  return withMemoryCache(`macro:calendar:fred:${isoDay(start)}:${isoDay(end)}`, 12 * 60 * 60 * 1000, async () => {
    const url = new URL("https://api.stlouisfed.org/fred/releases/dates");
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("file_type", "json");
    url.searchParams.set("realtime_start", isoDay(start));
    url.searchParams.set("realtime_end", isoDay(end));
    url.searchParams.set("include_release_dates_with_no_data", "true");
    url.searchParams.set("limit", "1000");
    const payload = await fetchJsonWithRetry<FredReleaseDatesResponse>(url, { provider: "fred", operation: "release-calendar", timeoutMs: 12_000 });
    return (payload.release_dates ?? []).flatMap((release) => {
      if (!release.release_id || !release.release_name || !release.date) return [];
      const mapping = relevantReleases.find((item) => item.pattern.test(release.release_name!));
      if (!mapping) return [];
      return [{
        id: `fred-${release.release_id}-${release.date}`, country: "US",
        eventName: release.release_name, eventNameZh: release.release_name,
        scheduledAt: `${release.date}T00:00:00-04:00`, importance: mapping.importance, topic: mapping.topic,
        previous: null, consensus: null, actual: null, unit: null, status: "upcoming",
        source: "Federal Reserve Bank of St. Louis (FRED) Release Calendar",
        sourceUrl: `https://fred.stlouisfed.org/release?rid=${release.release_id}`,
        relatedSeriesId: mapping.relatedSeriesId,
      } satisfies MacroEvent];
    });
  });
}

type CalendarProviderStatus = "fresh" | "empty" | "unavailable" | "not-configured";

interface MacroCalendarResult {
  data: MacroEvent[];
  status: "fresh" | "unavailable";
  updatedAt: string;
  providers: {
    fmp: CalendarProviderStatus;
    fred: CalendarProviderStatus;
    chinaOfficial: CalendarProviderStatus;
  };
}

export async function getMacroCalendar(days = 14): Promise<MacroCalendarResult> {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + days * 86_400_000);
  const [fmpResult, fredResult] = await Promise.allSettled([
    getFmpCalendar(start, end),
    getFredCalendar(start, end),
  ]);
  const fmp = fmpResult.status === "fulfilled" ? fmpResult.value : [];
  const fred = fredResult.status === "fulfilled"
    ? fredResult.value.filter((event) => event.relatedSeriesId !== "US_FED_TARGET")
    : [];
  const china = verifiedChinaMacroEvents.filter((event) => {
    const time = Date.parse(event.scheduledAt);
    return time >= start.getTime() && time <= end.getTime();
  }).map((event) => ({ ...event, status: Date.parse(event.scheduledAt) <= Date.now() ? "released" as const : event.status }));
  const usOfficial = verifiedUsMacroEvents.filter((event) => {
    const time = Date.parse(event.scheduledAt);
    return time >= start.getTime() && time <= end.getTime();
  }).map((event) => ({ ...event, status: Date.parse(event.scheduledAt) <= Date.now() ? "released" as const : event.status }));
  const data = dedupeEvents([...fmp, ...china, ...usOfficial, ...fred]).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  await persistMacroEvents(data).catch(() => undefined);
  const providerStatus = (
    configured: boolean,
    result: PromiseSettledResult<MacroEvent[]>,
    rows: MacroEvent[],
  ): CalendarProviderStatus => {
    if (!configured) return "not-configured";
    if (result.status === "rejected") return "unavailable";
    return rows.length > 0 ? "fresh" : "empty";
  };
  return {
    data,
    status: data.length > 0 ? "fresh" : "unavailable",
    updatedAt: new Date().toISOString(),
    providers: {
      fmp: providerStatus(Boolean(process.env.FMP_API_KEY?.trim()), fmpResult, fmp),
      fred: providerStatus(Boolean(process.env.FRED_API_KEY?.trim()), fredResult, fred),
      chinaOfficial: china.length > 0 ? "fresh" : "empty",
    },
  };
}
