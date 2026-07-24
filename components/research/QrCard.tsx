import Image from "next/image";
import { siteConfig } from "@/config/site";
import { BilingualText } from "@/components/ui/BilingualText";

export function QrCard({ compact = false }: { compact?: boolean }) {
  return <div className={`qr-card ${compact ? "compact" : ""}`}>
    {siteConfig.wechatQrImage ? <span className="qr-image-crop"><Image src={siteConfig.wechatQrImage} alt="滔说 Finance 微信公众号二维码" width={1059} height={1124} unoptimized /></span> : <div className="qr-placeholder" aria-label="微信公众号二维码待配置"><span>QR</span><small>待配置</small></div>}
    <div><b>滔说 Finance</b><span><BilingualText zh="微信公众号" en="Official WeChat" /></span><em><BilingualText zh="洞察趋势｜发现价值" en="Insight · Value" /></em></div>
  </div>;
}
