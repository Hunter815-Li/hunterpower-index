export interface HunterIndexPoint {
  date: string;
  value: number;
  dailyReturn: number;
}

export interface AdjustedPricePoint {
  date: string;
  adjustedClose: number | null;
}

export interface IndexCalculationResult {
  points: HunterIndexPoint[];
  excludedTickers: string[];
  warnings: string[];
}

const round = (value: number, digits = 4) => Number(value.toFixed(digits));

/**
 * 计算 Hunter 电力指数。
 *
 * 核心原则：先将每只股票的复权价格相对其基准价格标准化为 100，
 * 再对同一交易日的标准化价格做等权算术平均。这里绝不直接平均股票涨跌幅。
 * 缺失交易日会使用该股票最近一个有效复权价向前填充；上市前不会回填。
 */
export function calculateHunterIndex(
  priceHistory: Record<string, AdjustedPricePoint[]>,
  minimumConstituents = 2,
): IndexCalculationResult {
  const excludedTickers: string[] = [];
  const warnings: string[] = [];
  const cleanSeries = new Map<string, AdjustedPricePoint[]>();

  for (const [ticker, points] of Object.entries(priceHistory)) {
    const valid = points
      .filter((point) => point.date && point.adjustedClose !== null && Number.isFinite(point.adjustedClose) && point.adjustedClose! > 0)
      .sort((a, b) => a.date.localeCompare(b.date));

    const deduplicated = Array.from(new Map(valid.map((point) => [point.date, point])).values());
    if (deduplicated.length < 2) {
      excludedTickers.push(ticker);
      warnings.push(`${ticker} 有效复权价格不足，已从指数计算中排除`);
      continue;
    }
    cleanSeries.set(ticker, deduplicated);
  }

  const allDates = Array.from(
    new Set(Array.from(cleanSeries.values()).flatMap((series) => series.map((point) => point.date))),
  ).sort();

  const basePrices = new Map<string, number>();
  const cursors = new Map<string, number>();
  const lastPrices = new Map<string, number>();

  for (const [ticker, series] of cleanSeries) {
    basePrices.set(ticker, series[0].adjustedClose!);
    cursors.set(ticker, 0);
  }

  const rawPoints: Array<{ date: string; value: number }> = [];

  for (const date of allDates) {
    const normalizedValues: number[] = [];

    for (const [ticker, series] of cleanSeries) {
      let cursor = cursors.get(ticker) ?? 0;
      while (cursor < series.length && series[cursor].date <= date) {
        lastPrices.set(ticker, series[cursor].adjustedClose!);
        cursor += 1;
      }
      cursors.set(ticker, cursor);

      const current = lastPrices.get(ticker);
      const base = basePrices.get(ticker);
      const firstDate = series[0].date;
      if (current && base && date >= firstDate) normalizedValues.push((current / base) * 100);
    }

    if (normalizedValues.length >= minimumConstituents) {
      rawPoints.push({
        date,
        value: normalizedValues.reduce((sum, value) => sum + value, 0) / normalizedValues.length,
      });
    }
  }

  const points = rawPoints.map((point, index) => {
    const previous = rawPoints[index - 1]?.value;
    return {
      date: point.date,
      value: round(point.value, 2),
      dailyReturn: previous ? round(((point.value / previous) - 1) * 100, 4) : 0,
    };
  });

  return { points, excludedTickers, warnings };
}
