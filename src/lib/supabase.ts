import { createClient } from "@supabase/supabase-js";

// Public browser client (anon key). Falls back to harmless placeholders so that
// `next build` never fails when env is absent (real values are injected at
// runtime via Vercel env / .env.local). Privileged access goes through the
// server-side service-role API routes, never this client.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "public-anon-placeholder";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
