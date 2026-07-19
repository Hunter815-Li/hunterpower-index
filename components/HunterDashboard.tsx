"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IndexSummary } from "@/components/IndexSummary";
import { IndexChart } from "@/components/IndexChart";
import { ConstituentTable } from "@/components/ConstituentTable";
import { SectorAnalysis } from "@/components/SectorAnalysis";
import { ContributionRankings } from "@/components/ContributionRankings";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import type { MarketSnapshot, RealtimeMarketUpdate } from "@/lib/marketData";

function replaceLatestByDate<T extends { date: string }>(series: T[], point: T) {
  const index = series.findIndex((item) => item.date === point.date);
  if (index < 0) return [...series, point];
  return series.map((item, itemIndex) => itemIndex === index ? point : item);
}

/** The browser only merges server-computed values; it never calculates the index. */
function applyRealtimeUpdate(snapshot: MarketSnapshot, update: RealtimeMarketUpdate): MarketSnapshot {
  const constituentUpdates = new Map(update.constituents.map((item) => [item.ticker, item]));
  return {
    ...snapshot,
    provider: update.provider,
    providerLabel: update.providerLabel,
    sourceLabel: update.sourceLabel,
    marketSession: update.marketSession,
    transport: update.transport,
    updatedAt: update.updatedAt,
    latestValue: update.latestValue,
    dailyChange: update.dailyChange,
    dailyChangePercent: update.dailyChangePercent,
    indexSeries: replaceLatestByDate(snapshot.indexSeries, update.latestIndexPoint),
    comparisonSeries: replaceLatestByDate(snapshot.comparisonSeries, update.latestComparisonPoint),
    constituents: snapshot.constituents.map((item) => ({ ...item, ...constituentUpdates.get(item.ticker) })),
    sectors: update.sectors,
  };
}

