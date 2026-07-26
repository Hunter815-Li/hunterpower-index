import { BilingualText } from "@/components/ui/BilingualText";
import { MacroMetricCard } from "@/components/macro/MacroMetricCard";
import type { MacroMetricSnapshot } from "@/lib/macro/types";

export interface MacroMetricGroup {
  id: string;
  titleZh: string;
  titleEn: string;
  codes: readonly string[];
}

export function MacroDashboardSection({
  country,
  index,
  title,
  titleEn,
  metrics,
  groups,
}: {
  country: "CN" | "US";
  index: string;
  title: string;
  titleEn: string;
  metrics: MacroMetricSnapshot[];
  groups: readonly MacroMetricGroup[];
}) {
  const byCode = new Map(metrics.map((metric) => [metric.code, metric]));

  return (
    <section className="macro-block">
      <div className="macro-section-heading macro-country-heading">
        <div className="macro-country-title">
          <span
            aria-label={`${titleEn} flag`}
            className={`macro-country-flag macro-country-flag-${country.toLowerCase()}`}
            role="img"
          >
            {country === "CN" ? <i>★</i> : <i aria-hidden="true">•••<br />•••</i>}
          </span>
          <div className="macro-country-copy">
            <span className="section-kicker">{index}</span>
            <h2><BilingualText zh={title} en={titleEn} /></h2>
          </div>
        </div>
        <p><BilingualText zh="只保留对增长、通胀、利率与流动性判断最重要的官方指标。" en="A focused set of official indicators with direct relevance to growth, inflation, rates and liquidity." /></p>
      </div>
      {groups.map((group) => {
        const items = group.codes.flatMap((code) => {
          const metric = byCode.get(code);
          return metric ? [metric] : [];
        });
        if (items.length === 0) return null;
        return (
          <div className="macro-category" key={group.id}>
            <h3><BilingualText zh={group.titleZh} en={group.titleEn} /></h3>
            <div className="macro-card-grid">{items.map((metric) => <MacroMetricCard key={metric.code} metric={metric} />)}</div>
          </div>
        );
      })}
    </section>
  );
}
