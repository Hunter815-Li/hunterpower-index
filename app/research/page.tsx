import type { Metadata } from "next";
import Link from "next/link";
import { wechatArticles } from "@/config/wechat";
import { getAllResearch, researchCategories, type ResearchCategory } from "@/lib/content/research";
import { BilingualText } from "@/components/ui/BilingualText";

export const metadata: Metadata = {
  title: "研究文章",
  description: "TaoTalk Finance 全球宏观、权益、FICC、电力能源、半导体与跨资产研究。",
};

interface ResearchEntry {
  key: string;
  title: string;
  date: string;
  category: ResearchCategory;
  summary: string;
  href: string;
  external: boolean;
  sourceLabel: string;
  tags: string[];
}

export default async function ResearchPage() {
  const localArticles = await getAllResearch();
  const localWechatLinks = new Set(localArticles.map((article) => article.wechatUrl).filter(Boolean));

  const entries: ResearchEntry[] = [
    ...localArticles.map((article) => ({
      key: `local-${article.slug}`,
      title: article.title,
      date: article.date,
      category: article.category,
      summary: article.summary,
      href: `/research/${article.slug}`,
      external: false,
      sourceLabel: article.readingTime,
      tags: article.tags.slice(0, 3),
    })),
    ...wechatArticles
      .filter((article) => !localWechatLinks.has(article.originalUrl))
      .map((article) => ({
        key: `wechat-${article.originalUrl}`,
        title: article.title,
        date: article.publishedAt,
        category: article.category,
        summary: article.summary,
        href: article.originalUrl,
        external: true,
        sourceLabel: "WeChat / 微信公众号",
        tags: [],
      })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <main className="reading-page">
      <section className="page-hero shell">
        <span className="eyebrow dark">RESEARCH LIBRARY</span>
        <h1><BilingualText zh="研究文章" en="Research" /></h1>
        <p><BilingualText zh="全球宏观、产业趋势与跨资产观察。事实、数据与观点分开呈现。" en="Global macro, industry trends and cross-asset perspectives, separating facts, data and views." /></p>
        <div className="category-row">
          {researchCategories.map((category) => (
            <span key={category}>{category}</span>
          ))}
        </div>
      </section>
      <section className="section shell">
        <div className="section-heading">
          <h2>
            <BilingualText zh="全部文章" en="All Research" /> <small>{entries.length}</small>
          </h2>
          <Link className="section-link" href="/research/wechat">
            <BilingualText zh="微信公众号专区" en="WeChat Archive" /> →
          </Link>
        </div>
        <div className="research-grid">
          {entries.map((entry) => (
            <article className="research-card" key={entry.key}>
              <div className="research-card-top">
                <span>{entry.category}</span>
                <time dateTime={entry.date}>{entry.date}</time>
              </div>
              <h3>
                {entry.external ? (
                  <a href={entry.href} target="_blank" rel="noopener noreferrer">
                    {entry.title}
                  </a>
                ) : (
                  <Link href={entry.href}>{entry.title}</Link>
                )}
              </h3>
              <p>{entry.summary}</p>
              {entry.tags.length > 0 && (
                <div className="tag-row">
                  {entry.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              )}
              <footer>
                <span>{entry.sourceLabel}</span>
                {entry.external ? (
                  <a href={entry.href} target="_blank" rel="noopener noreferrer">
                    <BilingualText zh="微信原文" en="Read Original" /> ↗
                  </a>
                ) : (
                  <Link href={entry.href}><BilingualText zh="阅读全文" en="Read Article" /> →</Link>
                )}
              </footer>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
