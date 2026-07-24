import Link from "next/link";
import { MarketBoard } from "@/components/market/MarketBoard";
import { ResearchCards } from "@/components/research/ResearchCards";
import { getHomeMarketBoard } from "@/lib/market-data/market-board";
import { getAllResearch } from "@/lib/content/research";
import { wechatArticles } from "@/config/wechat";
import { BilingualText } from "@/components/ui/BilingualText";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [market, research] = await Promise.all([getHomeMarketBoard(), getAllResearch()]);

  return (
    <main>
      <section className="hero terminal-section">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">GLOBAL FINANCE INTELLIGENCE</span>
            <h1 className="hero-intelligence"><span>Global Finance</span><em>Intelligence</em></h1>
            <div className="hero-signature"><span className="hero-signature-seal">滔</span><small>DESIGNED BY <b>李邦滔</b></small></div>
            <p className="hero-lede"><BilingualText zh="以全球宏观为坐标，以产业研究为纵深，连接权益、FICC 与大类资产。" en="Connecting equities, FICC and cross-asset research through a global macro and industry lens." /></p>
            <p className="hero-subtitle">Global Macro · Equities · FICC · Thematic Indices</p>
            <div className="button-row">
              <Link className="button button-primary" href="/markets"><BilingualText zh="进入市场终端" en="Open Markets" /></Link>
              <Link className="button button-secondary" href="/indices"><BilingualText zh="查看主题指数" en="View Indices" /></Link>
              <Link className="text-link" href="/research"><BilingualText zh="阅读最新研究" en="Latest Research" /> <span aria-hidden="true">→</span></Link>
            </div>
          </div>
          <MarketBoard data={market} compact />
        </div>
      </section>

      <section className="section shell">
        <div className="section-heading">
          <div><span className="eyebrow dark">GLOBAL MARKET PULSE</span><h2><BilingualText zh="全球市场概览" en="Global Market Overview" /></h2></div>
          <Link className="section-link" href="/markets"><BilingualText zh="打开完整终端" en="Open Full Terminal" /> →</Link>
        </div>
        <div className="asset-grid">
          {[
            ["01", "Equities", "全球股指、行业与风格因子的风险偏好温度。", "Global indices, sectors and style factors as gauges of risk appetite."],
            ["02", "Rates", "美债曲线、实际利率与期限溢价的宏观信号。", "Macro signals from the Treasury curve, real rates and term premium."],
            ["03", "FX & Commodities", "美元、黄金、原油与全球流动性的交叉验证。", "Cross-checking the dollar, gold, oil and global liquidity."],
            ["04", "Alternative Assets", "加密资产与波动率指标的边际变化。", "Marginal changes in crypto assets and volatility indicators."],
          ].map(([number, title, copyZh, copyEn]) => <article className="asset-card" key={title}><span>{number}</span><h3>{title}</h3><p><BilingualText zh={copyZh} en={copyEn} /></p></article>)}
        </div>
      </section>

      <section className="section section-muted">
        <div className="shell">
          <div className="section-heading"><div><span className="eyebrow dark">ORIGINAL INDEX RESEARCH</span><h2><BilingualText zh="Hunter 原创主题指数" en="Hunter Original Indices" /></h2></div></div>
          <div className="index-grid index-grid-single">
            <Link className="index-feature" href="/indices/hunter-power">
              <div><span className="status status-live">LIVE · HPI</span><h3>Hunter Power Index</h3><p><BilingualText zh="追踪美国电力设备、电网建设、公用事业、核能、储能及数据中心电力基础设施。" en="Tracking US power equipment, grids, utilities, nuclear, storage and data-center power infrastructure." /></p></div>
              <div className="index-meta"><span>Base 100</span><span>Equal Weight</span><span>Quarterly</span></div>
            </Link>
          </div>
        </div>
      </section>

      <section className="section shell">
        <div className="section-heading"><div><span className="eyebrow dark">LATEST RESEARCH</span><h2><BilingualText zh="最新研究" en="Latest Research" /></h2></div><Link className="section-link" href="/research"><BilingualText zh="查看全部" en="View All" /> →</Link></div>
        {research.length > 0 ? <ResearchCards articles={research.slice(0, 3)} emptyMessage="" /> : <div className="research-grid">{wechatArticles.slice(0, 3).map((article) => <article className="research-card" key={article.originalUrl}><div className="research-card-top"><span>{article.category}</span><time dateTime={article.publishedAt}>{article.publishedAt}</time></div><h3><a href={article.originalUrl} target="_blank" rel="noopener noreferrer">{article.title}</a></h3><p>{article.summary}</p><footer><span><BilingualText zh="微信公众号" en="WeChat" /></span><a href={article.originalUrl} target="_blank" rel="noopener noreferrer"><BilingualText zh="微信原文" en="Read Original" /> ↗</a></footer></article>)}</div>}
      </section>

    </main>
  );
}
