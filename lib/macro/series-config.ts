import type { MacroCategory, MacroCountry, MacroFrequency, MacroMetricSnapshot } from "@/lib/macro/types";

export type MacroValueTransform = "level" | "yoy" | "mom" | "monthly-change";

export interface MacroSeriesDefinition {
  code: string;
  name: string;
  nameZh: string;
  country: MacroCountry;
  category: MacroCategory;
  unit: string;
  frequency: MacroFrequency;
  source: string;
  sourceUrl: string;
  provider: "fred" | "bls" | "bea" | "pbc" | "china-stats" | "china-bond" | "manual";
  providerCode?: string;
  fredFallbackCode?: string;
  fredDerivedSpread?: {
    minuendCode: string;
    subtrahendCode: string;
    scale: number;
  };
  transform?: MacroValueTransform;
  scale?: number;
}

const pbc = "http://www.pbc.gov.cn/en/3688241/index.html";
const stats = "https://www.stats.gov.cn/english/";
const fred = "https://fred.stlouisfed.org/";
const bls = "https://www.bls.gov/data/";
const bea = "https://www.bea.gov/data";

export const macroSeriesDefinitions: readonly MacroSeriesDefinition[] = [
  { code: "CN_RR_7D", name: "7-Day Reverse Repo Rate", nameZh: "7天逆回购利率", country: "CN", category: "policy", unit: "%", frequency: "daily", source: "People's Bank of China", sourceUrl: pbc, provider: "pbc" },
  { code: "CN_MLF_1Y", name: "1-Year MLF Operation", nameZh: "1年期MLF操作规模", country: "CN", category: "policy", unit: "CNY bn", frequency: "monthly", source: "People's Bank of China", sourceUrl: pbc, provider: "pbc" },
  { code: "CN_LPR_1Y", name: "1-Year LPR", nameZh: "1年期LPR", country: "CN", category: "policy", unit: "%", frequency: "monthly", source: "People's Bank of China", sourceUrl: pbc, provider: "pbc" },
  { code: "CN_LPR_5Y", name: "5Y+ LPR", nameZh: "5年期以上LPR", country: "CN", category: "policy", unit: "%", frequency: "monthly", source: "People's Bank of China", sourceUrl: pbc, provider: "pbc" },
  { code: "CN_RRR", name: "Reserve Requirement Ratio", nameZh: "存款准备金率", country: "CN", category: "policy", unit: "%", frequency: "daily", source: "People's Bank of China", sourceUrl: pbc, provider: "manual" },
  { code: "CN_DR007", name: "DR007", nameZh: "DR007", country: "CN", category: "rates", unit: "%", frequency: "daily", source: "China Foreign Exchange Trade System", sourceUrl: "https://www.chinamoney.com.cn/english/", provider: "manual" },
  { code: "CN_R007", name: "R007", nameZh: "R007", country: "CN", category: "rates", unit: "%", frequency: "daily", source: "China Foreign Exchange Trade System", sourceUrl: "https://www.chinamoney.com.cn/english/", provider: "manual" },
  { code: "CN_SHIBOR_ON", name: "Shibor Overnight", nameZh: "Shibor隔夜", country: "CN", category: "rates", unit: "%", frequency: "daily", source: "National Interbank Funding Center", sourceUrl: "https://www.shibor.org/", provider: "manual" },
  { code: "CN_SHIBOR_1W", name: "Shibor 1W", nameZh: "Shibor 1周", country: "CN", category: "rates", unit: "%", frequency: "daily", source: "National Interbank Funding Center", sourceUrl: "https://www.shibor.org/", provider: "manual" },
  { code: "CN_GB_10Y", name: "China 10Y", nameZh: "中国10年期国债", country: "CN", category: "rates", unit: "%", frequency: "daily", source: "ChinaBond", sourceUrl: "https://yield.chinabond.com.cn/cbweb-pbc-web/pbc/more?locale=cn_zh", provider: "china-bond" },
  { code: "CN_GB_30Y", name: "China 30Y", nameZh: "中国30年期国债", country: "CN", category: "rates", unit: "%", frequency: "daily", source: "ChinaBond", sourceUrl: "https://yield.chinabond.com.cn/cbweb-pbc-web/pbc/more?locale=cn_zh", provider: "china-bond" },
  { code: "CN_10Y1Y", name: "10Y-1Y Spread", nameZh: "10年-1年期限利差", country: "CN", category: "rates", unit: "bp", frequency: "daily", source: "Calculated from ChinaBond", sourceUrl: "https://yield.chinabond.com.cn/cbweb-pbc-web/pbc/more?locale=cn_zh", provider: "china-bond" },
  { code: "CN_GDP", name: "Real GDP", nameZh: "国内生产总值", country: "CN", category: "growth", unit: "% YoY", frequency: "quarterly", source: "National Bureau of Statistics of China", sourceUrl: stats, provider: "china-stats" },
  { code: "CN_PMI_MFG", name: "Official Manufacturing PMI", nameZh: "官方制造业PMI", country: "CN", category: "growth", unit: "index", frequency: "monthly", source: "National Bureau of Statistics of China", sourceUrl: stats, provider: "china-stats" },
  { code: "CN_IP", name: "Industrial Production", nameZh: "规模以上工业增加值", country: "CN", category: "growth", unit: "% YoY", frequency: "monthly", source: "National Bureau of Statistics of China", sourceUrl: stats, provider: "china-stats" },
  { code: "CN_RETAIL", name: "Retail Sales", nameZh: "社会消费品零售总额", country: "CN", category: "growth", unit: "% YoY", frequency: "monthly", source: "National Bureau of Statistics of China", sourceUrl: stats, provider: "china-stats" },
  { code: "CN_FAI", name: "Fixed Asset Investment", nameZh: "固定资产投资", country: "CN", category: "growth", unit: "% YTD YoY", frequency: "monthly", source: "National Bureau of Statistics of China", sourceUrl: stats, provider: "china-stats" },
  { code: "CN_CPI", name: "CPI YoY", nameZh: "CPI同比", country: "CN", category: "inflation", unit: "%", frequency: "monthly", source: "National Bureau of Statistics of China", sourceUrl: stats, provider: "china-stats" },
  { code: "CN_CORE_CPI", name: "Core CPI YoY", nameZh: "核心CPI同比", country: "CN", category: "inflation", unit: "%", frequency: "monthly", source: "National Bureau of Statistics of China", sourceUrl: stats, provider: "china-stats" },
  { code: "CN_PPI", name: "PPI YoY", nameZh: "PPI同比", country: "CN", category: "inflation", unit: "%", frequency: "monthly", source: "National Bureau of Statistics of China", sourceUrl: stats, provider: "china-stats" },
  { code: "CN_M1", name: "M1 YoY", nameZh: "M1同比", country: "CN", category: "credit", unit: "%", frequency: "monthly", source: "People's Bank of China", sourceUrl: pbc, provider: "pbc" },
  { code: "CN_M2", name: "M2 YoY", nameZh: "M2同比", country: "CN", category: "credit", unit: "%", frequency: "monthly", source: "People's Bank of China", sourceUrl: pbc, provider: "pbc" },
  { code: "CN_NEW_LOANS", name: "New RMB Loans", nameZh: "新增人民币贷款", country: "CN", category: "credit", unit: "CNY bn", frequency: "monthly", source: "People's Bank of China", sourceUrl: pbc, provider: "pbc" },
  { code: "CN_TSF_FLOW", name: "Aggregate Financing Flow", nameZh: "社会融资规模增量", country: "CN", category: "credit", unit: "CNY bn", frequency: "monthly", source: "People's Bank of China", sourceUrl: pbc, provider: "pbc" },
  { code: "CN_TSF_STOCK", name: "Aggregate Financing Stock YoY", nameZh: "社融存量同比", country: "CN", category: "credit", unit: "%", frequency: "monthly", source: "People's Bank of China", sourceUrl: pbc, provider: "pbc" },
  { code: "US_FED_TARGET", name: "Fed Funds Target", nameZh: "联邦基金目标利率", country: "US", category: "policy", unit: "%", frequency: "daily", source: "Federal Reserve via FRED", sourceUrl: fred, provider: "fred", providerCode: "DFEDTARU" },
  { code: "US_EFFR", name: "Effective Fed Funds Rate", nameZh: "有效联邦基金利率", country: "US", category: "rates", unit: "%", frequency: "daily", source: "Federal Reserve Bank of New York via FRED", sourceUrl: fred, provider: "fred", providerCode: "EFFR" },
  { code: "US_SOFR", name: "SOFR", nameZh: "担保隔夜融资利率", country: "US", category: "rates", unit: "%", frequency: "daily", source: "Federal Reserve Bank of New York via FRED", sourceUrl: fred, provider: "fred", providerCode: "SOFR" },
  { code: "US_2Y", name: "US 2Y", nameZh: "美国2年期国债", country: "US", category: "rates", unit: "%", frequency: "daily", source: "Federal Reserve via FRED", sourceUrl: fred, provider: "fred", providerCode: "DGS2" },
  { code: "US_10Y", name: "US 10Y", nameZh: "美国10年期国债", country: "US", category: "rates", unit: "%", frequency: "daily", source: "Federal Reserve via FRED", sourceUrl: fred, provider: "fred", providerCode: "DGS10" },
  { code: "US_30Y", name: "US 30Y", nameZh: "美国30年期国债", country: "US", category: "rates", unit: "%", frequency: "daily", source: "Federal Reserve via FRED", sourceUrl: fred, provider: "fred", providerCode: "DGS30" },
  { code: "US_2S10S", name: "2s10s", nameZh: "2年-10年期限利差", country: "US", category: "rates", unit: "bp", frequency: "daily", source: "Federal Reserve via FRED", sourceUrl: fred, provider: "fred", providerCode: "T10Y2Y", scale: 100 },
  { code: "US_5S30S", name: "5s30s", nameZh: "5年-30年期限利差", country: "US", category: "rates", unit: "bp", frequency: "daily", source: "Calculated from FRED", sourceUrl: fred, provider: "fred", fredDerivedSpread: { minuendCode: "DGS30", subtrahendCode: "DGS5", scale: 100 } },
  { code: "US_REAL_10Y", name: "10Y Real Yield", nameZh: "10年期实际利率", country: "US", category: "rates", unit: "%", frequency: "daily", source: "Federal Reserve via FRED", sourceUrl: fred, provider: "fred", providerCode: "DFII10" },
  { code: "US_CPI_YY", name: "CPI YoY", nameZh: "CPI同比", country: "US", category: "inflation", unit: "%", frequency: "monthly", source: "U.S. Bureau of Labor Statistics", sourceUrl: bls, provider: "bls", providerCode: "CUUR0000SA0", fredFallbackCode: "CPIAUCSL", transform: "yoy" },
  { code: "US_CORE_CPI_YY", name: "Core CPI YoY", nameZh: "核心CPI同比", country: "US", category: "inflation", unit: "%", frequency: "monthly", source: "U.S. Bureau of Labor Statistics", sourceUrl: bls, provider: "bls", providerCode: "CUUR0000SA0L1E", fredFallbackCode: "CPILFESL", transform: "yoy" },
  { code: "US_CPI_MM", name: "CPI MoM", nameZh: "CPI环比", country: "US", category: "inflation", unit: "%", frequency: "monthly", source: "U.S. Bureau of Labor Statistics", sourceUrl: bls, provider: "bls", providerCode: "CUSR0000SA0", fredFallbackCode: "CPIAUCSL", transform: "mom" },
  { code: "US_CORE_CPI_MM", name: "Core CPI MoM", nameZh: "核心CPI环比", country: "US", category: "inflation", unit: "%", frequency: "monthly", source: "U.S. Bureau of Labor Statistics", sourceUrl: bls, provider: "bls", providerCode: "CUSR0000SA0L1E", fredFallbackCode: "CPILFESL", transform: "mom" },
  { code: "US_PPI_YY", name: "PPI YoY", nameZh: "PPI同比", country: "US", category: "inflation", unit: "%", frequency: "monthly", source: "U.S. Bureau of Labor Statistics", sourceUrl: bls, provider: "bls", providerCode: "WPUFD4", fredFallbackCode: "PPIFIS", transform: "yoy" },
  { code: "US_CORE_PCE", name: "Core PCE YoY", nameZh: "核心PCE同比", country: "US", category: "inflation", unit: "%", frequency: "monthly", source: "U.S. Bureau of Economic Analysis", sourceUrl: bea, provider: "bea", fredFallbackCode: "PCEPILFE", transform: "yoy" },
  { code: "US_NFP", name: "Nonfarm Payrolls", nameZh: "非农就业人数", country: "US", category: "employment", unit: "thousand", frequency: "monthly", source: "U.S. Bureau of Labor Statistics", sourceUrl: bls, provider: "bls", providerCode: "CES0000000001", fredFallbackCode: "PAYEMS", transform: "monthly-change" },
  { code: "US_UNEMP", name: "Unemployment Rate", nameZh: "失业率", country: "US", category: "employment", unit: "%", frequency: "monthly", source: "U.S. Bureau of Labor Statistics", sourceUrl: bls, provider: "bls", providerCode: "LNS14000000", fredFallbackCode: "UNRATE" },
  { code: "US_AHE", name: "Average Hourly Earnings", nameZh: "平均时薪", country: "US", category: "employment", unit: "% YoY", frequency: "monthly", source: "U.S. Bureau of Labor Statistics", sourceUrl: bls, provider: "bls", providerCode: "CES0500000003", fredFallbackCode: "CES0500000003", transform: "yoy" },
  { code: "US_CLAIMS", name: "Initial Jobless Claims", nameZh: "首次申领失业救济人数", country: "US", category: "employment", unit: "thousand", frequency: "weekly", source: "U.S. Department of Labor via FRED", sourceUrl: fred, provider: "fred", providerCode: "ICSA", scale: 0.001 },
  { code: "US_LFPR", name: "Labor Force Participation", nameZh: "劳动参与率", country: "US", category: "employment", unit: "%", frequency: "monthly", source: "U.S. Bureau of Labor Statistics", sourceUrl: bls, provider: "bls", providerCode: "LNS11300000", fredFallbackCode: "CIVPART" },
  { code: "US_GDP", name: "Real GDP", nameZh: "实际GDP", country: "US", category: "growth", unit: "% SAAR", frequency: "quarterly", source: "U.S. Bureau of Economic Analysis", sourceUrl: bea, provider: "bea", fredFallbackCode: "A191RL1Q225SBEA" },
  { code: "US_RETAIL", name: "Retail Sales", nameZh: "零售销售", country: "US", category: "growth", unit: "% MoM", frequency: "monthly", source: "U.S. Census Bureau via FRED", sourceUrl: fred, provider: "fred", providerCode: "RSAFS", transform: "mom" },
  { code: "US_IP", name: "Industrial Production", nameZh: "工业产出", country: "US", category: "growth", unit: "index", frequency: "monthly", source: "Federal Reserve via FRED", sourceUrl: fred, provider: "fred", providerCode: "INDPRO" },
  { code: "US_ISM_MFG", name: "ISM Manufacturing", nameZh: "ISM制造业", country: "US", category: "growth", unit: "index", frequency: "monthly", source: "Institute for Supply Management", sourceUrl: "https://www.ismworld.org/supply-management-news-and-reports/reports/ism-report-on-business/", provider: "manual" },
  { code: "US_ISM_SERV", name: "ISM Services", nameZh: "ISM服务业", country: "US", category: "growth", unit: "index", frequency: "monthly", source: "Institute for Supply Management", sourceUrl: "https://www.ismworld.org/supply-management-news-and-reports/reports/ism-report-on-business/", provider: "manual" },
  { code: "US_FED_ASSETS", name: "Fed Balance Sheet", nameZh: "美联储资产负债表", country: "US", category: "liquidity", unit: "USD bn", frequency: "weekly", source: "Federal Reserve via FRED", sourceUrl: fred, provider: "fred", providerCode: "WALCL", scale: 0.001 },
  { code: "US_TGA", name: "Treasury General Account", nameZh: "美国财政部一般账户", country: "US", category: "liquidity", unit: "USD bn", frequency: "weekly", source: "U.S. Treasury via FRED", sourceUrl: fred, provider: "fred", providerCode: "WTREGEN", scale: 0.001 },
  { code: "US_RRP", name: "ON RRP", nameZh: "隔夜逆回购", country: "US", category: "liquidity", unit: "USD bn", frequency: "daily", source: "Federal Reserve Bank of New York via FRED", sourceUrl: fred, provider: "fred", providerCode: "RRPONTSYD" },
  { code: "US_M2", name: "M2", nameZh: "M2", country: "US", category: "liquidity", unit: "USD bn", frequency: "monthly", source: "Federal Reserve via FRED", sourceUrl: fred, provider: "fred", providerCode: "M2SL" },
  { code: "US_RESERVES", name: "Bank Reserves", nameZh: "银行准备金", country: "US", category: "liquidity", unit: "USD bn", frequency: "weekly", source: "Federal Reserve via FRED", sourceUrl: fred, provider: "fred", providerCode: "WRESBAL", scale: 0.001 },
  { code: "US_HY_SPREAD", name: "High Yield Spread", nameZh: "高收益债利差", country: "US", category: "liquidity", unit: "%", frequency: "daily", source: "ICE BofA via FRED", sourceUrl: fred, provider: "fred", providerCode: "BAMLH0A0HYM2" },
] as const;

export function emptyMacroSnapshot(definition: MacroSeriesDefinition): MacroMetricSnapshot {
  return {
    code: definition.code,
    name: definition.name,
    nameZh: definition.nameZh,
    country: definition.country,
    category: definition.category,
    value: null,
    unit: definition.unit,
    previous: null,
    change: null,
    direction: "unknown",
    period: null,
    publishedAt: null,
    nextReleaseAt: null,
    source: definition.source,
    sourceUrl: definition.sourceUrl,
    updatedAt: null,
    frequency: definition.frequency,
    status: "pending",
    consensus: null,
    surprise: null,
    revision: null,
    history: [],
  };
}

export function getEmptyMacroDashboard(country: MacroCountry): MacroMetricSnapshot[] {
  return macroSeriesDefinitions.filter((series) => series.country === country).map(emptyMacroSnapshot);
}

export function getMacroSeriesDefinition(code: string): MacroSeriesDefinition {
  const definition = macroSeriesDefinitions.find((series) => series.code === code || series.providerCode === code);
  if (!definition) throw new Error(`Unknown macro series: ${code}`);
  return definition;
}
