import { NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/admin-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function utcDate(offsetDays: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: Request) {
  try {
    const { admin } = await requireAdmin(req);
    const { searchParams } = new URL(req.url);

    const toParam = searchParams.get("to");
    const fromParam = searchParams.get("from");
    const p_to = toParam && DATE_RE.test(toParam) ? toParam : utcDate(0);
    const p_from = fromParam && DATE_RE.test(fromParam) ? fromParam : utcDate(-29);

    const { data, error } = await admin.rpc("ai_usage_cost_report", { p_from, p_to });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(data ?? []);
  } catch (err) {
    return errorResponse(err);
  }
}
