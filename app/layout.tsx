import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { siteConfig } from "@/config/site";
import "./globals.css";

const preferenceScript = `(()=>{try{const r=document.documentElement;const l=localStorage.getItem("taotalk-language")==="en"?"en":"zh";const t=localStorage.getItem("taotalk-theme")==="dark"?"dark":"light";r.dataset.language=l;r.dataset.theme=t;r.lang=l==="en"?"en":"zh-CN"}catch{}})()`;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: `${siteConfig.name} / ${siteConfig.nameZh}`, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  keywords: ["Global Macro", "Equities", "FICC", "Thematic Indices", "全球宏观", "权益研究", "电力指数"],
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: { title: siteConfig.name, description: siteConfig.description, type: "website", locale: "zh_CN", siteName: siteConfig.name, images: [{ url: "/og.png", width: 1792, height: 921, alt: "Global Finance Intelligence / 滔" }] },
  twitter: { card: "summary_large_image", title: siteConfig.name, description: siteConfig.description, images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: preferenceScript }} /></head><body><a className="skip-link" href="#main-content"><span className="lang-zh">跳至正文</span><span className="lang-en">Skip to content</span></a><SiteHeader /><div id="main-content">{children}</div><SiteFooter /></body></html>;
}
