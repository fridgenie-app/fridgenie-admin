# Fridgenie Admin

Owner-only operations console for Fridgenie, served at **admin.fridgenie.app**.

A **Next.js 14 (App Router)** app deployed to **Vercel (SSR)**. Privileged data
access runs through server-only API routes that use the Supabase service-role
key; the browser only ever holds the public anon key.

## Design

Matches the live Fridgenie brand: **Shippori Mincho** headings, **Inter** body,
warm paper palette (page `#F4EFE7`, card `#FAF7F2`), tomato red `#B63F39`
(button `#C94B44`), warm ink text, subtle botanical neutral accent. No emojis;
English only. Charts via Recharts.

## Pages

1. **Overview** (`/`) — users / pro / deleted, DAU·WAU·MAU, households · pantry
   items · recipes cooked · AI recipes, and AI spend (today / 7d / 30d).
2. **Cost** (`/cost`) — 30-day total, daily cost chart, and a per-model /
   per-function breakdown with an "unpriced" warning.
3. **Users** (`/users`) — searchable list with tier / admin / status / created /
   last active, plus Grant/Revoke Pro and Soft-delete/Restore actions.
4. Existing analytics pages (households, activity, retention, items, recipes,
   voice, geo, revenue, exports) — re-skinned to the new brand.

## Architecture

- **Public client** (`src/lib/supabase.ts`) — anon key, browser-safe.
- **Service-role layer** (`src/lib/supabase-admin.ts`) — server-only factory,
  reads env lazily.
- **Admin guard** (`src/lib/admin-guard.ts`) — `requireAdmin(req)` validates the
  caller's JWT and confirms `profiles.is_admin`, returning a service-role client.
- **API routes** (`src/app/api/admin/*`) — `overview`, `cost`, `users`,
  `set-tier`, `set-deleted`. Each runs on the Node.js runtime, is
  `force-dynamic`, and is guarded by `requireAdmin`.
- **Client API helper** (`src/lib/admin-api.ts`) — attaches the current access
  token and calls the routes.

The service-role RPCs (`ai_admin_overview`, `ai_usage_cost_report`,
`admin_set_subscription_tier`, `admin_set_user_deleted`) refuse anon/authenticated
JWTs, so they are only ever called server-side.

## Environment

Copy `.env.local.example` → `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL` (public)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public)
- `SUPABASE_SERVICE_ROLE_KEY` (server-only secret — never `NEXT_PUBLIC`)

## Local development

```bash
npm install
npm run dev       # http://localhost:3000
```

Add `http://localhost:3000` to the Supabase Auth redirect URLs to sign in locally.

## Deploy

Push to `main`; Vercel builds and deploys. See **DEPLOYMENT.md** for env vars,
custom-domain DNS (which must be repointed from GitHub Pages to Vercel), and the
post-deploy checklist.
