import { NextResponse } from "next/server";
import { getMacroSummary } from "@/lib/macro/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const payload = await getMacroSummary();
  return NextResponse.json(payload, { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400" } });
}
