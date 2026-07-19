"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { sectors } from "@/data/constituents";
import type { ConstituentPerformance } from "@/lib/marketData";

type SortKey = "ticker" | "dailyReturn" | "oneMonthReturn" | "threeMonthReturn" | "oneYearReturn" | "weight" | "contributionOneYear";

const formatPercent = (value: number | null) => value === null ? "—" : `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
const tone = (value: number | null) => value === null ? "muted" : value >= 0 ? "positive" : "negative";

function MiniStockChart({ stock }: { stock: ConstituentPerformance }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let chart: { setOption: (option: unknown) => void; dispose: () => void } | undefined;
    let disposed = false;
    (async () => {
      const echarts = await import("echarts");
      if (disposed || !ref.current) return;
      chart = echarts.init(ref.current, undefined, { renderer: "canvas" });
      chart.setOption({
        animation: false,
        grid: { left: 8, right: 8, top: 10, bottom: 18 },
        tooltip: { trigger: "axis", backgroundColor: "#101a27", borderColor: "#2a3b50", textStyle: { color: "#fff" } },
        xAxis: { type: "category", data: stock.history.map((p) => p.date), axisLabel: { show: false }, axisLine: { lineStyle: { color: "#273446" } }, axisTick: { show: false } },
        yAxis: { type: "value", scale: true, show: false },
        series: [{ type: "line", data: stock.history.map((p) => p.adjustedClose), showSymbol: false, smooth: 0.15, lineStyle: { color: stock.dailyReturn >= 0 ? "#ff5a65" : "#18c98c", width: 2 }, areaStyle: { color: stock.dailyReturn >= 0 ? "rgba(255,90,101,.10)" : "rgba(24,201,140,.10)" } }],
      });
    })();
    return () => { disposed = true; chart?.dispose(); };
  }, [stock]);
  return <div className="mini-stock-chart" ref={ref} />;
}

export function ConstituentTable({ rows }: { rows: ConstituentPerformance[] }) {
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("全部行业");
  const [sortKey, setSortKey] = useState<SortKey>("oneYearReturn");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<ConstituentPerformance | null>(null);

  const filtered = useMemo(() => rows
    .filter((row) => sector === "全部行业" || row.sector === sector)
    .filter((row) => `${row.ticker}${row.companyName}${row.chineseName}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => {
      const aValue = a[sortKey] ?? -Infinity;
      const bValue = b[sortKey] ?? -Infinity;
      const result = typeof aValue === "string" ? aValue.localeCompare(String(bValue)) : Number(aValue) - Number(bValue);
      return sortDirection === "asc" ? result : -result;
    }), [rows, query, sector, sortKey, sortDirection]);

  const changeSort = (key: SortKey) => {
    if (sortKey === key) setSortDirection((value) => value === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDirection("desc"); }
  };

  const exportCsv = () => {
    const header = ["股票代码", "公司名称", "中文名称", "所属行业", "最新价格", "今日涨跌幅", "近一月涨跌幅", "近三月涨跌幅", "近一年涨跌幅", "指数权重", "近一年收益贡献"];
    const body = filtered.map((row) => [row.ticker, row.companyName, row.chineseName, row.sector, row.latestPrice, row.dailyReturn, row.oneMonthReturn ?? "", row.threeMonthReturn ?? "", row.oneYearReturn ?? "", row.weight, row.contributionOneYear ?? ""]);
    const csv = `\uFEFF${[header, ...body].map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `hunter-power-index-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click();
    URL.revokeObjectURL(url);
  };

  const sortable = (label: string, key: SortKey) => <button className={sortKey === key ? "sort-button active" : "sort-button"} onClick={() => changeSort(key)}>{label}<span>{sortKey === key ? (sortDirection === "desc" ? "↓" : "↑") : "↕"}</span></button>;

  return (
    <section className="panel table-panel" id="constituents">
      <div className="panel-heading table-heading">
        <div><span className="section-kicker">CONSTITUENTS</span><h2>成分股表现 <small>{filtered.length} / {rows.length}</small></h2></div>
        <div className="table-actions">
          <label className="search-box"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索代码或公司" aria-label="搜索股票" /></label>
          <select value={sector} onChange={(event) => setSector(event.target.value)} aria-label="按行业筛选"><option>全部行业</option>{sectors.map((item) => <option key={item}>{item}</option>)}</select>
          <button className="export-button" onClick={exportCsv}>导出 CSV</button>
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead><tr>
            <th>{sortable("股票代码", "ticker")}</th><th>公司名称</th><th>中文名称</th><th>所属行业</th><th>最新价格</th>
            <th>{sortable("今日", "dailyReturn")}</th><th>{sortable("近1月", "oneMonthReturn")}</th><th>{sortable("近3月", "threeMonthReturn")}</th><th>{sortable("近1年", "oneYearReturn")}</th><th>{sortable("权重", "weight")}</th><th>{sortable("年度贡献", "contributionOneYear")}</th>
          </tr></thead>
          <tbody>{filtered.map((row) => <tr key={row.ticker} onClick={() => setSelected(row)} tabIndex={0} onKeyDown={(event) => event.key === "Enter" && setSelected(row)}>
            <td><strong className="ticker">{row.ticker}</strong>{row.dataStatus === "limited" && <span className="limited-badge">历史不足</span>}</td>
            <td className="company-name">{row.companyName}</td><td>{row.chineseName}</td><td><span className="sector-chip">{row.sector}</span></td><td className="number">${row.latestPrice.toFixed(2)}</td>
            <td className={`number ${tone(row.dailyReturn)}`}>{formatPercent(row.dailyReturn)}</td><td className={`number ${tone(row.oneMonthReturn)}`}>{formatPercent(row.oneMonthReturn)}</td><td className={`number ${tone(row.threeMonthReturn)}`}>{formatPercent(row.threeMonthReturn)}</td><td className={`number ${tone(row.oneYearReturn)}`}>{formatPercent(row.oneYearReturn)}</td><td className="number">{(row.weight * 100).toFixed(1)}%</td><td className={`number ${tone(row.contributionOneYear)}`}>{formatPercent(row.contributionOneYear)}</td>
          </tr>)}</tbody>
        </table>
      </div>
      {selected && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}><div className="stock-modal" role="dialog" aria-modal="true" aria-label={`${selected.ticker} 详细走势`}>
        <button className="modal-close" onClick={() => setSelected(null)} aria-label="关闭">×</button>
        <div className="modal-title"><div><span className="section-kicker">CONSTITUENT DETAIL</span><h3>{selected.ticker} <small>{selected.chineseName}</small></h3><p>{selected.companyName} · {selected.sector}</p></div><div className="modal-quote"><strong>${selected.latestPrice.toFixed(2)}</strong><span className={tone(selected.dailyReturn)}>{formatPercent(selected.dailyReturn)}</span></div></div>
        <MiniStockChart stock={selected} />
        <div className="modal-stats"><span>近1月 <b className={tone(selected.oneMonthReturn)}>{formatPercent(selected.oneMonthReturn)}</b></span><span>近3月 <b className={tone(selected.threeMonthReturn)}>{formatPercent(selected.threeMonthReturn)}</b></span><span>近1年 <b className={tone(selected.oneYearReturn)}>{formatPercent(selected.oneYearReturn)}</b></span><span>指数权重 <b>{(selected.weight * 100).toFixed(1)}%</b></span></div>
      </div></div>}
    </section>
  );
}
