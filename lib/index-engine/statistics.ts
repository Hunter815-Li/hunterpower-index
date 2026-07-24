import type { ComparisonPoint } from "@/lib/marketData";
import type { HunterIndexPoint } from "@/lib/calculateHunterIndex";
import type { IndexStatistics } from "@/lib/index-engine/types";

const round = (value: number) => Number(value.toFixed(2));
const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
export function calculateIndexStatistics(points: HunterIndexPoint[], comparisons: ComparisonPoint[], annualRiskFreeRate = 0): IndexStatistics {
  if (points.length < 2) return { annualizedReturn: null, annualizedVolatility: null, maximumDrawdown: null, sharpeRatio: null, beta: null };
  const returns = points.slice(1).map((point) => point.dailyReturn / 100);
  const average = mean(returns); const variance = mean(returns.map((value) => (value - average) ** 2)); const volatility = Math.sqrt(variance) * Math.sqrt(252);
  const years = Math.max((Date.parse(points.at(-1)!.date) - Date.parse(points[0].date)) / (365.25 * 86_400_000), 1 / 252);
  const annualizedReturn = (points.at(-1)!.value / points[0].value) ** (1 / years) - 1;
  let peak = points[0].value; let drawdown = 0;
  for (const point of points) { peak = Math.max(peak, point.value); drawdown = Math.min(drawdown, point.value / peak - 1); }
  const benchmarkReturns = comparisons.slice(1).map((point, index) => point.sp500 / comparisons[index].sp500 - 1);
  const pairedLength = Math.min(returns.length, benchmarkReturns.length); const r = returns.slice(-pairedLength); const b = benchmarkReturns.slice(-pairedLength); const bMean = b.length ? mean(b) : 0;
  const covariance = b.length ? mean(b.map((value, index) => (value - bMean) * (r[index] - mean(r)))) : 0; const benchmarkVariance = b.length ? mean(b.map((value) => (value - bMean) ** 2)) : 0;
  return { annualizedReturn: round(annualizedReturn * 100), annualizedVolatility: round(volatility * 100), maximumDrawdown: round(drawdown * 100), sharpeRatio: volatility ? round((annualizedReturn - annualRiskFreeRate) / volatility) : null, beta: benchmarkVariance ? round(covariance / benchmarkVariance) : null };
}
