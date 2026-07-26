import type { Metadata } from "next";
import { KzgOptionsSnapshot } from "@/components/market/KzgOptionsSnapshot";
import { BilingualText } from "@/components/ui/BilingualText";

export const metadata: Metadata = {
  title: "期权市场",
  description: "美股期权成交量、CPE 与日内活跃度每日快照。",
};

export default function OptionsPage() {
  return (
    <main className="options-page terminal-section">
      <section className="shell terminal-hero options-hero">
        <span className="eyebrow">OPTIONS MARKET INTELLIGENCE</span>
        <h1><BilingualText zh="期权市场" en="Options" /></h1>
        <p>
          <BilingualText
            zh="观察成交量、Put/Call 结构与日内活跃度。保留原始数据版式，每日更新，不生成替代数据。"
            en="Daily monitoring of option volume, put/call structure and intraday activity, preserved in its original source format without synthetic replacements."
          />
        </p>
        <div className="terminal-clock">
          DAILY SNAPSHOT <b>00:10 CST</b><span>KZG OPTION HOUSE</span>
        </div>
      </section>

      <div className="shell options-stack">
        <section className="options-intro" aria-label="Options research framework">
          <div>
            <span>01 / VOLUME</span>
            <b><BilingualText zh="成交活跃度" en="Trading Activity" /></b>
            <p><BilingualText zh="追踪主要指数与活跃标的期权成交。" en="Track option volume across major indices and active symbols." /></p>
          </div>
          <div>
            <span>02 / POSITIONING</span>
            <b><BilingualText zh="Put / Call 结构" en="Put / Call Structure" /></b>
            <p><BilingualText zh="使用 CPE 观察市场保护与风险偏好。" en="Use CPE as a lens on hedging demand and risk appetite." /></p>
          </div>
          <div>
            <span>03 / INTRADAY</span>
            <b><BilingualText zh="日内分布" en="Intraday Distribution" /></b>
            <p><BilingualText zh="识别成交量在交易时段内的集中变化。" en="Identify how trading activity is distributed through the session." /></p>
          </div>
        </section>

        <KzgOptionsSnapshot />
      </div>
    </main>
  );
}
