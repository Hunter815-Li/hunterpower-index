"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ComparisonPoint } from "@/lib/marketData";

const ranges = { "1D": 2, "5D": 5, "1M": 22, "3M": 66, "6M": 132, "1Y": 262 } as const;
type Range = keyof typeof ranges;

export function IndexChart({ data }: { data: ComparisonPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [range, setRange] = useState<Range>("1Y");
  const [showNasdaq, setShowNasdaq] = useState(false);
  const visible = useMemo(() => data.slice(-ranges[range]), [data, range]);

  useEffect(() => {
    let disposed = false;
    let chart: { setOption: (option: unknown) => void; resize: () => void; dispose: () => void } | undefined;
    let observer: ResizeObserver | undefined;
    (async () => {
      const echarts = await import("echarts");
      if (disposed || !containerRef.current) return;
      chart = echarts.init(containerRef.current, undefined, { renderer: "canvas" });
      chart.setOption({
        animation: false,
        backgroundColor: "transparent",
        grid: { left: 42, right: 20, top: 28, bottom: 42 },
        legend: { show: false },
        tooltip: {
          trigger: "axis",
          backgroundColor: "#101a27",
          borderColor: "#2a3b50",
          textStyle: { color: "#e7edf5", fontFamily: "monospace", fontSize: 12 },
          axisPointer: { type: "cross", lineStyle: { color: "#53677e", type: "dashed" } },
        },
        xAxis: {
          type: "category",
          boundaryGap: false,
          data: visible.map((point) => point.date),
          axisLine: { lineStyle: { color: "#2a3544" } },
          axisLabel: { color: "#73849a", hideOverlap: true, fontSize: 11 },
          splitLine: { show: false },
        },
        yAxis: {
          type: "value",
          scale: true,
          axisLabel: { color: "#73849a", fontSize: 11 },
          splitLine: { lineStyle: { color: "#1b2735", type: "dashed" } },
        },
        series: [
          {
            name: "Hunter电力指数",
            type: "line",
            data: visible.map((point) => point.hunter),
            showSymbol: false,
            smooth: 0.18,
            lineStyle: { color: "#f2b94b", width: 2.4 },
            areaStyle: { color: "rgba(242,185,75,.10)" },
            emphasis: { lineStyle: { width: 3 } },
          },
          {
            name: "标普500",
            type: "line",
            data: visible.map((point) => point.sp500),
            showSymbol: false,
            smooth: 0.16,
            lineStyle: { color: "#55a8ff", width: 1.5 },
          },
          ...(showNasdaq ? [{
            name: "纳斯达克100",
            type: "line",
            data: visible.map((point) => point.nasdaq100),
            showSymbol: false,
            smooth: 0.16,
            lineStyle: { color: "#b085ff", width: 1.5 },
          }] : []),
        ],
      });
      observer = new ResizeObserver(() => chart?.resize());
      observer.observe(containerRef.current);
    })();
    return () => { disposed = true; observer?.disconnect(); chart?.dispose(); };
  }, [visible, showNasdaq]);

  return (
    <section className="panel chart-panel" id="trend">
      <div className="panel-heading chart-heading">
        <div>
          <span className="section-kicker">PERFORMANCE</span>
          <h2>指数走势 <small>标准化起点 = 100</small></h2>
        </div>
        <div className="range-tabs" role="group" aria-label="选择时间范围">
          {(Object.keys(ranges) as Range[]).map((item) => (
            <button key={item} className={range === item ? "active" : ""} onClick={() => setRange(item)}>{item}</button>
          ))}
        </div>
      </div>
      <div className="chart-legend">
        <span><i className="legend-hunter" /> Hunter电力指数</span>
        <span><i className="legend-sp" /> 标普500</span>
        <button className={showNasdaq ? "comparison-toggle active" : "comparison-toggle"} onClick={() => setShowNasdaq((value) => !value)}>
          <i className="legend-ndx" /> 纳斯达克100 {showNasdaq ? "×" : "+"}
        </button>
      </div>
      <div ref={containerRef} className="index-chart" role="img" aria-label="Hunter电力指数与基准指数走势对比图" />
    </section>
  );
}
