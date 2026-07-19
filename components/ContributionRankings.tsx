import type { ConstituentPerformance } from "@/lib/marketData";

const format = (value: number | null) => value === null ? "—" : `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;

function RankingList({ title, subtitle, rows, field }: { title: string; subtitle: string; rows: ConstituentPerformance[]; field: "dailyReturn" | "contributionOneYear" }) {
  return <article className="ranking-card">
    <div className="ranking-title"><h3>{title}</h3><span>{subtitle}</span></div>
    <ol>{rows.map((row, index) => <li key={row.ticker}>
      <span className="rank">{String(index + 1).padStart(2, "0")}</span>
      <span className="rank-company"><strong>{row.ticker}</strong><small>{row.chineseName}</small></span>
      <b className={(row[field] ?? 0) >= 0 ? "positive" : "negative"}>{format(row[field])}</b>
    </li>)}</ol>
  </article>;
}

export function ContributionRankings({ rows }: { rows: ConstituentPerformance[] }) {
  const byContribution = [...rows].filter((row) => row.contributionOneYear !== null).sort((a, b) => (b.contributionOneYear ?? 0) - (a.contributionOneYear ?? 0));
  const byDaily = [...rows].sort((a, b) => b.dailyReturn - a.dailyReturn);
  return <section className="panel rankings-panel" id="rankings">
    <div className="panel-heading"><div><span className="section-kicker">LEADERS & LAGGARDS</span><h2>涨跌贡献榜</h2></div></div>
    <div className="rankings-grid">
      <RankingList title="年度贡献最大" subtitle="TOP CONTRIBUTORS · 1Y" rows={byContribution.slice(0, 5)} field="contributionOneYear" />
      <RankingList title="年度拖累最大" subtitle="BOTTOM CONTRIBUTORS · 1Y" rows={byContribution.slice(-5).reverse()} field="contributionOneYear" />
      <RankingList title="今日涨幅前五" subtitle="DAILY GAINERS" rows={byDaily.slice(0, 5)} field="dailyReturn" />
      <RankingList title="今日跌幅前五" subtitle="DAILY LOSERS" rows={byDaily.slice(-5).reverse()} field="dailyReturn" />
    </div>
  </section>;
}
