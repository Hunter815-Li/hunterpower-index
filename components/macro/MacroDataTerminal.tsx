"use client";

import { useEffect, useState } from "react";
import { MacroDashboardSection, type MacroMetricGroup } from "@/components/macro/MacroDashboardSection";
import { BilingualText } from "@/components/ui/BilingualText";
import { getEmptyMacroDashboard } from "@/lib/macro/series-config";
import type { MacroDashboardPayload } from "@/lib/macro/types";

interface MacroSummaryResponse {
  china: MacroDashboardPayload;
  us: MacroDashboardPayload;
  status: "fresh" | "unavailable";
  updatedAt: string | null;
}

const chinaGroups: readonly MacroMetricGroup[] = [
  { id: "cn-policy", titleZh: "政策", titleEn: "Policy", codes: ["CN_MLF_1Y", "CN_LPR_1Y", "CN_LPR_5Y"] },
  { id: "cn-rates", titleZh: "利率", titleEn: "Rates", codes: ["CN_DR007", "CN_GB_10Y", "CN_GB_30Y"] },
  { id: "cn-growth", titleZh: "增长", titleEn: "Growth", codes: ["CN_GDP", "CN_PMI_MFG", "CN_RETAIL"] },
  { id: "cn-inflation", titleZh: "通胀", titleEn: "Inflation", codes: ["CN_CPI", "CN_PPI"] },
  { id: "cn-liquidity", titleZh: "流动性与信用", titleEn: "Liquidity", codes: ["CN_M2", "CN_TSF_FLOW"] },
];

const usGroups: readonly MacroMetricGroup[] = [
  { id: "us-policy", titleZh: "政策", titleEn: "Policy", codes: ["US_FED_TARGET"] },
  { id: "us-rates", titleZh: "利率", titleEn: "Rates", codes: ["US_2Y", "US_10Y", "US_30Y"] },
  { id: "us-inflation", titleZh: "通胀", titleEn: "Inflation", codes: ["US_CPI_YY", "US_CORE_PCE"] },
  { id: "us-employment", titleZh: "就业", titleEn: "Employment", codes: ["US_NFP", "US_UNEMP"] },
  { id: "us-growth", titleZh: "增长", titleEn: "Growth", codes: ["US_GDP", "US_ISM_MFG"] },
  { id: "us-liquidity", titleZh: "流动性", titleEn: "Liquidity", codes: ["US_FED_ASSETS", "US_RRP", "US_TGA"] },
];

export function MacroDataTerminal() {
  const [china, setChina] = useState(() => getEmptyMacroDashboard("CN"));
  const [us, setUs] = useState(() => getEmptyMacroDashboard("US"));
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 90_000);
    fetch("/api/macro/featured", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Macro API returned ${response.status}`);
        return await response.json() as MacroSummaryResponse;
      })
      .then((payload) => {
        setChina(payload.china.data);
        setUs(payload.us.data);
        setUpdatedAt(payload.updatedAt);
        setState("ready");
      })
      .catch(() => setState("error"))
      .finally(() => window.clearTimeout(timer));
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, []);

  return (
    <>
      <div className={`macro-load-state macro-load-${state}`} role="status">
        {state === "loading" && <><i /><BilingualText zh="正在同步官方宏观数据…" en="Synchronizing official macro data…" /></>}
        {state === "error" && <BilingualText zh="官方数据请求失败；页面不会显示替代数字。" en="Official source request failed. No substitute values are shown." />}
        {state === "ready" && <><BilingualText zh="官方数据同步完成" en="OFFICIAL DATA SYNCED" /> · <BilingualText zh="更新" en="UPDATED" /> {updatedAt ?? "—"}</>}
      </div>
      <MacroDashboardSection index="02 / CHINA" title="中国" titleEn="China" metrics={china} groups={chinaGroups} />
      <MacroDashboardSection index="03 / UNITED STATES" title="美国" titleEn="United States" metrics={us} groups={usGroups} />
    </>
  );
}
