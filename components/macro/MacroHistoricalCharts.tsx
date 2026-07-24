"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BilingualText } from "@/components/ui/BilingualText";
import type { MacroDashboardPayload, MacroMetricSnapshot } from "@/lib/macro/types";

interface HistoricalSeries { name: string; unit: string; points: Array<{ date: string; value: number }> }

function HistoricalPanel({ title, titleEn, series }: { title: string; titleEn: string; series: HistoricalSeries[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current || series.length === 0) return;
    let disposed = false;
    let chart: { setOption: (option: unknown) => void; resize: () => void; dispose: () => void } | undefined;
    let observer: ResizeObserver | undefined;
    void (async () => {
      const echarts = await import("echarts");
      if (disposed || !ref.current) return;
      const dates = Array.from(new Set(series.flatMap((item) => item.points.map((point) => point.date)))).sort();
      chart = echarts.init(ref.current, undefined, { renderer: "canvas" });
      chart.setOption({
        animation: false,
        backgroundColor: "transparent",
        color: ["#efbd55", "#6aa9dc", "#30b889", "#b085ff", "#e36a6f"],
        tooltip: { trigger: "axis", backgroundColor: "#101a27", borderColor: "#2a3b50", textStyle: { color: "#e7edf5", fontFamily: "monospace", fontSize: 10 } },
        legend: { top: 2, type: "scroll", textStyle: { color: "#8294a5", fontSize: 9 } },
        grid: { left: 48, right: 18, top: 42, bottom: 38 },
        xAxis: { type: "category", boundaryGap: false, data: dates, axisLine: { lineStyle: { color: "#2a3544" } }, axisLabel: { color: "#66798b", hideOverlap: true, fontSize: 9 } },
        yAxis: { type: "value", scale: true, axisLabel: { color: "#66798b", fontSize: 9 }, splitLine: { lineStyle: { color: "#1f2c38", type: "dashed" } } },
        series: series.map((item) => ({ name: item.name, type: "line", showSymbol: false, connectNulls: false, data: dates.map((date) => item.points.find((point) => point.date === date)?.value ?? null), lineStyle: { width: 1.6 } })),
      });
      observer = new ResizeObserver(() => chart?.resize());
      observer.observe(ref.current);
    })();
    return () => { disposed = true; observer?.disconnect(); chart?.dispose(); };
  }, [series]);
  return (
    <article className="macro-history-panel">
      <header><h3><BilingualText zh={title} en={titleEn} /></h3><span>{series[0]?.unit ?? "—"}</span></header>
      {series.length === 0 ? <div className="macro-history-empty"><BilingualText zh="历史数据不可用" en="Data unavailable" /></div> : <div ref={ref} className="macro-history-chart" role="img" aria-label={`${titleEn} verified history`} />}
      <footer><BilingualText zh="数据来源见各指标卡 · 最后有效值保留" en="Sources listed on metric cards · last valid values preserved" /></footer>
    </article>
  );
}

function collect(metrics: MacroMetricSnapshot[], codes: string[]): HistoricalSeries[] {
  return codes.flatMap((code) => {
    const metric = metrics.find((item) => item.code === code);
    if (!metric || metric.history.length < 2) return [];
    return [{ name: metric.name, unit: metric.unit, points: metric.history.map((item) => ({ date: item.period, value: item.value })) }];
  });
}

export function MacroHistoricalCharts() {
  const [metrics, setMetrics] = useState<MacroMetricSnapshot[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/macro/summary", { signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error("Macro history unavailable");
      return await response.json() as { china: MacroDashboardPayload; us: MacroDashboardPayload };
    }).then((payload) => { setMetrics([...payload.china.data, ...payload.us.data]); setState("ready"); }).catch(() => setState("error"));
    return () => controller.abort();
  }, []);
  const panels = useMemo(() => [
    { title: "中美通胀", titleEn: "China–US Inflation", series: collect(metrics, ["CN_CPI", "CN_CORE_CPI", "US_CPI_YY", "US_CORE_CPI_YY", "US_CORE_PCE"]) },
    { title: "中美收益率", titleEn: "China–US Yields", series: collect(metrics, ["CN_GB_10Y", "CN_GB_30Y", "US_2Y", "US_10Y", "US_30Y", "US_REAL_10Y"]) },
    { title: "美国流动性", titleEn: "US Liquidity", series: collect(metrics, ["US_FED_ASSETS", "US_TGA", "US_RRP", "US_M2", "US_RESERVES"]) },
  ], [metrics]);
  return (
    <section className="macro-block">
      <div className="macro-section-heading"><div><span className="section-kicker">06 / HISTORICAL CHARTS</span><h2><BilingualText zh="历史趋势与中美对比" en="Historical Trends & Comparisons" /></h2></div><p><BilingualText zh="仅绘制已验证的历史观测值。" en="Only verified observations are charted." /></p></div>
      {state === "loading" && <div className="macro-calendar-loading"><BilingualText zh="正在加载真实历史序列…" en="LOADING VERIFIED HISTORY…" /></div>}
      {state === "error" && <div className="macro-calendar-loading macro-calendar-error"><BilingualText zh="历史数据请求失败" en="Historical data unavailable" /></div>}
      <div className="macro-history-grid">{panels.map((panel) => <HistoricalPanel key={panel.titleEn} {...panel} />)}</div>
    </section>
  );
}
