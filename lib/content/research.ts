import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export const researchCategories = ["Macro", "Equities", "FICC", "Power & Energy", "Semiconductors", "AI Infrastructure", "Cross Asset"] as const;
export type ResearchCategory = typeof researchCategories[number];

export interface ResearchFrontmatter {
  title: string; subtitle: string; date: string; updatedAt?: string; category: ResearchCategory; tags: string[]; summary: string; coverImage: string; wechatUrl: string; featured: boolean; readingTime: string; dataSources?: string[];
}
export interface ResearchArticle extends ResearchFrontmatter { slug: string; content: string }

const contentDirectory = path.join(process.cwd(), "content", "research");
const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === "string");

function parseFrontmatter(slug: string, source: string): ResearchArticle {
  const parsed = matter(source); const data = parsed.data as Record<string, unknown>;
  const required = ["title", "subtitle", "date", "category", "summary", "coverImage", "wechatUrl", "readingTime"] as const;
  for (const key of required) if (typeof data[key] !== "string") throw new Error(`${slug}: frontmatter field ${key} must be a string`);
  if (!researchCategories.includes(data.category as ResearchCategory)) throw new Error(`${slug}: invalid research category`);
  if (!isStringArray(data.tags)) throw new Error(`${slug}: tags must be a string array`);
  return { slug, content: parsed.content, title: data.title as string, subtitle: data.subtitle as string, date: data.date as string, updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : undefined, category: data.category as ResearchCategory, tags: data.tags, summary: data.summary as string, coverImage: data.coverImage as string, wechatUrl: data.wechatUrl as string, featured: data.featured === true, readingTime: data.readingTime as string, dataSources: isStringArray(data.dataSources) ? data.dataSources : [] };
}

export async function getAllResearch(): Promise<ResearchArticle[]> {
  try {
    const files = (await fs.readdir(contentDirectory)).filter((file) => file.endsWith(".mdx"));
    const articles = await Promise.all(files.map(async (file) => parseFrontmatter(file.replace(/\.mdx$/, ""), await fs.readFile(path.join(contentDirectory, file), "utf8"))));
    return articles.sort((a, b) => b.date.localeCompare(a.date));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export async function getResearchBySlug(slug: string) { return (await getAllResearch()).find((article) => article.slug === slug) ?? null; }
