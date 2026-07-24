import type { Constituent } from "@/data/constituents";
export interface IndexDefinition { slug: string; name: string; nameZh: string; ticker: string; baseValue: number; currency: string; weighting: "Equal Weight"; rebalance: "Quarterly" | "Semiannual" | "Annual"; benchmarks: string[]; constituents: Constituent[] }
export interface IndexStatistics { annualizedReturn: number | null; annualizedVolatility: number | null; maximumDrawdown: number | null; sharpeRatio: number | null; beta: number | null }
