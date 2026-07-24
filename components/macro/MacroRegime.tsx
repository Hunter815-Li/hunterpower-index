import { macroRegime } from "@/app/config/macro-regime";
import { BilingualText } from "@/components/ui/BilingualText";

const arrows = { up: "↑", down: "↓", flat: "→" } as const;

export function MacroRegime() {
  return (
    <section className="macro-block" aria-labelledby="macro-regime-title">
      <div className="macro-section-heading">
        <div>
          <span className="section-kicker">01 / CURRENT REGIME</span>
          <h2 id="macro-regime-title"><BilingualText zh="当前宏观状态" en="Current Regime" /></h2>
        </div>
        <div className="macro-provenance">
          <span><i className="manual-dot" /> <BilingualText zh="观点：人工维护" en="Views: manually maintained" /></span>
          <span><i className="auto-dot" /> <BilingualText zh="指标：自动更新" en="Data: automatically updated" /></span>
        </div>
      </div>
      <div className="macro-regime-cards">
        {macroRegime.map((item) => (
          <article key={item.id}>
            <header>
              <span>{item.name}</span>
              <b aria-label={item.direction ?? "unrated"}>{item.direction ? arrows[item.direction] : "·"}</b>
            </header>
            <h3><BilingualText zh={item.nameZh} en={item.name} /></h3>
            <div className="macro-regime-score">
              <strong>{item.score ?? "—"}</strong><span>/ 5</span>
            </div>
            <p><BilingualText zh={item.commentZh} en={item.comment} /></p>
            <footer><BilingualText zh="观点更新" en="VIEW UPDATED" /> · {item.updatedAt ?? "—"}</footer>
          </article>
        ))}
      </div>
    </section>
  );
}
