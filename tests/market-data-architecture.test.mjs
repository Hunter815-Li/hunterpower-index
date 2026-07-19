import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("uses a server-only Market Data daily adapter and never Yahoo Finance", async () => {
  const [provider, marketData, dashboard] = await Promise.all([
    read("lib/market-data/providers/marketDataApp.ts"),
    read("lib/marketData.ts"),
    read("components/HunterDashboard.tsx"),
  ]);
  assert.match(provider, /api\.marketdata\.app\/v1\/stocks\/candles\/D/);
  assert.match(provider, /Authorization: `Bearer \$\{this\.apiToken\}`/);
  assert.match(provider, /adjustsplits/);
  assert.match(provider, /countback.*280/s);
  assert.doesNotMatch(`${provider}${marketData}${dashboard}`, /yahoo/i);
  assert.doesNotMatch(dashboard, /marketdata\.app\/v1|MARKETDATA_TOKEN/);
});

test("updates once daily with protected Vercel cron and persistent fetch caching", async () => {
  const [envExample, cron, vercel, provider, page] = await Promise.all([
    read(".env.example"),
    read("app/api/cron/refresh-market-data/route.ts"),
    read("vercel.json"),
    read("lib/market-data/providers/marketDataApp.ts"),
    read("app/page.tsx"),
  ]);
  assert.match(envExample, /MARKET_DATA_PROVIDER=marketdata/);
  assert.match(envExample, /MARKETDATA_TOKEN=/);
  assert.match(envExample, /CRON_SECRET=/);
  assert.match(cron, /authorization/);
  assert.match(cron, /revalidateTag\("market-data-eod"/);
  assert.match(vercel, /0 2 \* \* 2-6/);
  assert.match(provider, /revalidate: DAILY_REVALIDATE_SECONDS/);
  assert.match(page, /revalidate = 86_400/);
});

test("publishes derived server calculations without raw history, CSV or realtime routes", async () => {
  const [marketData, table, dashboard] = await Promise.all([
    read("lib/marketData.ts"),
    read("components/ConstituentTable.tsx"),
    read("components/HunterDashboard.tsx"),
  ]);
  assert.match(marketData, /calculateHunterIndex/);
  assert.doesNotMatch(table, /history|Blob|CSV|download/);
  assert.doesNotMatch(dashboard, /EventSource|30_000|\/api\/market-data/);
  assert.match(dashboard, /www\.marketdata\.app/);
  assert.doesNotMatch(marketData.match(/export interface ConstituentPerformance[\s\S]*?\n}/)?.[0] ?? "", /history/);
  await assert.rejects(access(new URL("app/api/market-data/stream/route.ts", root)));
  await assert.rejects(access(new URL("app/api/market-data/route.ts", root)));
});

test("keeps secrets out of git and retries upstream failures three times", async () => {
  const [gitignore, http] = await Promise.all([read(".gitignore"), read("lib/market-data/http.ts")]);
  assert.match(gitignore, /\.env\*/);
  assert.match(gitignore, /!\.env\.example/);
  assert.match(http, /MAX_RETRIES = 3/);
  assert.match(http, /market_data_request_failed/);
});
