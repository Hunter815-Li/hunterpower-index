export const siteConfig = {
  name: "Global Finance Intelligence",
  nameZh: "滔",
  description: "个人版全球市场研究终端：全球宏观、跨资产市场、期权观察与原创主题指数。",
  subtitle: "Global Macro · Cross Asset · Options · Thematic Indices",
  subtitleZh: "全球宏观｜跨资产市场｜期权观察｜主题指数",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://taotalk.finance",
  github: "https://github.com/Hunter815-Li/hunterpower-index",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "libangtao0815@gmail.com",
  wechatQrImage: process.env.NEXT_PUBLIC_WECHAT_QR || "/wechat-qr.jpg",
} as const;

export const navigation = [
  { href: "/", label: "首页", labelEn: "Home" },
  { href: "/markets", label: "市场终端", labelEn: "Markets" },
  { href: "/macro", label: "宏观", labelEn: "Macro" },
  { href: "/options", label: "期权", labelEn: "Options" },
  { href: "/indices", label: "主题指数", labelEn: "Indices" },
  { href: "/research", label: "研究文章", labelEn: "Research" },
  { href: "/about", label: "关于我", labelEn: "About" },
] as const;
