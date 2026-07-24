import Link from "next/link";
import { BilingualText } from "@/components/ui/BilingualText";

export default function IndicesPage() {
  return <main className="reading-page"><section className="page-hero shell"><span className="eyebrow dark">THEMATIC INDEX RESEARCH</span><h1><BilingualText zh="主题指数" en="Thematic Indices" /></h1><p><BilingualText zh="以透明方法论把产业研究转化为可追踪的市场观察框架。" en="Turning industry research into transparent, trackable market frameworks." /></p></section><section className="section shell"><div className="index-list"><Link href="/indices/hunter-power" className="index-list-item live"><div><span>HPI · LIVE</span><h2>Hunter Power Index</h2><p><BilingualText zh="美国电力基础设施产业链等权指数。" en="An equal-weight index of the US power infrastructure value chain." /></p></div><dl><div><dt>Base</dt><dd>100</dd></div><div><dt>Weighting</dt><dd>Equal Weight</dd></div><div><dt>Rebalance</dt><dd>Quarterly</dd></div></dl><b><BilingualText zh="查看指数" en="View Index" /> →</b></Link></div></section></main>;
}
