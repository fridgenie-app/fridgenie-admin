# Fridgenie Admin Dashboard

Admin dashboard for the Fridgenie app — a kitchen companion for managing pantries, recipes, and households.

## Features

- **Dashboard Overview** - Key metrics (users, households, items, recipes) with real-time updates
- **User Management** - Search, view, and manage user roles
- **Household Analytics** - Track household activity and growth
- **Activity Feed** - Live activity stream with real-time notifications
- **Retention Analytics** - DAU/WAU/MAU, stickiness, and cohort analysis
- **Item Analytics** - Top items, category distribution, expiration tracking
- **Recipe Analytics** - Discovery funnel, favorites, cooking frequency
- **Voice & Feature Usage** - Feature adoption tracking (placeholder for future data)
- **Geographic Analytics** - User distribution by location (placeholder)
- **Revenue** - Monetization metrics (placeholder for payment provider integration)
- **Reports & Export** - CSV, Excel, and PDF export with scheduled reports UI
- **Apple Sign-In** - Primary auth with email/password fallback

## Tech Stack

- **Framework**: Next.js 14 (Static Export)
- **Styling**: Tailwind CSS with tomato red theme
- **Charts**: Recharts
- **Auth & Data**: Supabase (Auth, Database, Realtime)
- **Fonts**: Fredoka (headings) + Nunito (body)

## Getting Started

```bash
# Install dependencies
npm install

# Create .env.local with your Supabase credentials
cp .env.example .env.local

# Run development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_BASE_PATH=
NEXT_PUBLIC_SITE_URL=https://admin.fridgenie.app
```

## Deployment

Deployed via GitHub Pages with GitHub Actions. See [DEPLOYMENT.md](./DEPLOYMENT.md) for full setup instructions.

### Quick Deploy

1. Push to `main` branch — GitHub Actions builds and deploys automatically
2. Custom domain: `admin.fridgenie.app`
3. Add Supabase secrets to repo Settings > Secrets:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### DNS

Add a CNAME record: `admin.fridgenie.app` → `fridgenie-app.github.io`

## Project Structure

```
src/
  app/
    page.tsx              # Dashboard overview
    login/                # Authentication
    users/                # User management
    households/           # Household list
    activity/             # Activity feed
    analytics/
      retention/          # DAU/WAU/MAU, cohorts
      items/              # Item trends
      recipes/            # Recipe funnel
      voice/              # Feature usage
      geo/                # Geographic (placeholder)
      revenue/            # Revenue (placeholder)
    exports/              # Reports & data export
  components/
    charts/               # Recharts chart components
    layout/               # Sidebar, dashboard layout
    ui/                   # Reusable UI components
  lib/
    supabase.ts           # Supabase client
    auth-context.tsx      # Auth provider
    use-realtime.ts       # Realtime subscription hook
    chart-theme.ts        # Chart color constants
    utils.ts              # Utility functions
  types/
    database.ts           # TypeScript interfaces
```
