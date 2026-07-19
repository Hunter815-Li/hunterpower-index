import type { SectorPerformance } from "@/lib/marketData";

export function SectorAnalysis({ sectors }: { sectors: SectorPerformance[] }) {
  const maxContribution = Math.max(...sectors.map((item) => Math.abs(item.contribution)), 1);
  const donutStops: string[] = [];
  let cursor = 0;
  const colors = ["#f2b94b", "#55a8ff", "#b085ff", "#18c98c", "#ff6b74", "#65d4c0", "#d99bff", "#8ea2ba", "#de7d4c"];
  sectors.forEach((item, index) => {
    const next = cursor + item.equalWeight;
    donutStops.push(`${colors[index % colors.length]} ${cursor}% ${next}%`);
    cursor = next;
  });

  return (
    <section className="panel sector-panel" id="sectors">
      <div className="panel-heading"><div><span className="section-kicker">SECTOR ATTRIBUTION</span><h2>行业贡献分析</h2></div><span className="as-of">等权配置 · 当前成分</span></div>
      <div className="sector-layout">
        <div className="donut-wrap"><div className="donut" style={{ background: `conic-gradient(${donutStops.join(",")})` }}><div><strong>100%</strong><span>等权占比</span></div></div><p>按细分行业聚合</p></div>
        <div className="sector-table">
          <div className="sector-row sector-header"><span>行业</span><span>数量</span><span>占比</span><span>近1年平均</span><span>贡献</span></div>
          {sectors.map((item, index) => <div className="sector-row" key={item.sector}>
            <span className="sector-name"><i style={{ background: colors[index % colors.length] }} />{item.sector}</span>
            <span>{item.count}</span><span>{item.equalWeight.toFixed(0)}%</span>
            <span className={item.averageOneYearReturn >= 0 ? "positive" : "negative"}>{item.averageOneYearReturn >= 0 ? "+" : ""}{item.averageOneYearReturn.toFixed(1)}%</span>
            <span className="contribution-cell"><b className={item.contribution >= 0 ? "positive" : "negative"}>{item.contribution >= 0 ? "+" : ""}{item.contribution.toFixed(2)}%</b><i className={item.contribution >= 0 ? "bar positive-bar" : "bar negative-bar"} style={{ width: `${Math.abs(item.contribution) / maxContribution * 100}%` }} /></span>
          </div>)}
        </div>
      </div>
    </section>
  );
}
