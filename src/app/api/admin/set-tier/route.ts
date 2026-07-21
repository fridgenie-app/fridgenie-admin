import { NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/admin-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_TIERS = new Set(["free", "pro"]);

export async function POST(req: Request) {
  try {
    const { admin, userId: callerId } = await requireAdmin(req);
    const body = await req.json().catch(() => ({}));
    const { userId, tier } = body as { userId?: string; tier?: string };

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    if (!tier || !VALID_TIERS.has(tier)) {
      return NextResponse.json({ error: "tier must be 'free' or 'pro'" }, { status: 400 });
    }

    const { error } = await admin.rpc("admin_set_subscription_tier", {
      p_admin: callerId,
      p_user: userId,
      p_tier: tier,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
