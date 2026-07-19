import { HunterDashboard } from "@/components/HunterDashboard";
import { getMarketSnapshot } from "@/lib/marketData";
import Link from "next/link";

export const revalidate = 86_400;

async function loadHomeData() {
  try {
    return { data: await getMarketSnapshot(), error: "" };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : "行情加载失败" };
  }
}

export default async function Home() {
  const result = await loadHomeData();
  if (result.data) return <HunterDashboard data={result.data} />;
  return <main className="error-page"><div className="error-panel"><div className="error-mark">!</div><span className="section-kicker">MARKET DATA UNAVAILABLE</span><h1>日线行情暂时无法加载</h1><p>{result.error}</p><Link className="retry-link" href="/">重新加载</Link><small>请确认 Vercel 环境变量中已配置 MARKETDATA_TOKEN，并已重新部署。</small></div></main>;
}
