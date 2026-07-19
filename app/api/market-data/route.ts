import { NextResponse } from "next/server";
import { getMarketSnapshot, MarketDataError } from "@/lib/marketData";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("fail") === "1") {
    return NextResponse.json({ message: "模拟行情服务暂时不可用，请稍后重试" }, { status: 503 });
  }

  try {
    const snapshot = await getMarketSnapshot();
    return NextResponse.json(snapshot, {
      headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "行情加载失败";
    const status = error instanceof MarketDataError && error.code === "RATE_LIMIT" ? 429 : 503;
    return NextResponse.json({ message }, { status });
  }
}
