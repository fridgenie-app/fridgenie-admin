import { NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/admin-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { admin } = await requireAdmin(req);
    const { data, error } = await admin.rpc("ai_admin_overview");
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    // The RPC returns a single row.
    const row = Array.isArray(data) ? data[0] ?? {} : data ?? {};
    return NextResponse.json(row);
  } catch (err) {
    return errorResponse(err);
  }
}
