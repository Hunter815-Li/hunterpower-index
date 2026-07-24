import type { MacroObservation } from "@/lib/macro/types";

export interface VerifiedManualMacroSeries {
  source: string;
  sourceUrl: string;
  observations: readonly Omit<MacroObservation, "seriesCode" | "fetchedAt" | "isPreliminary" | "isRevised">[];
}

const verifiedAt = "2026-07-22T00:00:00.000Z";

export const verifiedManualMacroData: Readonly<Record<string, VerifiedManualMacroSeries>> = {
  CN_MLF_1Y: {
    source: "People's Bank of China (PBOC)",
    sourceUrl: "https://finance.people.com.cn/n1/2026/0625/c1004-40747232.html",
    observations: [
      { period: "2026-05-25", value: 600, publishedAt: "2026-05-25T09:00:00+08:00" },
      { period: "2026-06-25", value: 500, publishedAt: "2026-06-25T09:00:00+08:00" },
    ],
  },
  CN_LPR_1Y: {
    source: "PBOC / National Interbank Funding Center",
    sourceUrl: "https://finance.people.com.cn/n1/2026/0720/c1004-40764216.html",
    observations: [
      { period: "2026-06-22", value: 3.0, publishedAt: "2026-06-22T09:00:00+08:00" },
      { period: "2026-07-20", value: 3.0, publishedAt: "2026-07-20T09:00:00+08:00" },
    ],
  },
  CN_LPR_5Y: {
    source: "PBOC / National Interbank Funding Center",
    sourceUrl: "https://finance.people.com.cn/n1/2026/0720/c1004-40764216.html",
    observations: [
      { period: "2026-06-22", value: 3.5, publishedAt: "2026-06-22T09:00:00+08:00" },
      { period: "2026-07-20", value: 3.5, publishedAt: "2026-07-20T09:00:00+08:00" },
    ],
  },
  CN_DR007: {
    source: "CFETS via China Financial Information Network",
    sourceUrl: "https://m.cnfin.com/yw-lb/zixun/20260720/4443210_1.html",
    observations: [
      { period: "2026-07-17", value: 1.4363, publishedAt: "2026-07-17T17:00:00+08:00" },
      { period: "2026-07-20", value: 1.4323, publishedAt: "2026-07-20T17:00:00+08:00" },
    ],
  },
  CN_GDP: {
    source: "National Bureau of Statistics of China",
    sourceUrl: "https://www.stats.gov.cn/english/PressRelease/202607/t20260717_1964160.html",
    observations: [
      { period: "2026-01-01", value: 5.0, publishedAt: "2026-04-17T09:30:00+08:00" },
      { period: "2026-04-01", value: 4.3, publishedAt: "2026-07-17T09:30:00+08:00" },
    ],
  },
  CN_PMI_MFG: {
    source: "National Bureau of Statistics of China",
    sourceUrl: "https://www.stats.gov.cn/sj/zxfbhjd/202606/t20260630_1964032.html",
    observations: [
      { period: "2026-05-01", value: 50.0, publishedAt: "2026-05-31T09:30:00+08:00" },
      { period: "2026-06-01", value: 50.3, publishedAt: "2026-06-30T09:30:00+08:00" },
    ],
  },
  CN_RETAIL: {
    source: "National Bureau of Statistics of China",
    sourceUrl: "https://www.stats.gov.cn/sj/zxfb/202607/t20260715_1964127.html",
    observations: [
      { period: "2026-05-01", value: -0.6, publishedAt: "2026-06-16T10:00:00+08:00" },
      { period: "2026-06-01", value: 1.0, publishedAt: "2026-07-15T10:00:00+08:00" },
    ],
  },
  CN_CPI: {
    source: "National Bureau of Statistics of China",
    sourceUrl: "https://www.stats.gov.cn/sj/zxfbhjd/202607/t20260709_1964084.html",
    observations: [
      { period: "2026-05-01", value: 1.2, publishedAt: "2026-06-10T09:30:00+08:00" },
      { period: "2026-06-01", value: 1.0, publishedAt: "2026-07-09T09:30:00+08:00" },
    ],
  },
  CN_PPI: {
    source: "National Bureau of Statistics of China",
    sourceUrl: "https://www.stats.gov.cn/sj/zxfb/202607/t20260709_1964083.html",
    observations: [
      { period: "2026-05-01", value: 3.9, publishedAt: "2026-06-10T09:30:00+08:00" },
      { period: "2026-06-01", value: 4.1, publishedAt: "2026-07-09T09:30:00+08:00" },
    ],
  },
  CN_M2: {
    source: "PBOC via Xinhua",
    sourceUrl: "https://www.news.cn/20260715/b3540425de524b7082402a19c2b6062f/c.html",
    observations: [
      { period: "2026-05-01", value: 8.6, publishedAt: "2026-06-14T15:00:00+08:00" },
      { period: "2026-06-01", value: 8.0, publishedAt: "2026-07-15T15:00:00+08:00" },
    ],
  },
  CN_TSF_FLOW: {
    source: "PBOC cumulative releases · derived monthly snapshot",
    sourceUrl: "https://www.yicai.com/brief/103276145.html",
    observations: [
      { period: "2026-05-01", value: 20300, publishedAt: "2026-06-14T15:00:00+08:00" },
      { period: "2026-06-01", value: 33600, publishedAt: "2026-07-15T15:00:00+08:00" },
    ],
  },
  US_CPI_YY: {
    source: "U.S. Bureau of Labor Statistics",
    sourceUrl: "https://www.bls.gov/news.release/archives/cpi_07142026.htm",
    observations: [
      { period: "2026-05-01", value: 4.2, publishedAt: "2026-06-10T08:30:00-04:00" },
      { period: "2026-06-01", value: 3.5, publishedAt: "2026-07-14T08:30:00-04:00" },
    ],
  },
  US_NFP: {
    source: "U.S. Bureau of Labor Statistics",
    sourceUrl: "https://www.bls.gov/news.release/archives/empsit_07022026.pdf",
    observations: [
      { period: "2026-05-01", value: 129, publishedAt: "2026-06-05T08:30:00-04:00" },
      { period: "2026-06-01", value: 57, publishedAt: "2026-07-02T08:30:00-04:00" },
    ],
  },
  US_UNEMP: {
    source: "U.S. Bureau of Labor Statistics",
    sourceUrl: "https://www.bls.gov/news.release/archives/empsit_07022026.pdf",
    observations: [
      { period: "2026-05-01", value: 4.3, publishedAt: "2026-06-05T08:30:00-04:00" },
      { period: "2026-06-01", value: 4.2, publishedAt: "2026-07-02T08:30:00-04:00" },
    ],
  },
  US_ISM_MFG: {
    source: "Institute for Supply Management",
    sourceUrl: "https://www.ismworld.org/supply-management-news-and-reports/reports/ism-pmi-reports/pmi/june/",
    observations: [
      { period: "2026-05-01", value: 54.0, publishedAt: "2026-06-01T10:00:00-04:00" },
      { period: "2026-06-01", value: 53.3, publishedAt: "2026-07-01T10:00:00-04:00" },
    ],
  },
};

export function getVerifiedManualObservations(code: string): MacroObservation[] | null {
  const series = verifiedManualMacroData[code];
  if (!series) return null;
  return series.observations.map((observation) => ({
    ...observation,
    seriesCode: code,
    fetchedAt: verifiedAt,
    isPreliminary: false,
    isRevised: false,
  }));
}
