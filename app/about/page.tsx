import type { Metadata } from "next";
import Image from "next/image";
import { siteConfig } from "@/config/site";
import { BilingualText } from "@/components/ui/BilingualText";

export const metadata: Metadata = {
  title: "关于我",
  description: "李邦滔 / Bangtao Li 的个人介绍。",
};

export default function AboutPage() {
  return (
    <main className="reading-page about-page">
      <section className="about-hero shell">
        <div>
          <span className="eyebrow dark">ABOUT THE RESEARCHER</span>
          <h1>
            李邦滔 <small>Bangtao Li</small>
          </h1>
          <p><BilingualText zh="约翰斯·霍普金斯大学金融经济学硕士。关注宏观环境、产业趋势与金融市场之间的联系，研究方向保持开放，并持续探索不同领域的长期变化与价值线索。" en="Master of Science in Financial Economics from Johns Hopkins University. I study the interaction between macro conditions, industry trends and financial markets, with an open and evolving research agenda focused on long-term change and value discovery." /></p>
          <div className="about-actions">
            <a href={siteConfig.github} target="_blank" rel="noopener noreferrer">
              GitHub ↗
            </a>
            <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
            {siteConfig.resumeUrl ? (
              <a href={siteConfig.resumeUrl} target="_blank" rel="noopener noreferrer">
                <BilingualText zh="下载简历" en="Resume" /> ↗
              </a>
            ) : (
              <span><BilingualText zh="简历 · 待配置" en="Resume · Not configured" /></span>
            )}
          </div>
        </div>
        <div className="about-portrait">
          <Image
            src="/bangtao-li.png"
            alt="李邦滔 / Bangtao Li"
            fill
            priority
            sizes="(max-width: 820px) 100vw, 300px"
          />
        </div>
      </section>
    </main>
  );
}
