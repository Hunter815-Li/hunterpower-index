import type { ResearchCategory } from "@/lib/content/research";

export interface WechatArticle {
  title: string;
  publishedAt: string;
  category: ResearchCategory;
  summary: string;
  coverImage: string;
  originalUrl: string;
  localSlug?: string;
}

/**
 * 仅填写读者可以直接打开的微信文章公开链接：
 * https://mp.weixin.qq.com/s/...
 *
 * 不要填写带 token 的公众号后台管理地址。
 * 如需在站内同时发布全文，再填写对应的 localSlug。
 */
export const wechatArticles: WechatArticle[] = [
  {
    title: "从GPU瓶颈到电力瓶颈：800V直流母线如何重塑AI基础设施",
    publishedAt: "2026-07-18",
    category: "AI Infrastructure",
    summary: "讨论AI数据中心的电力瓶颈，以及800V直流架构在效率、铜耗、保护与可靠性方面的系统价值。",
    coverImage: "https://mmbiz.qpic.cn/mmbiz_jpg/eCicTFQ937puZMWiaRpkibDlQhDz4F2JwVLZqym6Q5Sj1khThEw7MXPPe8ErS6VdenqXgzfyc4gg0l1HibtQ55GUZe0AvzgMgdD051yuKRte5hM/0?wx_fmt=jpeg",
    originalUrl: "https://mp.weixin.qq.com/s/wIZVZUezObPVY3svgvMCtQ",
  },
  {
    title: "AI电力约束的中美路径、核心公司与2026–2030行业展望",
    publishedAt: "2026-06-23",
    category: "AI Infrastructure",
    summary: "比较中美AI基础设施的电力约束、关键设备与产业链路径，并展望2026至2030年的供需演变。",
    coverImage: "https://mmbiz.qpic.cn/sz_mmbiz_jpg/eCicTFQ937pv2UccaG229NMJmWZbibRxW8PkVibxmgj1PicomthyhGWSspBFYVpZzC5gBKiboU1lBdHLwTLhE4oibZUcmaYXK1lyiaZXa54MIXeQOI/0?wx_fmt=jpeg",
    originalUrl: "https://mp.weixin.qq.com/s/tIHxGjSqYJRZyaFg5txDxQ",
  },
  {
    title: "VCP波动收缩模型：我的交易启蒙与实战心得",
    publishedAt: "2026-05-28",
    category: "Equities",
    summary: "介绍VCP波动收缩模型的供需逻辑、形态识别方法，以及右侧交易中的实际应用。",
    coverImage: "https://mmbiz.qpic.cn/sz_mmbiz_jpg/eCicTFQ937pte6qR0RzRAib96ZsHH0mjtc1GG0uveerb6ADApUeqznI9DtngGbRFwu9ASbMxWyGy2VPmu2ia9hasQU44E9rNh7yWygla6kQicC8/0?wx_fmt=jpeg",
    originalUrl: "https://mp.weixin.qq.com/s/0jiUeJZZ27AVqCewtloijQ",
  },
  {
    title: "仓位管理的离散推导：从凯利公式到空仓定理",
    publishedAt: "2026-05-06",
    category: "Cross Asset",
    summary: "从凯利公式出发推导仓位管理框架，讨论最优仓位、空仓条件与风险约束。",
    coverImage: "https://mmbiz.qpic.cn/mmbiz_jpg/eCicTFQ937pvIcxxIPock5jEnffumuPgYiabnEFomJD0KKuJhfy9GxVn53VSF6MPrfF4GhYUpqgfWtjcFrOjEpf5FItJGoS3KYvjWibZLSZmkw/0?wx_fmt=jpeg",
    originalUrl: "https://mp.weixin.qq.com/s/xcN2Ugif3xx7bNSFLIAtuA",
  },
  {
    title: "从10年-2年美债利差看，美股为何仍处在高风险窗口",
    publishedAt: "2026-03-31",
    category: "FICC",
    summary: "结合10年与2年期美债利差、市场结构和宏观环境，讨论美股风险窗口与入场条件。",
    coverImage: "https://mmbiz.qpic.cn/mmbiz_jpg/eCicTFQ937ptZUVt3UVCdSj1YEgibdZbXQowzZ1ZR7CQbuGChl7pzLTzjMI9xg62je76SJxIBXDluicPkYE4yOhDZZEGibhcTMAqmn35szCRYiao/0?wx_fmt=jpeg",
    originalUrl: "https://mp.weixin.qq.com/s/aTZ5tMsxp64-4BIew4j34Q",
  },
  {
    title: "当黄金变成‘流动性祭品’：滞胀冲击下的交易逻辑重构与油价背离分析",
    publishedAt: "2026-03-23",
    category: "Cross Asset",
    summary: "分析滞胀与流动性冲击下黄金和原油的价格背离，以及避险资产定价逻辑的变化。",
    coverImage: "https://mmbiz.qpic.cn/mmbiz_jpg/eCicTFQ937psia8KtZVI0EIYcgkIpLrTf4ZQDSIpPcBhHA4cIZQcs5TicrKsn7fbiaVaGg6b7dKfxPykuhgjuB5FSqw7Meiaw2iaStQzicwR014tao/0?wx_fmt=jpeg",
    originalUrl: "https://mp.weixin.qq.com/s/hFOCSLL28ru3sf0VaXcQBA",
  },
  {
    title: "同构的博弈：为什么感情的底层逻辑，就是一场生命资产的价值投资？",
    publishedAt: "2026-01-31",
    category: "Cross Asset",
    summary: "借用价值投资、仓位管理与止损框架，讨论关系中的资源配置、风险与长期价值。",
    coverImage: "https://mmbiz.qpic.cn/sz_mmbiz_jpg/JurNUFvcKianseZEXElL3icnLHXKOPozRljtWPsRUZibH691Uib0ibqDyVuNf42KqXkyIl5DAVbRsicOXdxeVcKGOUZg/0?wx_fmt=jpeg",
    originalUrl: "https://mp.weixin.qq.com/s/ZLdYfrnZPgpUWUKms63TTg",
  },
  {
    title: "供需筑底、服务消费接力：国内三大航司的中长期修复逻辑",
    publishedAt: "2026-01-05",
    category: "Equities",
    summary: "从票价、供给约束、客座率和服务消费修复等角度，梳理国内三大航司的中长期逻辑。",
    coverImage: "https://mmbiz.qpic.cn/sz_mmbiz_jpg/JurNUFvcKiakMA4dTIETibUmvcOuFSiaKhib4kCDSjJiaGEAiaDw6h1AiazSXdT6851LgpVgiabVTEMH4F9Q9uiaHEgRe5Q/0?wx_fmt=jpeg",
    originalUrl: "https://mp.weixin.qq.com/s/7SAJ5GrV4xqq9_y9J2jWrw",
  },
  {
    title: "AI泡沫？不如说是新生产力周期的序章",
    publishedAt: "2025-11-10",
    category: "AI Infrastructure",
    summary: "从生产率与企业盈利兑现角度讨论AI周期所处阶段，以及技术扩散对资本市场的长期影响。",
    coverImage: "https://mmbiz.qpic.cn/sz_mmbiz_jpg/JurNUFvcKialBsT2L2vhq9AtLCFrQCs8rTvwLOutH7mMqTdmZr5nnHRgSjjBqr4eGwuRYpd4lVOh7TEDwCmicMlQ/0?wx_fmt=jpeg",
    originalUrl: "https://mp.weixin.qq.com/s/IzUsS2V0sNIpVuqAYhiL7g",
  },
];
