import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the SERVICE-ROLE key.
 *
 * Env is read LAZILY inside the function so that `next build` never fails when
 * the env is absent (e.g. CI without secrets). This must never be imported into
 * client components — the service-role key bypasses RLS.
 */
export function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase server env");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
