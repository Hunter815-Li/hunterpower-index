export const featuredChinaMacroCodes = [
  "CN_MLF_1Y", "CN_LPR_1Y", "CN_LPR_5Y",
  "CN_DR007", "CN_GB_10Y", "CN_GB_30Y",
  "CN_GDP", "CN_PMI_MFG", "CN_RETAIL",
  "CN_CPI", "CN_PPI", "CN_M2", "CN_TSF_FLOW",
] as const;

export const featuredUsMacroCodes = [
  "US_FED_TARGET", "US_2Y", "US_10Y", "US_30Y",
  "US_CPI_YY", "US_CORE_PCE", "US_NFP", "US_UNEMP",
  "US_GDP", "US_ISM_MFG", "US_FED_ASSETS", "US_RRP", "US_TGA",
] as const;

export const featuredMacroCodes: ReadonlySet<string> = new Set([
  ...featuredChinaMacroCodes,
  ...featuredUsMacroCodes,
]);
