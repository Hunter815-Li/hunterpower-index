import Image from "next/image";
import { BilingualText } from "@/components/ui/BilingualText";
import snapshot from "@/public/data/kzg-option-daily.json";

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export function KzgOptionsSnapshot() {
  return (
    <section className="terminal-panel kzg-options-panel" aria-labelledby="kzg-options-title">
      <div className="terminal-panel-head kzg-options-head">
        <div>
          <span className="eyebrow">US OPTIONS FLOW · DAILY SNAPSHOT</span>
          <h2 id="kzg-options-title">
            <BilingualText zh="美股期权分钟数据" en="US Options Minute Monitor" />
          </h2>
        </div>
        <div className="kzg-options-status">
          <b><BilingualText zh="每日快照" en="Daily Snapshot" /></b>
          <span>{snapshot.dataDate}</span>
        </div>
      </div>

      <div className="kzg-options-body">
        <figure>
          <a
            className="kzg-report-crop"
            href={snapshot.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open KZG Option House source website"
          >
            <Image
              src={snapshot.imagePath}
              width={761}
              height={2334}
              sizes="(max-width: 820px) calc(100vw - 56px), 860px"
              alt={`KZG Option House 美股期权分钟数据，数据日期 ${snapshot.dataDate}`}
              priority={false}
            />
          </a>
          <figcaption>
            <span>
              <BilingualText
                zh={`数据日期 ${snapshot.dataDate} · 抓取于北京时间 ${formatTimestamp(snapshot.capturedAt)}`}
                en={`Data date ${snapshot.dataDate} · Captured ${formatTimestamp(snapshot.capturedAt)} China time`}
              />
            </span>
            <a href={snapshot.sourceUrl} target="_blank" rel="noopener noreferrer">
              <BilingualText zh="查看原站" en="View Source" /> ↗
            </a>
          </figcaption>
        </figure>

        <aside>
          <span>ABOUT THE DATA</span>
          <h3><BilingualText zh="成交量与 CPE 观察" en="Volume & CPE Monitor" /></h3>
          <p>
            <BilingualText
              zh="展示 SPY、QQQ、IWM 期权成交概览、全市场日内分布与活跃标的热力表。截图保留原始排版，避免二次识别造成数字误差。"
              en="A source-preserving view of index option volume, intraday market distribution and the most active symbols, without OCR-induced number errors."
            />
          </p>
          <dl>
            <div><dt>Source</dt><dd>{snapshot.sourceName}</dd></div>
            <div><dt>Frequency</dt><dd>Daily · 00:10 CST</dd></div>
            <div><dt>Status</dt><dd>{snapshot.status === "success" ? "Available" : "Stale"}</dd></div>
          </dl>
          <small>
            <BilingualText
              zh="若自动抓取失败，网站保留上一张有效截图并显示旧的数据日期，不生成替代数据。"
              en="If capture fails, the last valid image remains with its original data date; no replacement data is generated."
            />
          </small>
        </aside>
      </div>
    </section>
  );
}
