import type { ConstituentPerformance } from "@/lib/marketData";

const formatPercent = (value: number | null) => value === null ? "—" : `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
const tone = (value: number | null) => value === null ? "muted" : value >= 0 ? "positive" : "negative";

export function ConstituentTable({ rows }: { rows: ConstituentPerformance[] }) {
  return (
    <section className="panel table-panel" id="constituents">
      <div className="panel-heading table-heading">
        <div><span className="section-kicker">CONSTITUENTS</span><h2>成分股表现 <small>{rows.length} 只</small></h2></div>
        <p className="table-license-note">只读摘要 · 不提供原始行情下载</p>
      </div>
      <div className="table-scroll">
        <table>
          <thead><tr>
            <th>股票代码</th><th>公司名称</th><th>中文名称</th><th>所属行业</th><th>最新收盘价</th>
            <th>当日</th><th>近1月</th><th>近3月</th><th>近1年</th><th>权重</th><th>年度贡献</th>
          </tr></thead>
          <tbody>{rows.map((row) => <tr key={row.ticker}>
            <td><strong className="ticker">{row.ticker}</strong>{row.dataStatus === "limited" && <span className="limited-badge">历史不足</span>}</td>
            <td className="company-name">{row.companyName}</td><td>{row.chineseName}</td><td><span className="sector-chip">{row.sector}</span></td><td className="number">${row.latestPrice.toFixed(2)}</td>
            <td className={`number ${tone(row.dailyReturn)}`}>{formatPercent(row.dailyReturn)}</td><td className={`number ${tone(row.oneMonthReturn)}`}>{formatPercent(row.oneMonthReturn)}</td><td className={`number ${tone(row.threeMonthReturn)}`}>{formatPercent(row.threeMonthReturn)}</td><td className={`number ${tone(row.oneYearReturn)}`}>{formatPercent(row.oneYearReturn)}</td><td className="number">{(row.weight * 100).toFixed(1)}%</td><td className={`number ${tone(row.contributionOneYear)}`}>{formatPercent(row.contributionOneYear)}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}
