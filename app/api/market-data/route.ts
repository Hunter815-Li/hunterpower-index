import { NextResponse } from "next/server";
import { getMarketSnapshot, MarketDataError } from "@/lib/marketData";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = await getMarketSnapshot();
    return NextResponse.json(snapshot, {
      headers: {
        "Cache-Control": "private, no-store",
        "X-Market-Data-Provider": snapshot.provider,
        "X-Market-Data-Cache": "memory; ttl=10",
      },
    });
  } catch (error) {
    console.error(JSON.stringify({
      level: "error",
      event: "market_snapshot_failed",
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    }));
    const message = error instanceof Error ? error.message : "行情加载失败";
    const status = error instanceof MarketDataError
      ? error.code === "RATE_LIMIT" ? 429 : error.code === "CONFIGURATION" ? 503 : 502
      : 503;
    return NextResponse.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
  }
}
