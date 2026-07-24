import { NextResponse } from "next/server";
import { saveManualOverride, type ManualOverrideInput } from "@/lib/macro/manual-override";

export const dynamic = "force-dynamic";

function isInput(value: unknown): value is ManualOverrideInput {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.code === "string"
    && typeof candidate.period === "string"
    && /^\d{4}-\d{2}(-\d{2})?$/.test(candidate.period)
    && typeof candidate.value === "number"
    && Number.isFinite(candidate.value)
    && (candidate.publishedAt === null || typeof candidate.publishedAt === "string")
    && typeof candidate.source === "string"
    && candidate.source.length > 0;
}

export async function POST(request: Request) {
  const secret = process.env.MACRO_ADMIN_TOKEN?.trim();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, message: "Invalid JSON" }, { status: 400 }); }
  if (!isInput(body)) return NextResponse.json({ ok: false, message: "Invalid macro override payload" }, { status: 400 });
  try {
    const saved = await saveManualOverride(body);
    return NextResponse.json({ ok: true, id: saved.id, code: body.code, period: body.period }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Manual override failed";
    return NextResponse.json({ ok: false, message }, { status: message.includes("DATABASE_URL") ? 503 : 400 });
  }
}
