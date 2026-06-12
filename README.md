# David's Tracker

Personal tracker for goals, tasks, and notes. Installable PWA for iPhone + Mac. React + Vite + Tailwind on the front, Supabase (Postgres + auth + RLS) behind it, deployed on Vercel.

## Local dev

```powershell
npm install
copy .env.example .env   # then fill in your Supabase URL + anon key
npm run dev
```

## One-time setup

### Supabase

1. Sign up at [supabase.com](https://supabase.com) (free tier).
2. **New project** — name it anything, pick a strong database password (store it somewhere safe; you rarely need it), pick the region closest to you.
3. When the project finishes provisioning: **SQL Editor → New query**, paste the entire contents of [supabase/schema.sql](supabase/schema.sql), **Run**. This creates all tables and row-level security policies.
4. **Authentication → Sign In / Providers → Email**: leave Email enabled. Recommended for a 2-person app: turn **off** "Confirm email" so sign-up works instantly without an email round-trip.
5. **Project Settings → API**: copy the **Project URL** and the **anon / public** key into `.env` (see `.env.example`). Never copy the `service_role` key anywhere.

### Vercel

1. Sign up at [vercel.com](https://vercel.com) with your GitHub account (free Hobby tier, no credit card).
2. **Add New → Project** → import the `davids-tracker-app` repo.
3. Framework preset: **Vite** (auto-detected). Leave build settings as-is.
4. Under **Environment Variables**, add the same two values as your `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. **Deploy**. Every future push to `master` auto-deploys.

### Install on devices

- **iPhone:** open the Vercel URL in Safari → Share → **Add to Home Screen**.
- **Mac:** open in Safari → File → **Add to Dock** (or in Chrome: Install icon in the address bar).

## Notes

- Supabase free projects pause after ~1 week idle; they wake on the next request. Expected, not a bug.
- Each user's data is fully separate, enforced by Postgres row-level security.
