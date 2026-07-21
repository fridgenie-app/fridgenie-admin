-- ============================================================================
-- Admin dashboard support (admin.fridgenie.app)
--
-- What this adds — and, deliberately, what it does NOT duplicate:
--   * The Fridgenie backend ALREADY has the "AI usage log" the dashboard needs:
--     public.ai_usage_events (20260718130000_ai_usage_events.sql), written by
--     the recipe-suggest / voice-transcribe / receipt-ocr Edge Functions via
--     _shared/ai_usage.ts. It is intentionally service-role-only (RLS on, no
--     client policy) and its report RPCs REJECT authenticated callers. So a
--     browser admin app signed in as an ordinary authenticated user cannot read
--     it. We do NOT create a second `ai_usage_log` table (that would fork the
--     schema and break the ai_usage_events contract tests). Instead we expose it
--     to the owner through admin-gated SECURITY DEFINER RPCs below.
--   * Admin identity already exists as profiles.is_admin + public.is_admin()
--     (+ the admin-bypass RLS in 20260411000000). We do NOT create a separate
--     `admin_users` table; profiles.is_admin IS the owner allow-list.
--
-- This migration therefore only adds the genuinely-missing pieces:
--   1. A cost layer (ai_model_pricing) so token counts become dollars.
--   2. A soft-delete flag + an admin audit log.
--   3. Admin-gated read RPCs for every dashboard panel (one clean security
--      model: every RPC calls fg_assert_admin(), granted to authenticated only,
--      non-admins get 'forbidden').
--   4. Admin action RPCs (grant/revoke pro, soft-delete) that log to the audit.
--
-- Idempotent and additive: safe to re-run. Touches no existing quota/charging
-- path and does not alter ai_usage_events.
-- ============================================================================

-- ── 0. Admin guard ──────────────────────────────────────────────────────────
-- profiles.is_admin is pinned by 20260714000000. The tracked admin-bypass
-- policies (20260411000000) depend on a no-arg public.is_admin(); define it
-- idempotently so this migration is self-sufficient on a fresh clone.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE((SELECT p.is_admin FROM public.profiles p WHERE p.id = auth.uid()), false);
$$;

-- Raise 42501 (maps to a PostgREST 403) unless the caller is an owner-admin.
CREATE OR REPLACE FUNCTION public.fg_assert_admin()
RETURNS void
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
END;
$$;

-- ── 1. Soft-delete flag + admin audit log ───────────────────────────────────
-- Soft delete only flags the account; real erasure stays with the delete-account
-- Edge Function. deleted_at lets the console hide/restore without data loss.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action     text NOT NULL,
  target_id  uuid,
  details    jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created ON public.admin_activity_logs (created_at DESC);

ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read activity logs" ON public.admin_activity_logs;
CREATE POLICY "Admins read activity logs" ON public.admin_activity_logs
  FOR SELECT TO authenticated USING (public.is_admin());
-- Writes happen only through the SECURITY DEFINER action RPCs below.
REVOKE INSERT, UPDATE, DELETE ON public.admin_activity_logs FROM anon, authenticated;

