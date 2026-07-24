import type { Metadata } from "next";
import Link from "next/link";
import { QrCard } from "@/components/research/QrCard";
import { wechatArticles } from "@/config/wechat";
import { BilingualText } from "@/components/ui/BilingualText";

export const metadata: Metadata = {
  title: "微信公众号",
  description: "滔说 Finance 微信公众号文章索引。",
};

export default function WechatPage() {
  return (
    <main className="reading-page">
      <section className="page-hero shell wechat-hero">
        <div>
          <span className="eyebrow dark">WECHAT ARCHIVE</span>
          <h1><BilingualText zh="微信公众号文章" en="WeChat Articles" /></h1>
          <p><BilingualText zh="收录滔说 Finance 已发布文章；点击卡片中的“微信原文”即可前往公众号阅读。" en="An archive of TaoTalk Finance publications. Open each entry to read the original article on WeChat." /></p>
        </div>
        <QrCard />
      </section>
      <section className="section shell">
        {wechatArticles.length ? (
          <div className="wechat-list">
            {wechatArticles.map((article) => (
              <article key={article.originalUrl}>
                <div className="wechat-meta">
                  <span>{article.category}</span>
                  <time dateTime={article.publishedAt}>{article.publishedAt}</time>
                </div>
                <h2>{article.title}</h2>
                <p>{article.summary}</p>
                <footer>
                  {article.localSlug && <Link href={`/research/${article.localSlug}`}>站内阅读全文</Link>}
                  <a href={article.originalUrl} target="_blank" rel="noopener noreferrer">
                    <BilingualText zh="微信原文" en="Read Original" /> ↗
                  </a>
                </footer>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span>WECHAT ARCHIVE</span>
            <h3><BilingualText zh="文章目录正在整理" en="Archive in Progress" /></h3>
            <p><BilingualText zh="关注滔说 Finance 公众号获取最新内容，网站将陆续收录微信公开原文。" en="Follow TaoTalk Finance on WeChat for the latest publications." /></p>
          </div>
        )}
      </section>
    </main>
  );
}
