import Link from "next/link";
import { QrCard } from "@/components/research/QrCard";
import { BilingualText } from "@/components/ui/BilingualText";
import { siteConfig } from "@/config/site";

export function SiteFooter() {
  return <footer className="site-footer"><div className="shell footer-grid">
    <div><div className="footer-brand"><span className="brand-seal">滔</span><div><b>{siteConfig.name}</b><small>DESIGNED BY 李邦滔</small></div></div><p><BilingualText zh="独立、克制、可验证的全球市场研究。" en="Independent, disciplined and verifiable global market research." /></p></div>
    <div className="footer-links"><b>Explore</b><Link href="/markets"><BilingualText zh="市场终端" en="Markets" /></Link><Link href="/indices"><BilingualText zh="主题指数" en="Indices" /></Link><Link href="/research"><BilingualText zh="研究文章" en="Research" /></Link><Link href="/about"><BilingualText zh="关于我" en="About" /></Link></div>
    <div className="footer-links"><b>Legal & Methodology</b><Link href="/methodology/hunter-power"><BilingualText zh="HPI 方法论" en="HPI Methodology" /></Link><Link href="/disclaimer"><BilingualText zh="免责声明" en="Disclaimer" /></Link><a href={siteConfig.github} target="_blank" rel="noopener noreferrer">GitHub ↗</a></div>
    <QrCard compact />
  </div><div className="shell footer-bottom"><p><BilingualText zh="本网站内容仅用于个人研究、信息分享与学术交流，不构成任何投资建议。市场数据可能延迟、缺失或存在误差。" en="Content is provided for personal research and information only, and does not constitute investment advice. Market data may be delayed, incomplete or inaccurate." /></p><span>© {new Date().getFullYear()} TaoTalk Finance</span></div></footer>;
}
