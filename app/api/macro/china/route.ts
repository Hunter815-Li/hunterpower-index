import { NextResponse } from "next/server";
import { getMacroDashboard } from "@/lib/macro/service";

export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json(await getMacroDashboard("CN"), { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400" } });
}
