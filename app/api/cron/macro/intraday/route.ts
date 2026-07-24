import { NextResponse } from "next/server";
import { isCronAuthorized, runMacroRefresh } from "@/lib/macro/cron";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) return NextResponse.json({ ok: false }, { status: 401 });
  try { return NextResponse.json({ ok: true, ...(await runMacroRefresh("intraday")) }); }
  catch { return NextResponse.json({ ok: false, message: "Intraday macro refresh failed" }, { status: 502 }); }
}
