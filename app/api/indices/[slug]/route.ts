import { NextResponse } from "next/server";
import { calculateIndexStatistics } from "@/lib/index-engine/statistics";
import { getMarketSnapshot } from "@/lib/marketData";
export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) { if ((await params).slug !== "hunter-power") return NextResponse.json({ error: "Index not found" }, { status: 404 }); try { const snapshot = await getMarketSnapshot(); return NextResponse.json({ data: { ...snapshot, statistics: calculateIndexStatistics(snapshot.indexSeries, snapshot.comparisonSeries) } }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Index data unavailable", status: "unavailable" }, { status: 503 }); } }
