import type { MarketBoardQuote } from "@/lib/market-data/market-board";

const statusLabel = (status: MarketBoardQuote["marketStatus"]) => ({ delayed: "T+1 EOD", unavailable: "DATA UNAVAILABLE" })[status];

export function MarketBoard({ data, compact = false }: { data: MarketBoardQuote[]; compact?: boolean }) {
  return <div className={`market-board ${compact ? "compact" : ""}`}><div className="market-board-head"><span>GLOBAL MARKETS</span><small>SERVER-SIDE DATA · {data.some((item) => item.marketStatus !== "unavailable") ? "UPDATED" : "NO CONNECTION"}</small></div><div className="quote-grid">
    {data.map((item) => <article className="quote-card" key={item.key}><div><b>{item.name}</b><small>{item.symbol}</small></div>{item.price === null ? <strong className="quote-na">—</strong> : <strong>{item.price.toLocaleString("en-US", { minimumFractionDigits: item.decimals, maximumFractionDigits: item.decimals })}</strong>}<div className="quote-foot"><span className={item.changePercent === null ? "muted" : item.changePercent >= 0 ? "positive" : "negative"}>{item.changeLabel ?? "Data unavailable"}</span><small className={`market-tag ${item.marketStatus}`}>{statusLabel(item.marketStatus)}</small></div><time>{item.updatedAt ? new Date(item.updatedAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false }) : "更新时间不可用"}</time><small className="quote-source">{item.source ?? item.error ?? "Source unavailable"}</small></article>)}
  </div><p className="market-source">真实数据源：Market Data · FRED。BTC 为 Coinbase Bitcoin via FRED；统一按已完成交易日更新。</p></div>;
}
