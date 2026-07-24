import Link from "next/link";
import { BilingualText } from "@/components/ui/BilingualText";

export function PlannedPage({ eyebrow, title, titleEn, description, descriptionEn }: { eyebrow: string; title: string; titleEn: string; description: string; descriptionEn: string }) {
  return <main className="reading-page"><section className="page-hero shell"><span className="eyebrow dark">{eyebrow} · PHASE 02</span><h1><BilingualText zh={title} en={titleEn} /></h1><p><BilingualText zh={description} en={descriptionEn} /></p></section><section className="section shell"><div className="empty-state"><span>EDITORIAL MODULE</span><h2><BilingualText zh="首期暂不发布未验证数据" en="No Unverified Data in Phase One" /></h2><p><BilingualText zh="页面结构已预留。待内容与数据源定义完成后上线，不用占位数据填充。" en="The page structure is reserved and will launch once its content and data sources are defined, without placeholder data." /></p><Link className="button button-secondary light" href="/"><BilingualText zh="返回首页" en="Back to Home" /></Link></div></section></main>;
}
