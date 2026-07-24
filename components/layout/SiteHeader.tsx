"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigation } from "@/config/site";
import { DisplayPreferences } from "@/components/layout/DisplayPreferences";

export function SiteHeader() {
  const pathname = usePathname() ?? "/";

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="site-brand" href="/" aria-label="Global Finance Intelligence 首页 / Home">
          <span className="brand-seal">滔</span>
          <span>
            <b>Global Finance Intelligence</b>
            <small>DESIGNED BY 李邦滔</small>
          </span>
        </Link>
        <nav className="main-nav" aria-label="主导航 / Main navigation">
          {navigation.map((item) => (
            <Link
              key={item.href}
              className={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)) ? "active" : ""}
              href={item.href}
            >
              <span><span className="lang-zh">{item.label}</span><span className="lang-en">{item.labelEn}</span></span>
              <small><span className="lang-zh">{item.labelEn}</span><span className="lang-en">{item.label}</span></small>
            </Link>
          ))}
        </nav>
        <Link className="header-research" href="/research/wechat">
          <span className="lang-zh">公众号</span><span className="lang-en">WeChat</span>
        </Link>
        <DisplayPreferences />
      </div>
    </header>
  );
}
