# Fridgenie Admin - Deployment Guide

## Custom Domain: admin.fridgenie.app

### DNS Configuration

Add a CNAME record in your domain registrar (e.g., Cloudflare, Namecheap):

```
Type: CNAME
Name: admin
Value: <your-hosting-provider>.app (e.g., cname.vercel-dns.com)
TTL: Auto
```

### Hosting Options

#### Vercel (Recommended)
1. Connect your GitHub repo to Vercel
2. Framework preset: Next.js
3. Build command: `npm run build`
4. Output directory: `out`
5. Add custom domain `admin.fridgenie.app` in project settings
6. SSL is automatic via Let's Encrypt

#### Netlify
1. Connect your GitHub repo
2. Build command: `npm run build`
3. Publish directory: `out`
4. Add custom domain in Domain settings
5. Enable HTTPS (automatic)

#### Cloudflare Pages
1. Connect your GitHub repo
2. Build command: `npm run build`
3. Build output directory: `out`
4. Add custom domain via Cloudflare DNS
5. SSL is automatic (Full/Strict mode recommended)

### Environment Variables

Set these in your hosting provider's dashboard:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJ...` |
| `NEXT_PUBLIC_BASE_PATH` | Leave empty for custom domain | `` |
| `NEXT_PUBLIC_SITE_URL` | Your admin dashboard URL | `https://admin.fridgenie.app` |

### SSL/HTTPS

All recommended hosting providers (Vercel, Netlify, Cloudflare Pages) provide automatic SSL certificates. No manual SSL configuration is needed.

If self-hosting:
1. Use Let's Encrypt with certbot for free SSL certificates
2. Configure your reverse proxy (nginx/caddy) to terminate SSL
3. Redirect HTTP to HTTPS

## Apple Sign-In Setup

### 1. Apple Developer Console
1. Go to [developer.apple.com](https://developer.apple.com)
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
3. Ensure your Supabase plan supports Realtime connections

## Build & Deploy

```bash
# Install dependencies
npm install

# Build static site
npm run build

# Output is in the `out/` directory
# Upload this to your hosting provider
```

## Post-Deployment Checklist

- [ ] DNS CNAME record configured
- [ ] SSL certificate active (HTTPS working)
- [ ] Environment variables set in hosting provider
- [ ] Supabase URL and anon key configured
- [ ] Apple Sign-In configured (Apple Developer + Supabase)
- [ ] Supabase redirect URLs updated for production domain
- [ ] Realtime replication enabled for relevant tables
- [ ] Test login flow (both Apple and email/password)
- [ ] Verify dashboard data loads correctly
- [ ] Test export functionality (CSV, Excel, PDF)
