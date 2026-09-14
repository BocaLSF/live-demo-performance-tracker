# Live Demo Performance Tracker

Mobile-first React/Vite app for recording Live Demo zone performance. It runs in clearly labelled Demo mode without Supabase, and switches to Supabase when the two Vite environment variables are present.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. In SQL Editor, run `supabase/migrations/001_initial.sql`.
3. Enable an Auth provider (Magic Link is a good fit for an internal tool).
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env.local`.
5. Never expose a `service_role` key in the browser or repository.

The migration enables RLS and limits employee writes/reads to rows where `user_id = auth.uid()`. Add admin policies using a server-side role claim before enabling the admin dashboard against production data.

## Deployment

Run `npm run build`, then deploy the repository to Vercel (Framework: Vite, build command `npm run build`, output `dist`) or Cloudflare Pages (same build command/output). Add the two `VITE_` variables in the host's environment settings and redeploy.

## Admin setup

The seed marks Hansen as admin. For production, create the user through Supabase Auth, store the auth user id in an employee profile mapping, and add server-side admin RLS policies. The visible local Demo mode is intentionally not a production permission boundary.

## Included

- Mobile record flow with employee memory, zone cards, +/- counters (0–99), saving state and retry-safe UI
- Personal and team dashboards with Today / Week / Month / Custom Range filters
- CSV export in admin view
- PWA manifest metadata
- Demo records generated for the last 14 days

## TODO before production

- Wire Auth sign-in and profile-to-employee mapping
- Add admin-only RLS policies and management screens for employees/zones/records
- Add a service worker and real app icons for full offline/PWA install support
- Validate the final production schema and seed demo data only in a non-production project
