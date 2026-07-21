import { NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/admin-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { admin } = await requireAdmin(req);
    const { data, error } = await admin
      .from("profiles")
      .select(
        "id,email,subscription_tier,is_admin,deleted_at,created_at,last_active_at"
      )
      .order("created_at", { ascending: false })
      .limit(2000);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(data ?? []);
  } catch (err) {
    return errorResponse(err);
  }
}
