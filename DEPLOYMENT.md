# Deployment Guide

## Overview

Fridgenie Admin is deployed as a static site to GitHub Pages with a custom domain.

- **Repo**: `fridgenie-app/fridgenie-admin` (private)
- **Domain**: `admin.fridgenie.app`
- **Hosting**: GitHub Pages
- **CI/CD**: GitHub Actions (`.github/workflows/deploy.yml`)

## DNS Setup

### CNAME Record

Add the following DNS record to your domain registrar for `fridgenie.app`:

| Type  | Name    | Value                      | TTL  |
|-------|---------|----------------------------|------|
| CNAME | admin   | fridgenie-app.github.io    | 3600 |

### Verify DNS

```bash
dig admin.fridgenie.app CNAME
# Should return: admin.fridgenie.app. CNAME fridgenie-app.github.io.
```

## GitHub Pages Setup

1. Go to the repo Settings > Pages
2. Source: **GitHub Actions**
3. Custom domain: `admin.fridgenie.app`
4. Check **Enforce HTTPS** (SSL is automatic via GitHub Pages)

## GitHub Secrets

Add these repository secrets in Settings > Secrets and variables > Actions:

| Secret                          | Description                        |
|---------------------------------|------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase project URL          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous/public key |

## How Deployment Works

1. Push to `main` triggers the GitHub Actions workflow
2. The workflow installs dependencies, builds the static site, and copies the CNAME file
3. The `dist/` output is uploaded as a GitHub Pages artifact
4. GitHub Pages deploys the artifact and serves it at `admin.fridgenie.app`

## Manual Build

```bash
npm run build
```

The static site is exported to the `dist/` directory. The CNAME file must be present in `dist/` for the custom domain to work — the GitHub Actions workflow handles this automatically.

## Apple Sign-In Setup

### 1. Apple Developer Console
1. Go to developer.apple.com
2. Navigate to Certificates, Identifiers & Profiles > Identifiers
3. Create a new App ID with "Sign in with Apple" capability
4. Create a new Services ID for web authentication
5. Configure the domain: `admin.fridgenie.app`
6. Add return URL: `https://<your-supabase-project>.supabase.co/auth/v1/callback`

### 2. Supabase Configuration
1. Go to Supabase Dashboard > Authentication > Providers
2. Enable Apple provider
3. Add your Apple Service ID (Client ID)
4. Add your Apple Team ID
5. Generate and upload your Apple private key (.p8 file)
6. Set the Key ID from Apple Developer Console

### 3. Redirect URLs
In Supabase Dashboard > Authentication > URL Configuration:
- Site URL: `https://admin.fridgenie.app`
- Redirect URLs: `https://admin.fridgenie.app/**`

## Supabase Realtime

For live dashboard updates, ensure Realtime is enabled:
1. Go to Supabase Dashboard > Database > Replication
2. Enable replication for tables: `profiles`, `pantry_items`, `recipe_cooked_history`

## Troubleshooting

### Build fails
- Ensure all environment variables are set in GitHub Secrets
- Check that `npm ci` can resolve all dependencies

### Custom domain not working
- Verify the CNAME DNS record points to `fridgenie-app.github.io`
- DNS propagation can take up to 48 hours
- Ensure the CNAME file exists in the repo root with `admin.fridgenie.app`
- In repo Settings > Pages, confirm the custom domain is set and HTTPS is enforced

### SSL certificate issues
- GitHub Pages provisions SSL automatically after DNS is verified
- Wait 15-30 minutes after DNS propagation for certificate provisioning
- Check status in Settings > Pages under the custom domain section

## Post-Deployment Checklist

- [ ] DNS CNAME record configured
- [ ] SSL certificate active (HTTPS working)
- [ ] GitHub Secrets set for Supabase credentials
- [ ] Apple Sign-In configured (Apple Developer + Supabase)
- [ ] Supabase redirect URLs updated for production domain
- [ ] Realtime replication enabled for relevant tables
- [ ] Test login flow (both Apple and email/password)
- [ ] Verify dashboard data loads correctly
- [ ] Test export functionality (CSV, Excel, PDF)
