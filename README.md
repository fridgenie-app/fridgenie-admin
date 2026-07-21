# Fridgenie Admin

Owner-only operations console for Fridgenie, served at **admin.fridgenie.app**.

This is a **self-contained static site** (`web/`) — no build step, no framework.
It talks to the existing Supabase project (`rhhaojpsqfbapltcvsbz`) using only the
**public anon key**, with all access gated by Row-Level Security and admin-only
RPCs. The service-role key is never used client-side.

> The previous Next.js app (`src/`, `package.json`, …) is **superseded** by
> `web/` and can be deleted in a follow-up. It was left in place to keep this
> diff reviewable.

## Design

Matches the live landing page tokens: **Shippori Mincho** headers, **Inter**
body, warm paper palette (`--bg:#faf7f2`, `--red:#b63f39`). Charts via Chart.js.

## Dashboard sections

1. **Overview** — total users, DAU / WAU / MAU
2. **Signups** — per-day chart, last 30 days
3. **Content usage** — pantry items, recipes generated, receipt scans, voice inputs
4. **AI cost** — daily spend (last 30 days) + top 10 users by token usage
5. **Users** — searchable list: email, signup date, last active, item count, plan
6. **Per-user actions** — grant/revoke pro, soft-delete / restore

## Security model

- **Identity:** `profiles.is_admin` + `public.is_admin()` (already in the mobile
  backend). No separate `admin_users` table — `is_admin` **is** the allow-list.
- **Reads:** every dashboard query is a `SECURITY DEFINER` RPC
  (`admin_*`, granted to `authenticated`) that calls `fg_assert_admin()` first.
  A non-admin authenticated user gets `forbidden`; anon gets nothing.
- **AI spend:** sourced from the service-role-only `ai_usage_events` ledger
  (written by the recipe-suggest / voice-transcribe / receipt-ocr Edge Functions
  via `_shared/ai_usage.ts`). The RPCs are the only path that exposes it to the
  owner. Dollar cost is computed from `ai_model_pricing` (config, not code).
- **Actions** are audited to `admin_activity_logs`.

See `supabase/migrations/20260721000000_admin_dashboard.sql`.

## One-time setup

1. **Apply the migration** — paste `supabase/migrations/20260721000000_admin_dashboard.sql`
   into the Supabase SQL editor and run it (idempotent). It also seeds
   `profiles.is_admin = true` for `rexford1011@gmail.com`.
   > Mirror this file into the mobile repo's `supabase/migrations/` so the two
   > schemas stay in sync.
2. **Verify pricing** — check the `ai_model_pricing` rows (gpt-4o, gpt-4o-mini,
   gpt-5.4, whisper-1) and set the real per-1M-token prices. `whisper-1` is
   billed per audio-minute and shows `$0` here by design.
3. **Auth redirect** — in Supabase → Authentication → URL Configuration, add
   `https://admin.fridgenie.app` (and `https://admin.fridgenie.app/`) to
   **Redirect URLs**, and set it as an allowed Site URL.

## Sign in

Go to https://admin.fridgenie.app, enter `rexford1011@gmail.com`, click the magic
link in your inbox. The link returns to the dashboard already signed in. Any
non-admin who signs in sees a "Not authorized" screen.

## Local development

```bash
cd web
python3 -m http.server 4173
# open http://localhost:4173
```
Add `http://localhost:4173` to the Supabase Redirect URLs to test magic links locally.

## Deploy

Push to `main`; GitHub Actions publishes `web/` to GitHub Pages at
`admin.fridgenie.app` (CNAME committed). No secrets required — the anon key is
public by design.
