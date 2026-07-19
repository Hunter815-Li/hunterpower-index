import type { MarketSnapshot } from "@/lib/marketData";

const signed = (value: number, suffix = "") => `${value >= 0 ? "+" : ""}${value.toFixed(2)}${suffix}`;

export function IndexSummary({ data }: { data: MarketSnapshot }) {
  const isUp = data.dailyChange >= 0;
  return (
    <section className="summary-grid" aria-label="指数摘要">
      <article className="index-hero panel">
        <div className="eyebrow"><span className="live-dot" /> HPI · US POWER INFRASTRUCTURE</div>
        <div className="index-value-row">
          <strong>{data.latestValue.toFixed(2)}</strong>
          <div className={isUp ? "positive" : "negative"}>
            <span>{signed(data.dailyChange)}</span>
            <span>{signed(data.dailyChangePercent, "%")}</span>
          </div>
        </div>
        <div className="hero-meta">
          <span>Hunter电力指数</span>
          <span>{data.updatedAt}</span>
        </div>
      </article>

      <div className="metric-cards">
        <article className="metric-card panel">
          <span>当日涨跌点数</span>
          <strong className={isUp ? "positive" : "negative"}>{signed(data.dailyChange)}</strong>
          <small>Daily change</small>
        </article>
        <article className="metric-card panel">
          <span>当日涨跌幅</span>
          <strong className={isUp ? "positive" : "negative"}>{signed(data.dailyChangePercent, "%")}</strong>
          <small>Daily return</small>
        </article>
        <article className="metric-card panel">
          <span>成分股数量</span>
          <strong>{data.constituentCount}</strong>
          <small>Constituents</small>
        </article>
        <article className="metric-card panel">
          <span>基准日期 / 点位</span>
          <strong className="metric-date">{data.baseDate}</strong>
          <small>Base value {data.baseValue}</small>
        </article>
      </div>
    </section>
  );
}
