import { NextResponse } from "next/server";
import { getMarketBoard, getMarketDataConfiguration } from "@/lib/market-data/market-board";
import { takeRateLimitToken } from "@/lib/market-data/rate-limit";

export const dynamic = "force-dynamic";
export async function GET() {
  if (!takeRateLimitToken("api:markets")) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: { "Retry-After": "60" } });
  try { return NextResponse.json({ data: await getMarketBoard(), configuration: getMarketDataConfiguration(), cadence: "next-day-eod", updatedAt: new Date().toISOString() }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Market data unavailable" }, { status: 503 }); }
}
