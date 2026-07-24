import { NextResponse } from "next/server";
import { getFeaturedMacroSummary } from "@/lib/macro/service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getFeaturedMacroSummary(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Featured macro data unavailable",
      status: "error",
    }, { status: 503 });
  }
}
