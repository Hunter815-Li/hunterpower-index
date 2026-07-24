import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { clearMemoryCache } from "@/lib/market-data/cache";
import { getMarketBoard } from "@/lib/market-data/market-board";
import { getMarketSnapshot } from "@/lib/marketData";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const authorized = secret && request.headers.get("authorization") === `Bearer ${secret}`;
  if (process.env.NODE_ENV === "production" && !authorized) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    revalidateTag("market-data-eod", { expire: 0 });
    revalidateTag("market-board-eod", { expire: 0 });
    clearMemoryCache();
    const [indexResult, boardResult] = await Promise.allSettled([getMarketSnapshot({ bypassCache: true }), getMarketBoard()]);
    const snapshot = indexResult.status === "fulfilled" ? indexResult.value : null;
    const board = boardResult.status === "fulfilled" ? boardResult.value : [];
    const availableMarkets = board.filter((item) => item.marketStatus !== "unavailable").length;
    if (!snapshot && availableMarkets === 0) throw new Error("No real EOD dataset refreshed successfully");
    return NextResponse.json({
      ok: true,
      provider: snapshot?.provider ?? null,
      dataDate: snapshot?.dataDate ?? null,
      hunterPowerIndex: snapshot ? "checked" : "unavailable",
      globalMarkets: { available: availableMarkets, total: board.length },
      checkedAt: new Date().toISOString(),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error(JSON.stringify({
      level: "error",
      event: "daily_market_refresh_failed",
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    }));
    return NextResponse.json({ ok: false, message: "Daily market refresh failed" }, { status: 502 });
  }
}
