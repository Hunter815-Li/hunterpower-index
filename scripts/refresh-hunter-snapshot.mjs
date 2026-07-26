import { readFile, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { buildMarketSnapshot, assertValidSnapshot } from "./hunter-snapshot-core.mjs";

const root = resolve(import.meta.dirname, "..");
const envPath = resolve(root, ".env.local");
const constituentPath = resolve(root, "data", "hunter-power-constituents.json");
const snapshotPath = resolve(root, "data", "hunter-power-snapshot.json");
const benchmarkTickers = ["SPY", "QQQ", "XLU"];

function parseEnv(text) {
  const values = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

function newYorkDate(timestamp) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(timestamp));
  const get = (type) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

async function fetchHistory(ticker, token, cutoffDate) {
  const url = new URL(`https://api.marketdata.app/v1/stocks/candles/D/${encodeURIComponent(ticker)}/`);
  url.searchParams.set("countback", "252");
  url.searchParams.set("to", cutoffDate);
  url.searchParams.set("adjustsplits", "true");

  let lastError;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      const body = await response.json();
      if (!response.ok || body.s !== "ok" || !body.c?.length || !body.t?.length) {
        const detail = body.errmsg || `HTTP ${response.status}`;
        throw new Error(`${ticker}: ${detail}`);
      }
      const history = body.t.map((timestamp, index) => ({
        date: new Date(timestamp * 1000).toISOString().slice(0, 10),
        adjustedClose: Number(body.c[index]),
      })).filter((point) => Number.isFinite(point.adjustedClose) && point.adjustedClose > 0);
      if (history.length < 2) throw new Error(`${ticker}: 返回的有效日线不足`);
      return history;
    } catch (error) {
      lastError = error;
      if (attempt < 2) await new Promise((resolveDelay) => setTimeout(resolveDelay, 1_000));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError;
}

async function readExistingSnapshot() {
  try {
    return JSON.parse(await readFile(snapshotPath, "utf8"));
  } catch {
    return { generatedAt: null, data: null };
  }
}

async function main() {
  const localEnv = parseEnv(await readFile(envPath, "utf8").catch(() => ""));
  const token = process.env.MARKETDATA_TOKEN?.trim() || localEnv.MARKETDATA_TOKEN?.trim();
  if (!token) {
    throw new Error("没有找到 MARKETDATA_TOKEN。请把真实 Token 写入项目根目录的 .env.local。");
  }

  const constituents = JSON.parse(await readFile(constituentPath, "utf8"));
  const tickers = [...constituents.map((item) => item.ticker), ...benchmarkTickers];
  const cutoffDate = newYorkDate(Date.now() - 86_400_000);
  const histories = {};

  console.log(`开始读取 Market Data 延迟日线；截止日期 ${cutoffDate}`);
  for (const [index, ticker] of tickers.entries()) {
    process.stdout.write(`[${index + 1}/${tickers.length}] ${ticker} ... `);
    histories[ticker] = await fetchHistory(ticker, token, cutoffDate);
    console.log(`${histories[ticker].at(-1).date} ✓`);
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 150));
  }

  const snapshot = buildMarketSnapshot(constituents, histories);
  assertValidSnapshot(snapshot, constituents.length);
  const existing = await readExistingSnapshot();
  if (existing.data?.dataDate && snapshot.dataDate < existing.data.dataDate) {
    throw new Error(`新数据日 ${snapshot.dataDate} 早于现有快照 ${existing.data.dataDate}，已拒绝覆盖`);
  }

  const output = {
    generatedAt: new Date().toISOString(),
    data: snapshot,
  };
  const temporaryPath = `${snapshotPath}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  await rename(temporaryPath, snapshotPath);
  console.log(`Hunter Power Index 快照已更新：${snapshot.dataDate}，指数 ${snapshot.latestValue.toFixed(2)}`);
}

main().catch((error) => {
  console.error(`更新失败：${error instanceof Error ? error.message : String(error)}`);
  console.error("现有快照没有被覆盖。");
  process.exitCode = 1;
});
