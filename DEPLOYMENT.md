# Deployment Guide

## Overview

Fridgenie Admin is a **Next.js 14 (App Router) app deployed to Vercel** with
server-side rendering. It needs a server runtime because privileged data access
runs through server-only API routes (`/api/admin/*`) that use the Supabase
**service-role** key.

- **Repo**: `fridgenie-app/fridgenie-admin` (private)
- **Domain**: `admin.fridgenie.app`
- **Hosting**: Vercel (SSR)
- **Deploy**: Vercel Git integration (push to `main` → production build)

> The previous static GitHub Pages workflow
> (`.github/workflows/deploy.yml.disabled`) is **disabled** — a static export
> can no longer serve the API routes.

## Environment variables

Set these in **Vercel → Project → Settings → Environment Variables** (and in a
local `.env.local`, copied from `.env.local.example`):

| Variable                          | Scope        | Notes                                              |
|-----------------------------------|--------------|----------------------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`        | Public       | Supabase project URL                               |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | Public       | Supabase anon/public key                           |
| `SUPABASE_SERVICE_ROLE_KEY`       | **Secret**   | Server-only. **Do NOT** prefix with `NEXT_PUBLIC`. |

The service-role key must never reach the browser. It is read lazily inside the
server route handlers only.

## DNS / custom domain

DNS must be **repointed from GitHub Pages to Vercel.**

1. In Vercel → Project → Settings → Domains, add `admin.fridgenie.app`.
2. Update the DNS record at the registrar for `fridgenie.app`:

   | Type  | Name  | Value                   |
   |-------|-------|-------------------------|
   | CNAME | admin | `cname.vercel-dns.com`  |

   (Use the exact target Vercel shows for your project.)
3. The repo `CNAME` file is retained for history, but GitHub Pages no longer
   serves this domain — the CNAME record above is what matters.

Verify:

```bash
dig admin.fridgenie.app CNAME
# should resolve to the Vercel target, not fridgenie-app.github.io
```

## Build

```bash
npm install
npm run build   # produces a server build (.next), not a static export
npm start       # run the production server locally
```

The build does **not** require live Supabase env: the public client falls back
to placeholders and the admin API routes read env lazily at request time.

## Auth redirect URLs

In Supabase → Authentication → URL Configuration:
- Site URL: `https://admin.fridgenie.app`
- Redirect URLs: `https://admin.fridgenie.app/**` (and `http://localhost:3000/**`
  for local dev)

## Security model

- Privileged reads/writes (`ai_admin_overview`, `ai_usage_cost_report`,
  `admin_set_subscription_tier`, `admin_set_user_deleted`) are **service-role
  only** RPCs and are called exclusively from `/api/admin/*` route handlers.
- Each route is guarded by `requireAdmin()`, which validates the caller's JWT
  and confirms `profiles.is_admin = true` before doing any privileged work.
- The browser only ever holds the public anon key.

## Post-deployment checklist

- [ ] Vercel env vars set (all three; service-role marked secret)
- [ ] `admin.fridgenie.app` domain added in Vercel + DNS CNAME repointed
- [ ] Supabase redirect URLs updated for the production domain
- [ ] Sign in works and a non-admin sees "Not authorized" from the API
- [ ] Overview, Cost, and Users pages load real data
- [ ] Grant/Revoke Pro and Soft-delete/Restore actions succeed
