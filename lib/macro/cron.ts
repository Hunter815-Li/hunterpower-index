import { macroSeriesDefinitions } from "@/lib/macro/series-config";
import { refreshMacroDefinitions } from "@/lib/macro/service";
import { getMacroCalendar } from "@/lib/macro/calendar";

export function isCronAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  return process.env.NODE_ENV !== "production" || Boolean(secret && request.headers.get("authorization") === `Bearer ${secret}`);
}

export async function runMacroRefresh(scope: "intraday" | "daily" | "release-window") {
  const definitions = scope === "intraday"
    ? macroSeriesDefinitions.filter((item) => item.category === "rates" || item.frequency === "intraday")
    : scope === "release-window"
      ? macroSeriesDefinitions.filter((item) => item.frequency === "monthly" || item.frequency === "quarterly")
      : macroSeriesDefinitions;
  return refreshMacroDefinitions(definitions);
}

export async function runCalendarRefresh() { return getMacroCalendar(30); }
