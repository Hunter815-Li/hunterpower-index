import type { MarketStatus } from "@/lib/market-data/types";

function easternParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

/** Local fallback for providers that do not expose an exchange-status API. */
export function getUsMarketStatus(date = new Date()): MarketStatus {
  const parts = easternParts(date);
  const weekday = parts.weekday;
  const minuteOfDay = Number(parts.hour) * 60 + Number(parts.minute);
  const businessDay = weekday !== "Sat" && weekday !== "Sun";
  const isOpen = businessDay && minuteOfDay >= 9 * 60 + 30 && minuteOfDay < 16 * 60;
  return { session: isOpen ? "open" : "closed", checkedAt: date.toISOString() };
}

export function easternDate(timestamp = Date.now()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(timestamp));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
