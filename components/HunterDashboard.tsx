import { IndexSummary } from "@/components/IndexSummary";
import { IndexChart } from "@/components/IndexChart";
import { ConstituentTable } from "@/components/ConstituentTable";
import { SectorAnalysis } from "@/components/SectorAnalysis";
import { ContributionRankings } from "@/components/ContributionRankings";
import type { MarketSnapshot } from "@/lib/marketData";

export function HunterDashboard({ data }: { data: MarketSnapshot }) {
  return <>
    <header className="topbar">
      <a className="brand" href="#top" aria-label="Hunter电力指数首页"><span className="brand-mark">HPI</span><span><strong>Hunter电力指数</strong><small>Hunter Power Index</small></span></a>
      <nav aria-label="页面导航"><a href="#trend">指数走势</a><a href="#constituents">成分股</a><a href="#sectors">行业分析</a><a href="#methodology">编制说明</a></nav>
      <div className="market-status"><span className="daily-dot" /> DAILY EOD <b>UPDATED</b></div>
    </header>
    <main className="site-shell" id="top">
      <section className="page-intro"><div><span className="section-kicker">HUNTER RESEARCH · INDEX PRODUCTS</span><h1>Hunter电力指数 <small>Hunter Power Index</small></h1><p>Powering the Next Generation of Infrastructure</p></div><div className="source-badge"><span>{data.sourceLabel}</span><small>数据日 {data.dataDate} · 每日更新一次</small></div></section>
      {data.warnings.length > 0 && <details className="data-notice"><summary>数据说明 · {data.warnings.length} 项</summary><ul>{data.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></details>}
      <IndexSummary data={data} />
      <IndexChart data={data.comparisonSeries} />
      <ConstituentTable rows={data.constituents} />
      <div className="analysis-grid"><SectorAnalysis sectors={data.sectors} /><ContributionRankings rows={data.constituents} /></div>
      <section className="methodology panel" id="methodology">
        <div className="methodology-number">01</div><div><span className="section-kicker">INDEX METHODOLOGY</span><h2>指数编制说明</h2>
        <p>Hunter电力指数由美国电力设备、电网建设、公用事业、核能、储能、数据中心电力基础设施等相关上市公司构成。</p>
        <p>指数采用等权算术平均方法，将各成分股在基准日的复权价格标准化为100，再计算每日平均值，以反映美国电力基础设施产业链的整体市场表现。所有指数、行业及贡献数据均在服务器端计算。</p>
        <div className="formula"><span>HPI<sub>t</sub></span><b>=</b><span>1 / N</span><b>×</b><span>Σ ( P<sub>i,t</sub> / P<sub>i,0</sub> × 100 )</span></div>
        <p className="disclaimer">本指数仅用于非商业研究和信息展示，不构成任何投资建议。行情为至少延迟一个完整交易日的复权收盘数据，不提供实时交易信号或原始历史数据下载。</p></div>
      </section>
    </main>
    <footer>
      <span>HPI / HUNTER POWER INDEX</span>
      <span>Historical EOD data by <a href="https://www.marketdata.app" target="_blank">Market Data</a></span>
      <span>MIT Open Source · <a href="https://github.com/Hunter815-Li/hunterpower-index" target="_blank">GitHub 源码</a></span>
      <span>© {new Date().getFullYear()} Hunter Research · Non-commercial research only</span>
    </footer>
  </>;
}
