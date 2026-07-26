import assert from "node:assert/strict";
import test from "node:test";
import {
  assertValidSnapshot,
  buildMarketSnapshot,
  calculateHunterIndex,
} from "../scripts/hunter-snapshot-core.mjs";

test("calculateHunterIndex standardizes and equal-weights constituents", () => {
  const result = calculateHunterIndex({
    AAA: [
      { date: "2026-01-01", adjustedClose: 10 },
      { date: "2026-01-02", adjustedClose: 11 },
    ],
    BBB: [
      { date: "2026-01-01", adjustedClose: 20 },
      { date: "2026-01-02", adjustedClose: 18 },
    ],
  });
  assert.deepEqual(result.points, [
    { date: "2026-01-01", value: 100, dailyReturn: 0 },
    { date: "2026-01-02", value: 100, dailyReturn: 0 },
  ]);
});

test("buildMarketSnapshot returns a validated real-data shape", () => {
  const constituents = [
    { ticker: "AAA", companyName: "A", chineseName: "甲", sector: "设备", weight: 0.5 },
    { ticker: "BBB", companyName: "B", chineseName: "乙", sector: "公用事业", weight: 0.5 },
  ];
  const history = (base) => Array.from({ length: 252 }, (_, index) => ({
    date: new Date(Date.UTC(2025, 0, 1 + index)).toISOString().slice(0, 10),
    adjustedClose: base + index,
  }));
  const snapshot = buildMarketSnapshot(constituents, {
    AAA: history(10),
    BBB: history(20),
    SPY: history(30),
    QQQ: history(40),
    XLU: history(50),
  });
  assertValidSnapshot(snapshot, 2);
  assert.equal(snapshot.provider, "marketdata");
  assert.equal(snapshot.constituents.length, 2);
  assert.equal(snapshot.indexSeries.length, 252);
});
