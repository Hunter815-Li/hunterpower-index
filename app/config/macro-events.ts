import type { MacroEvent } from "@/lib/macro/types";

/** Manually verified against the linked NBS annual release calendar. */
export const verifiedChinaMacroEvents: readonly MacroEvent[] = [
  {
    id: "nbs-2026-07-pmi", country: "CN",
    eventName: "Monthly Report on Purchasing Managers' Index", eventNameZh: "7月采购经理指数（PMI）",
    scheduledAt: "2026-07-31T09:30:00+08:00", importance: "high", topic: "growth",
    previous: null, consensus: null, actual: null, unit: "index", status: "upcoming",
    source: "National Bureau of Statistics of China",
    sourceUrl: "https://www.stats.gov.cn/english/PressRelease/ReleaseCalendar/202512/t20251226_1962154.html",
    relatedSeriesId: "CN_PMI_MFG",
  },
  {
    id: "nbs-2026-08-national-economy", country: "CN",
    eventName: "National Economic Performance", eventNameZh: "7月国民经济运行情况",
    scheduledAt: "2026-08-17T10:00:00+08:00", importance: "high", topic: "growth",
    previous: null, consensus: null, actual: null, unit: null, status: "upcoming",
    source: "National Bureau of Statistics of China",
    sourceUrl: "https://www.stats.gov.cn/english/PressRelease/ReleaseCalendar/202512/t20251226_1962154.html",
    relatedSeriesId: "CN_IP",
  },
] as const;

/** Verified against the linked Federal Reserve, BEA, BLS and ISM release calendars. */
export const verifiedUsMacroEvents: readonly MacroEvent[] = [
  {
    id: "fed-2026-07-fomc", country: "US",
    eventName: "Federal Reserve Interest Rate Decision", eventNameZh: "美联储利率决议",
    scheduledAt: "2026-07-29T14:00:00-04:00", importance: "high", topic: "central-bank",
    previous: null, consensus: null, actual: null, unit: "%", status: "upcoming",
    source: "Board of Governors of the Federal Reserve System",
    sourceUrl: "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm",
    relatedSeriesId: "US_FED_TARGET",
  },
  {
    id: "bea-2026-07-gdp-advance", country: "US",
    eventName: "GDP (Advance Estimate), Q2 2026", eventNameZh: "美国第二季度 GDP 初值",
    scheduledAt: "2026-07-30T08:30:00-04:00", importance: "high", topic: "growth",
    previous: null, consensus: null, actual: null, unit: "%", status: "upcoming",
    source: "U.S. Bureau of Economic Analysis",
    sourceUrl: "https://www.bea.gov/news/schedule/",
    relatedSeriesId: "US_GDP",
  },
  {
    id: "bea-2026-07-pce", country: "US",
    eventName: "Personal Income and Outlays, June 2026", eventNameZh: "美国核心 PCE（6月）",
    scheduledAt: "2026-07-30T08:30:00-04:00", importance: "high", topic: "inflation",
    previous: null, consensus: null, actual: null, unit: "%", status: "upcoming",
    source: "U.S. Bureau of Economic Analysis",
    sourceUrl: "https://www.bea.gov/news/schedule/",
    relatedSeriesId: "US_CORE_PCE",
  },
  {
    id: "ism-2026-08-manufacturing", country: "US",
    eventName: "ISM Manufacturing PMI, July 2026", eventNameZh: "美国 ISM 制造业 PMI（7月）",
    scheduledAt: "2026-08-03T10:00:00-04:00", importance: "high", topic: "growth",
    previous: null, consensus: null, actual: null, unit: "index", status: "upcoming",
    source: "Institute for Supply Management",
    sourceUrl: "https://www.ismworld.org/supply-management-news-and-reports/reports/rob-report-calendar/",
    relatedSeriesId: "US_ISM_MFG",
  },
  {
    id: "bls-2026-08-employment", country: "US",
    eventName: "Employment Situation, July 2026", eventNameZh: "美国非农就业报告（7月）",
    scheduledAt: "2026-08-07T08:30:00-04:00", importance: "high", topic: "employment",
    previous: null, consensus: null, actual: null, unit: "K", status: "upcoming",
    source: "U.S. Bureau of Labor Statistics",
    sourceUrl: "https://www.bls.gov/schedule/2026/home.htm",
    relatedSeriesId: "US_NFP",
  },
  {
    id: "bls-2026-08-cpi", country: "US",
    eventName: "Consumer Price Index, July 2026", eventNameZh: "美国消费者价格指数（7月）",
    scheduledAt: "2026-08-12T08:30:00-04:00", importance: "high", topic: "inflation",
    previous: null, consensus: null, actual: null, unit: "%", status: "upcoming",
    source: "U.S. Bureau of Labor Statistics",
    sourceUrl: "https://www.bls.gov/schedule/2026/home.htm",
    relatedSeriesId: "US_CPI_YY",
  },
] as const;
