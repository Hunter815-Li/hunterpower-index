import { NextResponse } from "next/server";
import { getMacroSeries } from "@/lib/macro/service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const series = await getMacroSeries(code);
  if (!series) return NextResponse.json({ status: "unavailable", message: "Data unavailable" }, { status: 404 });
  return NextResponse.json({ status: "fresh", data: series }, { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400" } });
}
