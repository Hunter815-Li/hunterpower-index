import Link from "next/link";
import { BilingualText } from "@/components/ui/BilingualText";

export default function IndicesPage() {
  return (
    <main className="reading-page">
      <section className="page-hero shell">
        <span className="eyebrow dark">THEMATIC INDEX RESEARCH</span>
        <h1><BilingualText zh="主题指数" en="Thematic Indices" /></h1>
        <p><BilingualText zh="以透明方法论把产业研究转化为可追踪的市场观察框架。" en="Turning industry research into transparent, trackable market frameworks." /></p>
      </section>

      <section className="section shell">
        <div className="index-list">
          <Link href="/indices/hunter-power" className="index-list-item live">
            <div>
              <span>HPI · LIVE</span>
              <h2>Hunter Power Index</h2>
              <p><BilingualText zh="美国电力基础设施产业链等权指数。" en="An equal-weight index of the US power infrastructure value chain." /></p>
            </div>
            <dl>
              <div><dt>Base</dt><dd>100</dd></div>
              <div><dt>Weighting</dt><dd>Equal Weight</dd></div>
              <div><dt>Rebalance</dt><dd>Quarterly</dd></div>
            </dl>
            <b><BilingualText zh="查看指数" en="View Index" /> →</b>
          </Link>

          <a
            href="https://cwwindex.today/#trend"
            className="index-list-item live"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div>
              <span>CWW · EXTERNAL</span>
              <h2>Hunter Memory Chips Index</h2>
              <p><BilingualText zh="中国与非中国存储指数 · CWW Index 独立指数站点。" en="China & Ex-China Memory Chips Index · Independent CWW Index website." /></p>
            </div>
            <dl>
              <div><dt>Index</dt><dd>CWW</dd></div>
              <div><dt>Coverage</dt><dd>China / Ex-China</dd></div>
              <div><dt>Access</dt><dd>External</dd></div>
            </dl>
            <b><BilingualText zh="访问指数" en="Visit Index" /> ↗</b>
          </a>
        </div>
      </section>
    </main>
  );
}
