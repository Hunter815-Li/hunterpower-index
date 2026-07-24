"use client";

import { useEffect, useMemo, useState } from "react";
import { BilingualText } from "@/components/ui/BilingualText";
import type { MarketBoardQuote } from "@/lib/market-data/market-board";

interface MarketView {
  key: "dxy" | "gold" | "wti" | "btc" | "vix" | "move";
  nameZh: string;
  nameEn: string;
  noteZh: string;
  noteEn: string;
}

const marketViews: readonly MarketView[] = [
  { key: "dxy", nameZh: "美元指数", nameEn: "DXY", noteZh: "免费数据口径：美元广义指数代理", noteEn: "Free-data proxy: Broad U.S. Dollar Index" },
  { key: "gold", nameZh: "黄金", nameEn: "Gold", noteZh: "免费数据口径：GLD ETF", noteEn: "Free-data proxy: GLD ETF" },
  { key: "wti", nameZh: "WTI原油", nameEn: "WTI Oil", noteZh: "现货日线", noteEn: "Daily spot series" },
  { key: "btc", nameZh: "比特币", nameEn: "Bitcoin", noteZh: "Coinbase BTC/USD", noteEn: "Coinbase BTC/USD" },
  { key: "vix", nameZh: "VIX波动率", nameEn: "VIX", noteZh: "CBOE收盘指数", noteEn: "CBOE closing index" },
  { key: "move", nameZh: "MOVE指数", nameEn: "MOVE Index", noteZh: "延迟收盘数据", noteEn: "Delayed closing data" },
];

export function MacroGlobalMarkets() {
  const [quotes, setQuotes] = useState<MarketBoardQuote[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/markets", { signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error("Market quotes unavailable");
      return await response.json() as { data: MarketBoardQuote[]; updatedAt: string };
    }).then((quotePayload) => {
      setQuotes(quotePayload.data);
      setUpdatedAt(quotePayload.updatedAt);
      setState("ready");
    }).catch(() => setState("error"));
    return () => controller.abort();
  }, []);

  const cards = useMemo(() => marketViews.map((view) => {
    const quote = quotes.find((item) => item.key === view.key);
    return { view, quote };
  }), [quotes]);

  return (
    <section className="macro-block">
      <div className="macro-section-heading">
        <div><span className="section-kicker">04 / GLOBAL MARKETS</span><h2><BilingualText zh="全球市场定价" en="Global Markets" /></h2></div>
        <p><BilingualText zh="用于交叉验证美元、商品、加密资产与波动率所反映的宏观定价。" en="Cross-asset pricing signals for the dollar, commodities, crypto and volatility." /></p>
      </div>
      {state === "loading" && <div className="macro-calendar-loading"><BilingualText zh="正在同步市场数据…" en="SYNCING MARKET DATA…" /></div>}
      {state === "error" && <div className="macro-calendar-loading macro-calendar-error"><BilingualText zh="市场数据暂不可用" en="Market data unavailable" /></div>}
      <div className="macro-market-grid">
        {cards.map(({ view, quote }) => {
          const available = quote?.price !== null && quote?.price !== undefined;
          return (
            <article className="macro-market-card" key={view.key}>
              <header><div><b><BilingualText zh={view.nameZh} en={view.nameEn} /></b><span>{quote?.symbol ?? view.key.toUpperCase()}</span></div><small>{quote?.marketStatus === "delayed" || quote?.provider === "manual" ? "DELAYED" : "UNAVAILABLE"}</small></header>
              <strong>{available ? quote.price!.toLocaleString("en-US", { maximumFractionDigits: quote.decimals }) : "—"}</strong>
              <p className={quote?.changePercent === null || quote?.changePercent === undefined ? "muted" : quote.changePercent >= 0 ? "positive" : "negative"}>{quote?.changeLabel ?? "Data unavailable"}</p>
              <div className="macro-market-note"><BilingualText zh={view.noteZh} en={view.noteEn} /></div>
              <footer><span>{quote?.source ?? "Source unavailable"}</span><time>{quote?.updatedAt ?? "—"}</time></footer>
            </article>
          );
        })}
      </div>
      <p className="macro-market-updated"><BilingualText zh="终端检查时间" en="TERMINAL CHECKED" /> · {updatedAt ?? "—"}</p>
    </section>
  );
}