export function HunterDashboard() {
  const [data, setData] = useState<MarketSnapshot | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [streamNotice, setStreamNotice] = useState("");
  const hasData = useRef(false);

  const loadData = useCallback(async (background = false) => {
    if (!background) { setLoading(true); setError(""); }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch("/api/market-data", { cache: "no-store", signal: controller.signal });
      const payload = await response.json() as MarketSnapshot | { message?: string };
      if (!response.ok) throw new Error("message" in payload ? payload.message : "行情接口暂时不可用");
      setData(payload as MarketSnapshot);
      hasData.current = true;
      setError("");
    } catch (reason) {
      const message = reason instanceof Error && reason.name === "AbortError"
        ? "行情请求超时，请检查网络后重试"
        : reason instanceof Error ? reason.message : "行情加载失败";
      if (!background || !hasData.current) setError(message);
      else setStreamNotice(`后台刷新失败：${message}`);
    } finally {
      clearTimeout(timeout);
      if (!background) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = setTimeout(() => void loadData(), 0);
    const interval = setInterval(() => void loadData(true), 30_000);
    return () => { clearTimeout(initialLoad); clearInterval(interval); };
  }, [loadData]);

  const marketSession = data?.marketSession;
  const streamAvailable = data?.streamAvailable;
  const provider = data?.provider;
  const providerLabel = data?.providerLabel;
  useEffect(() => {
    if (marketSession !== "open" || !streamAvailable || provider === "simulation") return;
    const source = new EventSource("/api/market-data/stream");
    source.addEventListener("connected", () => setStreamNotice(""));
    source.addEventListener("market-update", (event) => {
      try {
        const update = JSON.parse((event as MessageEvent<string>).data) as RealtimeMarketUpdate;
        setData((current) => current ? applyRealtimeUpdate(current, update) : current);
        setStreamNotice("");
      } catch { setStreamNotice("实时行情消息解析失败，REST 刷新仍在运行"); }
    });
    source.addEventListener("market-closed", () => {
      source.close();
      setData((current) => current ? { ...current, marketSession: "closed", transport: "rest", streamAvailable: false, sourceLabel: `${current.providerLabel} · REST 行情` } : current);
      void loadData(true);
    });
    source.addEventListener("upstream-error", (event) => {
      try { setStreamNotice((JSON.parse((event as MessageEvent<string>).data) as { message?: string }).message ?? "实时通道暂时不可用"); }
      catch { setStreamNotice("实时通道暂时不可用，REST 刷新仍在运行"); }
    });
    source.onerror = () => setStreamNotice("实时通道正在重连；页面仍会每30秒通过 REST 更新");
    return () => source.close();
  }, [marketSession, streamAvailable, provider, providerLabel, loadData]);

  if (loading) return <DashboardSkeleton />;
  if (error || !data) return <main className="error-page"><div className="error-panel"><div className="error-mark">!</div><span className="section-kicker">MARKET DATA UNAVAILABLE</span><h1>行情暂时无法加载</h1><p>{error || "服务返回了未知错误"}</p><button onClick={() => void loadData()}>重新加载</button><small>请确认 Vercel 环境变量中已配置 FINNHUB_API_KEY。</small></div></main>;

  const notices = [...data.warnings, ...(streamNotice ? [streamNotice] : [])];
  return <>
    <header className="topbar">
      <a className="brand" href="#top" aria-label="Hunter电力指数首页"><span className="brand-mark">HPI</span><span><strong>Hunter电力指数</strong><small>Hunter Power Index</small></span></a>
      <nav aria-label="页面导航"><a href="#trend">指数走势</a><a href="#constituents">成分股</a><a href="#sectors">行业分析</a><a href="#methodology">编制说明</a></nav>
      <div className="market-status"><span className="live-dot" /> US MARKET <b>{data.marketSession === "open" ? "OPEN" : "CLOSED"}</b></div>
    </header>
    <main className="site-shell" id="top">
      <section className="page-intro"><div><span className="section-kicker">HUNTER RESEARCH · INDEX PRODUCTS</span><h1>Hunter电力指数 <small>Hunter Power Index</small></h1><p>Powering the Next Generation of Infrastructure</p></div><div className="source-badge"><span>{data.sourceLabel}</span><small>更新 {data.updatedAt} · 30秒自动刷新</small></div></section>
      {notices.length > 0 && <details className="data-notice"><summary>数据说明 · {notices.length} 项</summary><ul>{notices.map((warning) => <li key={warning}>{warning}</li>)}</ul></details>}
      <IndexSummary data={data} />
      <IndexChart data={data.comparisonSeries} />
      <ConstituentTable rows={data.constituents} />
      <div className="analysis-grid"><SectorAnalysis sectors={data.sectors} /><ContributionRankings rows={data.constituents} /></div>
      <section className="methodology panel" id="methodology">
        <div className="methodology-number">01</div><div><span className="section-kicker">INDEX METHODOLOGY</span><h2>指数编制说明</h2>
        <p>Hunter电力指数由美国电力设备、电网建设、公用事业、核能、储能、数据中心电力基础设施等相关上市公司构成。</p>
        <p>指数采用等权算术平均方法，将各成分股在基准日的复权价格标准化为100，再计算每日平均值，以反映美国电力基础设施产业链的整体市场表现。所有计算均在服务器完成。</p>
        <div className="formula"><span>HPI<sub>t</sub></span><b>=</b><span>1 / N</span><b>×</b><span>Σ ( P<sub>i,t</sub> / P<sub>i,0</sub> × 100 )</span></div>
        <p className="disclaimer">本指数仅用于研究和信息展示，不构成任何投资建议。实时行情的可用性及延迟取决于所配置供应商和订阅套餐。</p></div>
      </section>
    </main>
    <footer><span>HPI / HUNTER POWER INDEX</span><span>MIT Open Source · <a href="https://github.com/Hunter815-Li/hunterpower-index" target="_blank" rel="noreferrer">GitHub 源码</a></span><span>© {new Date().getFullYear()} Hunter Research · Research use only</span></footer>
  </>;
}
