import { NextResponse } from "next/server";
import { isCronAuthorized, runCalendarRefresh } from "@/lib/macro/cron";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) return NextResponse.json({ ok: false }, { status: 401 });
  try { return NextResponse.json({ ok: true, ...(await runCalendarRefresh()) }); }
  catch { return NextResponse.json({ ok: false, message: "Macro calendar refresh failed" }, { status: 502 }); }
}
