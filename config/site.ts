export const siteConfig = {
  name: "Global Finance Intelligence",
  nameZh: "滔",
  description: "个人版全球市场研究终端：全球宏观、权益、FICC、大类资产与原创主题指数。",
  subtitle: "Global Macro · Equities · FICC · Thematic Indices",
  subtitleZh: "全球宏观｜权益研究｜FICC｜主题指数",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://taotalk.finance",
  github: "https://github.com/Hunter815-Li/hunterpower-index",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "libangtao0815@gmail.com",
  resumeUrl: process.env.NEXT_PUBLIC_RESUME_URL || "",
  wechatQrImage: process.env.NEXT_PUBLIC_WECHAT_QR || "/wechat-qr.jpg",
} as const;

export const navigation = [
  { href: "/", label: "首页", labelEn: "Home" },
  { href: "/markets", label: "市场终端", labelEn: "Markets" },
  { href: "/macro", label: "宏观", labelEn: "Macro" },
  { href: "/equities", label: "权益", labelEn: "Equities", pending: true },
  { href: "/ficc", label: "FICC", labelEn: "FICC", pending: true },
  { href: "/indices", label: "主题指数", labelEn: "Indices" },
  { href: "/research", label: "研究文章", labelEn: "Research" },
  { href: "/about", label: "关于我", labelEn: "About" },
] as const;
