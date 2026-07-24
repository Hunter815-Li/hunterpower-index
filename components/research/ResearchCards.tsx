import Link from "next/link";
import type { ResearchArticle } from "@/lib/content/research";

export function ResearchCards({ articles, emptyMessage }: { articles: ResearchArticle[]; emptyMessage: string }) {
  if (!articles.length) return <div className="empty-state"><span>RESEARCH ARCHIVE</span><h3>暂无已发布文章</h3><p>{emptyMessage}</p></div>;
  return <div className="research-grid">{articles.map((article) => <article className="research-card" key={article.slug}><div className="research-card-top"><span>{article.category}</span><time>{article.date}</time></div><h3><Link href={`/research/${article.slug}`}>{article.title}</Link></h3><p>{article.summary}</p><div className="tag-row">{article.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div><footer><span>{article.readingTime}</span><Link href={`/research/${article.slug}`}>阅读全文 →</Link></footer></article>)}</div>;
}