-- ── 2. Cost layer ───────────────────────────────────────────────────────────
-- Pricing is config, not code: update a row here when OpenAI changes prices;
-- no redeploy. Prices are USD per 1,000,000 tokens. Seeded values are list
-- prices as of early 2026 and should be verified by the owner.
CREATE TABLE IF NOT EXISTS public.ai_model_pricing (
  model           text PRIMARY KEY,
  input_per_mtok  numeric(12,4) NOT NULL DEFAULT 0,
  output_per_mtok numeric(12,4) NOT NULL DEFAULT 0,
  note            text,
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_model_pricing ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read pricing" ON public.ai_model_pricing;
CREATE POLICY "Admins read pricing" ON public.ai_model_pricing
  FOR SELECT TO authenticated USING (public.is_admin());
REVOKE INSERT, UPDATE, DELETE ON public.ai_model_pricing FROM anon, authenticated;

INSERT INTO public.ai_model_pricing (model, input_per_mtok, output_per_mtok, note) VALUES
  ('gpt-4o',      2.5000, 10.0000, 'OpenAI gpt-4o list price (verify).'),
  ('gpt-4o-mini', 0.1500,  0.6000, 'OpenAI gpt-4o-mini list price (verify).'),
  ('gpt-5.4',     0.0000,  0.0000, 'SET CURRENT PRICE — unknown at migration time.'),
  ('whisper-1',   0.0000,  0.0000, 'Whisper is billed per audio-minute, not tokens; cost is not derivable from token counts and shows as $0 here.')
ON CONFLICT (model) DO NOTHING;

-- Cost of one event row, in USD, given the pricing table. Kept as SQL so every
-- report below computes cost identically. NULL model / unseeded model -> 0.
CREATE OR REPLACE FUNCTION public.fg_event_cost_usd(
  p_model text, p_input integer, p_output integer
) RETURNS numeric
LANGUAGE sql STABLE
SET search_path = public, pg_temp
AS $$
  SELECT round(
    ( COALESCE(p_input,  0)::numeric / 1000000 * COALESCE(pr.input_per_mtok,  0)
    + COALESCE(p_output, 0)::numeric / 1000000 * COALESCE(pr.output_per_mtok, 0)
    )::numeric, 6)
  FROM (SELECT p_model AS m) k
  LEFT JOIN public.ai_model_pricing pr ON pr.model = k.m;
$$;

-- ── 3. Read RPCs (admin-gated) ──────────────────────────────────────────────

-- 3.1 Signups per day, last N days (zero-filled).
CREATE OR REPLACE FUNCTION public.admin_signups_daily(p_days int DEFAULT 30)
RETURNS TABLE (day date, signups bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_from date := (now() AT TIME ZONE 'UTC')::date - (GREATEST(p_days,1) - 1);
BEGIN
  PERFORM public.fg_assert_admin();
  RETURN QUERY
  SELECT gs::date AS day, COALESCE(c.n, 0) AS signups
  FROM generate_series(v_from::timestamp,
                       (now() AT TIME ZONE 'UTC')::date::timestamp,
                       interval '1 day') gs
  LEFT JOIN (
    SELECT (p.created_at AT TIME ZONE 'UTC')::date AS d, count(*) AS n
    FROM public.profiles p
    WHERE p.created_at >= v_from
    GROUP BY 1
  ) c ON c.d = gs::date
  ORDER BY day;
END;
$$;

-- 3.2 DAU / WAU / MAU + total (from profiles.last_active_at).
CREATE OR REPLACE FUNCTION public.admin_active_users()
RETURNS TABLE (dau bigint, wau bigint, mau bigint, total_users bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.fg_assert_admin();
  RETURN QUERY
  SELECT
    count(*) FILTER (WHERE p.last_active_at >= now() - interval '1 day'),
    count(*) FILTER (WHERE p.last_active_at >= now() - interval '7 days'),
    count(*) FILTER (WHERE p.last_active_at >= now() - interval '30 days'),
    count(*)
  FROM public.profiles p
  WHERE p.deleted_at IS NULL;
END;
$$;

-- 3.3 Content usage totals. AI actions come from the charged, user-attributed
-- rows of the ledger (one charged row == one successful user request).
CREATE OR REPLACE FUNCTION public.admin_content_usage()
RETURNS TABLE (pantry_items bigint, recipes_generated bigint, receipt_scans bigint, voice_inputs bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.fg_assert_admin();
  RETURN QUERY
  SELECT
    (SELECT count(*) FROM public.pantry_items),
    (SELECT count(*) FROM public.ai_usage_events e
       WHERE e.actor_type = 'user' AND e.charged
         AND e.function IN ('recipe-suggest','generate-recipe')),
    (SELECT count(*) FROM public.ai_usage_events e
       WHERE e.actor_type = 'user' AND e.charged AND e.function = 'receipt-ocr'),
    (SELECT count(*) FROM public.ai_usage_events e
       WHERE e.actor_type = 'user' AND e.charged AND e.function = 'voice-transcribe');
END;
$$;

-- 3.4 Daily AI spend, last N days (all providers; every attempt counts).
CREATE OR REPLACE FUNCTION public.admin_ai_cost_daily(p_days int DEFAULT 30)
RETURNS TABLE (day date, cost_usd numeric, calls bigint, total_tokens bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.fg_assert_admin();
  RETURN QUERY
  SELECT
    (e.created_at AT TIME ZONE 'UTC')::date AS day,
    COALESCE(round(sum(public.fg_event_cost_usd(e.model, e.input_tokens, e.output_tokens)), 4), 0),
    count(*),
    COALESCE(sum(e.total_tokens), 0)
  FROM public.ai_usage_events e
  WHERE e.created_at >= (now() AT TIME ZONE 'UTC')::date - (GREATEST(p_days,1) - 1)
  GROUP BY 1
  ORDER BY 1;
END;
$$;

-- 3.5 Top users by token usage (default 10), with attributed cost + email.
CREATE OR REPLACE FUNCTION public.admin_ai_top_users(p_days int DEFAULT 30, p_limit int DEFAULT 10)
RETURNS TABLE (user_id uuid, email text, total_tokens bigint, cost_usd numeric, calls bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.fg_assert_admin();
  RETURN QUERY
  SELECT
    e.user_id,
    u.email::text,
    COALESCE(sum(e.total_tokens), 0),
    COALESCE(round(sum(public.fg_event_cost_usd(e.model, e.input_tokens, e.output_tokens)), 4), 0),
    count(*)
  FROM public.ai_usage_events e
  JOIN auth.users u ON u.id = e.user_id
  WHERE e.actor_type = 'user' AND e.user_id IS NOT NULL
    AND e.created_at >= (now() AT TIME ZONE 'UTC')::date - (GREATEST(p_days,1) - 1)
  GROUP BY e.user_id, u.email
  ORDER BY 3 DESC
  LIMIT GREATEST(p_limit, 1);
END;
$$;

-- 3.6 Searchable user list. item_count is per household (pantry_items is
-- household-scoped). Email/last_sign_in come from auth.users.
CREATE OR REPLACE FUNCTION public.admin_user_list(
  p_search text DEFAULT NULL, p_limit int DEFAULT 50, p_offset int DEFAULT 0
)
RETURNS TABLE (
  user_id uuid, email text, display_name text, created_at timestamptz,
  last_active_at timestamptz, household_id uuid, subscription_tier text,
  item_count bigint, is_admin boolean, deleted_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.fg_assert_admin();
  RETURN QUERY
  SELECT
    p.id, u.email::text, p.display_name, p.created_at, p.last_active_at,
    p.household_id, p.subscription_tier, COALESCE(pi.n, 0), p.is_admin, p.deleted_at
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  LEFT JOIN (
    SELECT household_id, count(*) AS n FROM public.pantry_items GROUP BY household_id
  ) pi ON pi.household_id = p.household_id
  WHERE p_search IS NULL OR p_search = ''
     OR u.email ILIKE '%' || p_search || '%'
     OR p.display_name ILIKE '%' || p_search || '%'
  ORDER BY p.created_at DESC
  LIMIT GREATEST(p_limit, 1) OFFSET GREATEST(p_offset, 0);
END;
$$;

-- ── 4. Action RPCs (admin-gated, audited) ───────────────────────────────────

-- 4.1 Grant / revoke the pro tier.
CREATE OR REPLACE FUNCTION public.admin_set_tier(p_user uuid, p_tier text)
RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.fg_assert_admin();
  IF p_tier NOT IN ('free','pro') THEN
    RAISE EXCEPTION 'invalid tier %', p_tier USING ERRCODE = '22023';
  END IF;
  UPDATE public.profiles
     SET subscription_tier = p_tier, tier_updated_at = now()
   WHERE id = p_user;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'no such user %', p_user USING ERRCODE = 'P0002';
  END IF;
  INSERT INTO public.admin_activity_logs (admin_id, action, target_id, details)
  VALUES (auth.uid(), 'set_tier', p_user, jsonb_build_object('tier', p_tier));
END;
$$;

-- 4.2 Soft-delete / restore an account (flag only; real erasure = delete-account).
CREATE OR REPLACE FUNCTION public.admin_soft_delete_user(p_user uuid, p_restore boolean DEFAULT false)
RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.fg_assert_admin();
  IF p_user = auth.uid() THEN
    RAISE EXCEPTION 'refusing to soft-delete your own admin account' USING ERRCODE = '22023';
  END IF;
  UPDATE public.profiles
     SET deleted_at = CASE WHEN p_restore THEN NULL ELSE now() END
   WHERE id = p_user;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'no such user %', p_user USING ERRCODE = 'P0002';
  END IF;
  INSERT INTO public.admin_activity_logs (admin_id, action, target_id, details)
  VALUES (auth.uid(), CASE WHEN p_restore THEN 'restore_user' ELSE 'soft_delete_user' END,
          p_user, NULL);
END;
$$;

-- ── 5. Grants ───────────────────────────────────────────────────────────────
-- EXECUTE to authenticated only; each body calls fg_assert_admin(), so a
-- non-admin authenticated user still gets 'forbidden'. anon gets nothing.
REVOKE ALL ON FUNCTION public.admin_signups_daily(int)              FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_active_users()                  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_content_usage()                 FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_ai_cost_daily(int)              FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_ai_top_users(int, int)          FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_user_list(text, int, int)       FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_tier(uuid, text)            FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_soft_delete_user(uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fg_assert_admin()                     FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fg_event_cost_usd(text, integer, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_signups_daily(int)              TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_active_users()                  TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_content_usage()                 TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_ai_cost_daily(int)              TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_ai_top_users(int, int)          TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_user_list(text, int, int)       TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_tier(uuid, text)            TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_soft_delete_user(uuid, boolean) TO authenticated;

-- Seed: make Minjun the owner-admin (idempotent; no-op if already set / not found).
UPDATE public.profiles p
   SET is_admin = true
  FROM auth.users u
 WHERE u.id = p.id AND u.email = 'rexford1011@gmail.com';
