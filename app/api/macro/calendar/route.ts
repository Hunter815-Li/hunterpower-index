import { NextResponse } from "next/server";
import { getMacroCalendar } from "@/lib/macro/calendar";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requested = Number(url.searchParams.get("days") ?? "14");
  const days = Number.isFinite(requested) ? Math.min(30, Math.max(1, Math.trunc(requested))) : 14;
  return NextResponse.json(await getMacroCalendar(days), { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" } });
}
