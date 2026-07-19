import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("uses server-only provider adapters and never Yahoo Finance", async () => {
  const [marketData, finnhub, polygon, twelve, client] = await Promise.all([
    read("lib/marketData.ts"),
    read("lib/market-data/providers/finnhub.ts"),
    read("lib/market-data/providers/polygon.ts"),
    read("lib/market-data/providers/twelveData.ts"),
    read("components/HunterDashboard.tsx"),
  ]);
  assert.match(finnhub, /finnhub\.io\/api\/v1/);
  assert.match(finnhub, /ws\.finnhub\.io/);
  assert.match(polygon, /api\.polygon\.io/);
  assert.match(twelve, /api\.twelvedata\.com/);
  assert.doesNotMatch(`${marketData}${finnhub}${polygon}${twelve}${client}`, /yahoo/i);
  assert.doesNotMatch(client, /finnhub\.io|polygon\.io|twelvedata\.com/i);
});

test("keeps provider keys server-side and documents safe configuration", async () => {
  const [envExample, gitignore, api, stream] = await Promise.all([
    read(".env.example"),
    read(".gitignore"),
    read("app/api/market-data/route.ts"),
    read("app/api/market-data/stream/route.ts"),
  ]);
  assert.match(envExample, /FINNHUB_API_KEY=/);
  assert.match(envExample, /MARKET_DATA_PROVIDER=finnhub/);
  assert.match(gitignore, /\.env\*/);
  assert.match(gitignore, /!\.env\.example/);
  assert.match(api, /getMarketSnapshot/);
  assert.match(stream, /text\/event-stream/);
});

test("implements caching, retries and server-side calculation", async () => {
  const [cache, http, marketData, client] = await Promise.all([
    read("lib/market-data/cache.ts"),
    read("lib/market-data/http.ts"),
    read("lib/marketData.ts"),
    read("components/HunterDashboard.tsx"),
  ]);
  assert.match(cache, /10_000|ttlMs/);
  assert.match(http, /MAX_RETRIES = 3/);
  assert.match(http, /market_data_request_failed/);
  assert.match(marketData, /calculateHunterIndex/);
  assert.doesNotMatch(client, /calculateHunterIndex/);
  assert.match(client, /30_000/);
});
