import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getAllResearch } from "@/lib/content/research";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> { const routes = ["", "/markets", "/indices", "/indices/hunter-power", "/research", "/research/wechat", "/about", "/methodology/hunter-power", "/disclaimer"]; const articles = (await getAllResearch()).map((item) => ({ url: `${siteConfig.url}/research/${item.slug}`, lastModified: item.updatedAt ?? item.date })); return [...routes.map((route) => ({ url: `${siteConfig.url}${route}`, lastModified: new Date(), changeFrequency: route === "/markets" ? "daily" as const : "weekly" as const, priority: route === "" ? 1 : 0.8 })), ...articles]; }
