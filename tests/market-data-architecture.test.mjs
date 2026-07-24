import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (file) => readFile(new URL(file, root), "utf8");

test("preserves the Hunter constituents and server-side index engine", async () => {
  const [constituents, calculator, definition, route] = await Promise.all([read("data/constituents.ts"), read("lib/calculateHunterIndex.ts"), read("data/indices/hunter-power.ts"), read("app/api/indices/[slug]/route.ts")]);
  assert.equal((constituents.match(/\{ ticker:/g) ?? []).length, 20);
  assert.match(calculator, /normalizedValues/);
  assert.match(definition, /ticker: "HPI"/);
  assert.match(route, /calculateIndexStatistics/);
});

test("uses a server-only provider chain with retries, cache, rate limiting and explicit mock opt-in", async () => {
  const [types, providers, http, cache, limiter, facade, board, fred, coinGecko, marketDataStocks] = await Promise.all([read("lib/market-data/types.ts"), read("lib/market-data/providers/index.ts"), read("lib/market-data/http.ts"), read("lib/market-data/cache.ts"), read("lib/market-data/rate-limit.ts"), read("lib/marketData.ts"), read("lib/market-data/market-board.ts"), read("lib/market-data/providers/fred.ts"), read("lib/market-data/providers/coingecko.ts"), read("lib/market-data/providers/marketDataStocks.ts")]);
  assert.match(types, /getQuotes/); assert.match(types, /getHistoricalPrices/); assert.match(types, /getFundamentals/);
  assert.match(providers, /MARKET_DATA_PROVIDER/); assert.match(providers, /MARKET_DATA_FALLBACKS/);
  assert.match(http, /MAX_RETRIES = 3/); assert.match(cache, /withMemoryCache/); assert.match(limiter, /takeRateLimitToken/);
  assert.match(facade, /ALLOW_MOCK_MARKET_DATA === "true" && process\.env\.NODE_ENV !== "production"/);
  assert.match(board, /sourceSymbol: "SP500"/); assert.match(board, /sourceSymbol: "NASDAQ100"/); assert.match(board, /sourceSymbol: "VIXCLS"/); assert.match(board, /sourceSymbol: "DTWEXBGS"/); assert.match(board, /sourceSymbol: "CBBTCUSD"/); assert.match(board, /provider: "marketdata-stocks"/);
  assert.match(fred, /api\.stlouisfed\.org\/fred\/series\/observations/); assert.match(coinGecko, /api\.coingecko\.com\/api\/v3/); assert.match(marketDataStocks, /MarketDataAppProvider/);
  assert.doesNotMatch(`${types}${providers}${http}${facade}`, /NEXT_PUBLIC_.*API_KEY/);
});

test("ships all phase-one routes and honest empty states", async () => {
  const required = ["app/page.tsx", "app/markets/page.tsx", "app/indices/page.tsx", "app/indices/hunter-power/page.tsx", "app/research/page.tsx", "app/research/[slug]/page.tsx", "app/research/wechat/page.tsx", "app/about/page.tsx", "app/methodology/hunter-power/page.tsx", "app/disclaimer/page.tsx"];
  const sources = await Promise.all(required.map(read));
  assert.match(sources.join("\n"), /Data unavailable/);
  assert.doesNotMatch(sources.join("\n"), /Math\.random/);
});

test("keeps local configuration and secrets safe", async () => {
  const [env, gitignore, readme, wechat, regime] = await Promise.all([read(".env.example"), read(".gitignore"), read("README.md"), read("config/wechat.ts"), read("config/market-regime.ts")]);
  assert.match(env, /MARKETDATA_TOKEN=/); assert.match(env, /FRED_API_KEY=/); assert.match(env, /COINGECKO_DEMO_API_KEY=/); assert.match(env, /DATABASE_URL=/); assert.match(env, /ALLOW_MOCK_MARKET_DATA=false/);
  assert.match(gitignore, /\.env\*/); assert.match(readme, /content\/research/); assert.match(wechat, /wechatArticles/); assert.match(regime, /marketRegime/);
});

test("all hard-coded blank-target links use safe rel attributes", async () => {
  const files = await readdir(new URL("../components/", import.meta.url), { recursive: true });
  const appFiles = await readdir(new URL("../app/", import.meta.url), { recursive: true });
  const candidates = [...files.map((file) => `components/${file}`), ...appFiles.map((file) => `app/${file}`)].filter((file) => file.endsWith(".tsx"));
  for (const file of candidates) {
    const source = await read(file);
    for (const match of source.matchAll(/<a[^>]*target="_blank"[^>]*>/g)) assert.match(match[0], /rel="noopener noreferrer"/, file);
  }
});
