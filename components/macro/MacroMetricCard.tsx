import { BilingualText } from "@/components/ui/BilingualText";
import type { MacroMetricSnapshot } from "@/lib/macro/types";
import { MacroStatusBadge } from "@/components/macro/MacroStatusBadge";

function formatValue(value: number | null, unit: string) {
  if (value === null) return "—";
  const formatted = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
  if (unit === "index") return formatted;
  return `${formatted}${unit === "%" ? "%" : ` ${unit}`}`;
}

const arrows = { up: "↑", down: "↓", flat: "→", unknown: "·" } as const;

export function MacroMetricCard({ metric }: { metric: MacroMetricSnapshot }) {
  const unavailable = metric.value === null;
  const change = metric.change === null ? "—" : `${metric.change > 0 ? "+" : ""}${formatValue(metric.change, metric.unit)}`;
  return (
    <article className="macro-metric-card">
      <header>
        <div><b><BilingualText zh={metric.nameZh} en={metric.name} /></b><span>{metric.code}</span></div>
        <MacroStatusBadge status={metric.status} />
      </header>
      <div className="macro-value-row">
        <strong className={unavailable ? "macro-value-na" : ""}>{formatValue(metric.value, metric.unit)}</strong>
        <span className={`macro-direction macro-direction-${metric.direction}`}>{arrows[metric.direction]}</span>
      </div>
      {unavailable ? (
        <p className="macro-data-message"><BilingualText zh="等待真实数据更新" en="Data unavailable" /></p>
      ) : (
        <p className="macro-change"><BilingualText zh="较前值" en="VS PREVIOUS" /> {formatValue(metric.previous, metric.unit)} · {change}</p>
      )}
      <footer>
        <a href={metric.sourceUrl} target="_blank" rel="noopener noreferrer">{metric.source} ↗</a>
        <time><BilingualText zh="发布" en="PUBLISHED" /> {metric.publishedAt ?? "—"}</time>
        <time><BilingualText zh="更新" en="UPDATED" /> {metric.updatedAt ?? "—"}</time>
      </footer>
    </article>
  );
}
