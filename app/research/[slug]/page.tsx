import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import { QrCard } from "@/components/research/QrCard";
import { getAllResearch, getResearchBySlug, type ResearchFrontmatter } from "@/lib/content/research";

export async function generateStaticParams() { return (await getAllResearch()).map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const article = await getResearchBySlug((await params).slug); return article ? { title: article.title, description: article.summary, openGraph: { type: "article", publishedTime: article.date, modifiedTime: article.updatedAt, tags: article.tags } } : {}; }

const mdxComponents = {
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props} target={props.href?.startsWith("http") ? "_blank" : undefined} rel={props.href?.startsWith("http") ? "noopener noreferrer" : undefined} />,
  blockquote: (props: React.BlockquoteHTMLAttributes<HTMLQuoteElement>) => <blockquote className="research-quote" {...props} />,
};

export default async function ResearchArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const article = await getResearchBySlug((await params).slug); if (!article) notFound();
  const compiled = await compileMDX<ResearchFrontmatter>({ source: article.content, components: mdxComponents, options: { parseFrontmatter: false } });
  const related = (await getAllResearch()).filter((item) => item.slug !== article.slug && (item.category === article.category || item.tags.some((tag) => article.tags.includes(tag)))).slice(0, 3);
  const jsonLd = { "@context": "https://schema.org", "@type": "Article", headline: article.title, datePublished: article.date, dateModified: article.updatedAt ?? article.date, author: { "@type": "Person", name: "Bangtao Li" }, publisher: { "@type": "Organization", name: "TaoTalk Finance" }, description: article.summary };
  return <main className="article-page"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /><article className="article-shell"><header><Link className="back-link" href="/research">← 返回研究</Link><span className="eyebrow dark">{article.category}</span><h1>{article.title}</h1><p className="article-subtitle">{article.subtitle}</p><div className="article-byline"><span>李邦滔 / Bangtao Li</span><time>发布 {article.date}</time>{article.updatedAt && <time>更新 {article.updatedAt}</time>}<span>{article.readingTime}</span></div><div className="tag-row">{article.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></header><div className="article-layout"><aside className="article-toc"><b>CONTENTS</b><p>目录根据文章标题自动呈现于正文结构中。</p></aside><div className="mdx-content">{compiled.content}{article.dataSources?.length ? <section className="data-sources"><h2>数据来源</h2><ul>{article.dataSources.map((source) => <li key={source}>{source}</li>)}</ul></section> : null}<div className="article-end"><QrCard />{article.wechatUrl && <a className="button button-primary" href={article.wechatUrl} target="_blank" rel="noopener noreferrer">阅读微信公众号原文 ↗</a>}</div></div></div></article>{related.length > 0 && <section className="section shell"><h2>相关文章</h2><ul className="related-list">{related.map((item) => <li key={item.slug}><Link href={`/research/${item.slug}`}>{item.title}</Link></li>)}</ul></section>}</main>;
}
