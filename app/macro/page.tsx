import type { Metadata } from "next";
import { BilingualText } from "@/components/ui/BilingualText";
import { MacroRegime } from "@/components/macro/MacroRegime";
import { MacroDataTerminal } from "@/components/macro/MacroDataTerminal";
import { MacroCalendar } from "@/components/macro/MacroCalendar";
import { MacroGlobalMarkets } from "@/components/macro/MacroGlobalMarkets";

export const metadata: Metadata = {
  title: "中美宏观数据终端 | Global Finance Intelligence",
  description: "聚焦中国、美国与全球市场最具投资意义的宏观数据终端。",
};

export default function MacroPage() {
  return (
    <main className="terminal-section macro-page">
      <header className="macro-masthead">
        <div className="shell">
          <span className="eyebrow">CHINA · UNITED STATES · GLOBAL MARKETS</span>
          <h1><BilingualText zh="全球宏观数据终端" en="Global Macro Terminal" /></h1>
          <p><BilingualText zh="以少而精的中美宏观与跨资产指标，追踪增长、通胀、利率和流动性的投资含义。" en="A focused set of China, U.S. and cross-asset indicators for interpreting growth, inflation, rates and liquidity." /></p>
          <div className="macro-masthead-meta">
            <span>DATA POLICY / NO SYNTHETIC VALUES</span>
            <span><BilingualText zh="全局更新时间" en="LAST UPDATED" /> —</span>
          </div>
        </div>
      </header>
      <div className="shell macro-stack">
        <MacroRegime />
        <MacroDataTerminal />
        <MacroGlobalMarkets />
        <MacroCalendar events={[]} />
      </div>
    </main>
  );
}
