const round = (value, digits = 2) => Number(value.toFixed(digits));

function priceAtOffset(history, offset) {
  return history.at(-1 - offset)?.adjustedClose ?? null;
}

function returnFor(history, offset) {
  const latest = history.at(-1)?.adjustedClose;
  const previous = priceAtOffset(history, offset);
  if (!latest || !previous) return null;
  return round(((latest / previous) - 1) * 100);
}

function normalizeSeries(history) {
  const base = history.find((point) => point.adjustedClose)?.adjustedClose;
  if (!base) return new Map();
  return new Map(history
    .filter((point) => point.adjustedClose)
    .map((point) => [point.date, round((point.adjustedClose / base) * 100)]));
}

export function calculateHunterIndex(priceHistory, minimumConstituents = 2) {
  const cleanSeries = new Map();
  const warnings = [];

  for (const [ticker, points] of Object.entries(priceHistory)) {
    const valid = points
      .filter((point) => point.date && Number.isFinite(point.adjustedClose) && point.adjustedClose > 0)
      .sort((a, b) => a.date.localeCompare(b.date));
    const deduplicated = Array.from(new Map(valid.map((point) => [point.date, point])).values());
    if (deduplicated.length < 2) {
      warnings.push(`${ticker} 有效复权价格不足，已从指数计算中排除`);
      continue;
    }
    cleanSeries.set(ticker, deduplicated);
  }

  const allDates = Array.from(
    new Set(Array.from(cleanSeries.values()).flatMap((series) => series.map((point) => point.date))),
  ).sort();
  const basePrices = new Map();
  const cursors = new Map();
  const lastPrices = new Map();
  for (const [ticker, series] of cleanSeries) {
    basePrices.set(ticker, series[0].adjustedClose);
    cursors.set(ticker, 0);
  }

  const rawPoints = [];
  for (const date of allDates) {
    const normalizedValues = [];
    for (const [ticker, series] of cleanSeries) {
      let cursor = cursors.get(ticker) ?? 0;
      while (cursor < series.length && series[cursor].date <= date) {
        lastPrices.set(ticker, series[cursor].adjustedClose);
        cursor += 1;
      }
      cursors.set(ticker, cursor);
      const current = lastPrices.get(ticker);
      const base = basePrices.get(ticker);
      if (current && base && date >= series[0].date) normalizedValues.push((current / base) * 100);
    }
    if (normalizedValues.length >= minimumConstituents) {
      rawPoints.push({
        date,
        value: normalizedValues.reduce((sum, value) => sum + value, 0) / normalizedValues.length,
      });
    }
  }

  return {
    points: rawPoints.map((point, index) => {
      const previous = rawPoints[index - 1]?.value;
      return {
        date: point.date,
        value: round(point.value),
        dailyReturn: previous ? round(((point.value / previous) - 1) * 100, 4) : 0,
      };
    }),
    warnings,
  };
}

export function buildMarketSnapshot(constituents, histories) {
  const missing = [...constituents.map((item) => item.ticker), "SPY", "QQQ", "XLU"]
    .filter((ticker) => !histories[ticker]?.length);
  if (missing.length) throw new Error(`以下标的没有完整数据：${missing.join("、")}`);

  const constituentHistories = Object.fromEntries(
    constituents.map(({ ticker }) => [ticker, histories[ticker]]),
  );
  const calculated = calculateHunterIndex(constituentHistories);
  if (calculated.points.length < 2) throw new Error("有效行情不足，无法计算 Hunter Power Index");

  const performances = constituents.map((item) => {
    const history = histories[item.ticker];
    const latest = history.at(-1).adjustedClose;
    const dailyReturn = returnFor(history, 1) ?? 0;
    const oneYearReturn = returnFor(history, 251);
    return {
      ...item,
      latestPrice: round(latest),
      dailyReturn: round(dailyReturn),
      oneMonthReturn: returnFor(history, 21),
      threeMonthReturn: returnFor(history, 63),
      oneYearReturn,
      contributionOneYear: oneYearReturn === null ? null : round(oneYearReturn * item.weight),
      dataStatus: history.length >= 252 ? "complete" : "limited",
    };
  });

  const sectorNames = Array.from(new Set(constituents.map((item) => item.sector)));
  const sectors = sectorNames.map((sector) => {
    const members = performances.filter((item) => item.sector === sector);
    const validReturns = members
      .map((item) => item.oneYearReturn)
      .filter((value) => value !== null);
    const average = validReturns.length
      ? validReturns.reduce((sum, value) => sum + value, 0) / validReturns.length
      : 0;
    return {
      sector,
      count: members.length,
      equalWeight: round(members.reduce((sum, item) => sum + item.weight, 0) * 100),
      averageOneYearReturn: round(average),
      contribution: round(members.reduce((sum, item) => sum + (item.contributionOneYear ?? 0), 0)),
    };
  }).sort((a, b) => b.contribution - a.contribution);

  const spyMap = normalizeSeries(histories.SPY);
  const qqqMap = normalizeSeries(histories.QQQ);
  const xluMap = normalizeSeries(histories.XLU);
  const comparisonSeries = calculated.points.map((point) => ({
    date: point.date,
    hunter: point.value,
    sp500: spyMap.get(point.date) ?? 100,
    nasdaq100: qqqMap.get(point.date) ?? 100,
    utilities: xluMap.get(point.date) ?? 100,
  }));
  const latest = calculated.points.at(-1);
  const previous = calculated.points.at(-2);
  const limited = performances
    .filter((item) => item.dataStatus === "limited")
    .map((item) => item.ticker);
  const warnings = [...calculated.warnings];
  if (limited.length) warnings.push(`${limited.join("、")} 历史数据不足一年，年度收益显示为空`);

  return {
    source: "marketdata",
    provider: "marketdata",
    providerLabel: "Market Data",
    sourceLabel: "Market Data · 延迟日线复权收盘价 · 本地固定 IP 更新",
    cadence: "daily",
    dataDate: latest.date,
    updatedAt: `${latest.date} 美股收盘`,
    baseDate: calculated.points[0].date,
    baseValue: 100,
    latestValue: latest.value,
    dailyChange: round(latest.value - previous.value),
    dailyChangePercent: latest.dailyReturn,
    constituentCount: constituents.length,
    indexSeries: calculated.points,
    comparisonSeries,
    constituents: performances,
    sectors,
    warnings,
  };
}

export function assertValidSnapshot(snapshot, expectedConstituentCount = 20) {
  if (!snapshot || snapshot.provider !== "marketdata") throw new Error("快照来源不是 Market Data");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(snapshot.dataDate)) throw new Error("快照数据日期无效");
  if (!Number.isFinite(snapshot.latestValue) || snapshot.latestValue <= 0) throw new Error("指数点位无效");
  if (snapshot.constituents.length !== expectedConstituentCount) throw new Error("成分股数量不完整");
  if (snapshot.indexSeries.length < 2 || snapshot.comparisonSeries.length < 2) throw new Error("历史序列不足");
  if (snapshot.constituents.some((item) => !Number.isFinite(item.latestPrice) || item.latestPrice <= 0)) {
    throw new Error("至少一只成分股缺少有效收盘价");
  }
}
