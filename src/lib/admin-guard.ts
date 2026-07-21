import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { serviceClient } from "./supabase-admin";

/**
 * Error carrying an HTTP status so route handlers can translate thrown guard
 * failures into the correct JSON response without leaking internals.
 */
export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "HttpError";
  }
}

export interface AdminContext {
  userId: string;
  admin: SupabaseClient;
}

/**
 * Verifies the caller is an authenticated Fridgenie admin.
 *
 * 1. Requires an `Authorization: Bearer <token>` header (else 401).
 * 2. Validates the token against Supabase Auth (else 401).
 * 3. Confirms `profiles.is_admin = true` via the service-role client (else 403).
 *
 * Returns the caller's user id and a service-role client for privileged work.
 */
export async function requireAdmin(req: Request): Promise<AdminContext> {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  const token = authHeader?.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : null;
  if (!token) throw new HttpError(401, "Missing bearer token");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new HttpError(500, "Missing Supabase client env");

  // Verify the JWT by resolving the user it belongs to.
  const authed = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const {
    data: { user },
    error: userError,
  } = await authed.auth.getUser();
  if (userError || !user) throw new HttpError(401, "Invalid or expired token");

  // Authorize: must be a flagged admin. Checked with the service role so RLS
  // cannot hide the flag.
  const admin = serviceClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (profileError) throw new HttpError(500, "Failed to load profile");
  if (!profile?.is_admin) throw new HttpError(403, "Not authorized");

  return { userId: user.id, admin };
}

/** Convert a thrown error into a JSON NextResponse with the right status. */
export function errorResponse(err: unknown): NextResponse {
  if (err instanceof HttpError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
