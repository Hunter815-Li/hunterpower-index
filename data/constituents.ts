import constituentData from "@/data/hunter-power-constituents.json";

export interface Constituent {
  ticker: string;
  companyName: string;
  chineseName: string;
  sector: string;
  weight: number;
}

export const constituents: Constituent[] = constituentData;

export const sectors = Array.from(new Set(constituents.map((item) => item.sector)));
