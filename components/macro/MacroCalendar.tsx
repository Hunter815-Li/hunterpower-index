"use client";

import { useEffect, useMemo, useState } from "react";
import { BilingualText } from "@/components/ui/BilingualText";
import type { MacroEvent } from "@/lib/macro/types";

type Filter = "all" | "CN" | "US" | "high" | "medium";

const filters: Array<{ id: Filter; zh: string; en: string }> = [
  { id: "all", zh: "全部", en: "All" },
  { id: "CN", zh: "中国", en: "China" },
  { id: "US", zh: "美国", en: "United States" },
  { id: "high", zh: "高重要性", en: "High" },
  { id: "medium", zh: "中等重要性", en: "Medium" },
];

const allowedSeries = new Set([
  "US_FED_TARGET", "US_CPI_YY", "US_CORE_PCE", "US_NFP", "US_ISM_MFG", "US_GDP",
  "CN_MLF_1Y", "CN_LPR_1Y", "CN_LPR_5Y", "CN_PMI_MFG", "CN_CPI", "CN_PPI", "CN_TSF_FLOW",
]);

const allowedName = /FOMC|consumer price|personal income and outlays|employment situation|nonfarm|ISM|gross domestic product|MLF|LPR|PMI|CPI|PPI|social financing|社融/i;

function isSelectedEvent(event: MacroEvent) {
  return (event.relatedSeriesId !== null && allowedSeries.has(event.relatedSeriesId)) || allowedName.test(`${event.eventName} ${event.eventNameZh}`);
}

function formatEventValue(value: number | null, unit: string | null) {
  if (value === null) return "—";
  const formatted = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
  if (!unit || unit.toLowerCase() === "index") return formatted;
  return `${formatted}${unit === "%" || /^[KMBT]$/i.test(unit) ? unit : ` ${unit}`}`;
}

export function MacroCalendar({ events }: { events: MacroEvent[] }) {
  const [calendar, setCalendar] = useState(events.filter(isSelectedEvent));
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [fmpUnavailable, setFmpUnavailable] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/macro/calendar?days=14", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Calendar API returned ${response.status}`);
        return await response.json() as { data: MacroEvent[]; providers?: { fmp?: string } };
      })
      .then((payload) => {
        setCalendar(payload.data.filter(isSelectedEvent));
        setFmpUnavailable(payload.providers?.fmp === "unavailable");
        setLoadState("ready");
      })
      .catch(() => setLoadState("error"));
    return () => controller.abort();
  }, []);
  const visible = useMemo(() => calendar.filter((event) => {
    if (filter === "all") return true;
    if (filter === "CN" || filter === "US") return event.country === filter;
    return event.importance === filter;
  }), [calendar, filter]);

  return (
    <section className="macro-block">
      <div className="macro-section-heading">
        <div><span className="section-kicker">05 / ECONOMIC CALENDAR</span><h2><BilingualText zh="未来14天重要事件" en="14-Day Economic Calendar" /></h2></div>
        <p><BilingualText zh="仅保留央行、通胀、就业、PMI与GDP等高投资相关性发布。" en="Only market-relevant central-bank, inflation, employment, PMI and GDP releases." /></p>
      </div>
      <div className="macro-filters" role="group" aria-label="Calendar filters">
        {filters.map((item) => <button className={filter === item.id ? "active" : ""} key={item.id} type="button" onClick={() => setFilter(item.id)}><BilingualText zh={item.zh} en={item.en} /></button>)}
      </div>
      {loadState === "ready" && fmpUnavailable && (
        <div className="macro-calendar-loading">
          <BilingualText
            zh="当前 FMP 套餐未授权经济日历，已自动切换至 FRED 与中国官方发布日程。"
            en="FMP economic-calendar access is not included in the current plan. Official FRED and China release schedules are shown instead."
          />
        </div>
      )}
      {loadState === "loading" && <div className="macro-calendar-loading"><BilingualText zh="正在同步官方发布日历…" en="SYNCING OFFICIAL CALENDARS…" /></div>}
      {loadState === "error" && <div className="macro-calendar-loading macro-calendar-error"><BilingualText zh="日历同步失败，未显示推测事件。" en="Calendar sync failed. No estimated events are shown." /></div>}
      {visible.length === 0 ? (
        <div className="macro-empty"><span>CALENDAR PENDING</span><h3><BilingualText zh="未来14天暂无已确认事件" en="No confirmed events" /></h3><p><BilingualText zh="不会用推测日期或虚构预期值填充。" en="No estimated dates or fabricated consensus values are displayed." /></p></div>
      ) : (
        <div className="macro-calendar-list">{visible.map((event) => <article key={event.id}>
          <time>{new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Shanghai" }).format(new Date(event.scheduledAt))}</time>
          <div><b><BilingualText zh={event.eventNameZh} en={event.eventName} /></b><small>{event.country} · {event.importance.toUpperCase()}</small></div>
          <dl><div><dt>PREV.</dt><dd>{formatEventValue(event.previous, event.unit)}</dd></div><div><dt>CONS.</dt><dd>{formatEventValue(event.consensus, event.unit)}</dd></div><div><dt>ACTUAL</dt><dd>{formatEventValue(event.actual, event.unit)}</dd></div></dl>
          <div className="macro-calendar-source"><span>{event.status}</span><a href={event.sourceUrl} target="_blank" rel="noopener noreferrer">SOURCE ↗</a></div>
        </article>)}</div>
      )}
    </section>
  );
}
