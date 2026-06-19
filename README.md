# QRoll

A QR-based attendance tracker for recurring events — built for clubs and teams that need to know who showed up, who was late, and why.

Members scan an event-specific QR code to check in. Admins manage a roster, import historical attendance, and review a per-member matrix that highlights absences with editable notes.

[![CI](https://github.com/michelle-zhuang/QRoll/actions/workflows/ci.yml/badge.svg)](https://github.com/michelle-zhuang/QRoll/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Features

- **One-tap check-in** — Scan, sign in with Google, done. Status auto-classifies as present, late, or absent based on per-event time windows.
- **Roster-first model** — Members live in a `roster_members` table independent of auth. When someone signs up with a matching email, an auto-claim trigger links their account to historical records.
- **Historical import** — Past attendance from spreadsheets imports as real events (without QR tokens), so the analytics view shows one continuous timeline.
- **Attendance matrix** — Hover any cell for status + reason; admins click to add or edit notes. Notes persist via a server-side API.
- **Analytics dashboard** — Top attendees, least active, most-late-arrivals, on-time rate, and a per-event stacked bar.
- **Admin roster CRUD** — Add members, set emails to enable auto-claim, manually link a roster row to an existing profile, or delete.

## Tech stack

- **Frontend** — [Astro](https://astro.build) (SSR) + [React](https://react.dev) islands, [Tailwind v4](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com), [framer-motion](https://www.framer.com/motion/), [lucide-react](https://lucide.dev)
- **Backend** — [Supabase](https://supabase.com) (Postgres + Auth) with row-level claims via DB triggers
- **Deployment** — [Vercel](https://vercel.com) (`@astrojs/vercel` serverless adapter)
- **CI** — GitHub Actions (typecheck, vitest, build)

## Getting started

### Prerequisites

- Node.js 24+ (Vercel runtime; `>=22.12` works locally for dev)
- A Supabase project ([create one](https://supabase.com/dashboard/projects))
- The Supabase CLI (`brew install supabase/tap/supabase`)

### 1. Install

```sh
git clone https://github.com/michelle-zhuang/QRoll.git
cd QRoll
npm install
```

### 2. Configure environment

```sh
cp .env.example .env
```

Fill in `.env` with values from your Supabase project's API settings:

```
PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # optional, server-only utilities
PUBLIC_APP_URL=http://localhost:4321
```

> The anon key is intended to be public **only when row-level security is enabled**. Configure RLS policies before exposing the app publicly.

### 3. Apply database schema + seed

```sh
supabase link --project-ref <project-ref>
supabase db push
```

This applies two migrations:
- `20260520210000_roster_and_historical.sql` — schema (roster, attendance updates, auto-claim trigger)
- `20260520210001_seed_historical_data.sql` — 45 example roster members + 21 historical events + 566 attendance records (idempotent, safe to skip in production)

To start with an empty database, delete the seed migration before pushing.

### 4. Configure Google OAuth in Supabase

Supabase Dashboard → Authentication → Providers → Google. Add your OAuth client ID/secret and set the redirect URL to `http://localhost:4321/api/auth/callback` (and your Vercel URL for production).

### 5. Run

```sh
npm run dev
```

Open [http://localhost:4321](http://localhost:4321).

## Project structure

```
src/
├── components/         # React + Astro UI (shadcn primitives, Astro wrappers, AttendanceMatrix island)
├── layouts/            # Layout.astro with nav + auth context
├── lib/                # supabase client, time logic, attendance types
├── pages/
│   ├── api/            # Server endpoints (auth callbacks, attendance/note)
│   ├── admin/          # Event management, roster CRUD
│   ├── checkin/[token].astro  # QR scan landing page
│   ├── dashboard.astro # Analytics + matrix (member + admin view)
│   └── login.astro
├── styles/global.css   # Tailwind + Playful Dream palette
└── setup.test.ts
supabase/
├── migrations/
└── config.toml
.github/
├── workflows/ci.yml
└── pull_request_template.md
```

## Scripts

| Command            | Action                                       |
| ------------------ | -------------------------------------------- |
| `npm run dev`      | Start local dev server at `localhost:4321`   |
| `npm run build`    | Production build (Vercel-targeted)           |
| `npm run preview`  | Preview the built output                     |
| `npm test`         | Run Vitest unit tests                        |
| `npx astro check`  | Astro + TypeScript diagnostics               |

## Deployment

The repo is wired for **Vercel** with auto-deploy from GitHub:
- Push to `main` → production deploy
- Open a PR → preview deploy with a unique URL posted on the PR
- All deploys read env vars from the Vercel project (Production / Preview / Development scopes)

CI runs on every push and PR via `.github/workflows/ci.yml`:
- `astro check` — type errors block the merge
- `vitest run` — unit tests must pass
- `astro build` — build must succeed

## Database design

```
profiles                roster_members              events
─────────               ──────────────              ──────
id (auth.users.id)      id                          id
email                   full_name                   title
full_name               email (unique)              starts_at, checkin_*_at
role                    claimed_user_id ──┐         qr_token (nullable)
                        notes             │         is_historical
                                          │
                                          ▼
                                       profiles.id

attendance
──────────
id
event_id              ──→ events.id
roster_member_id      ──→ roster_members.id
user_id (nullable)    ──→ profiles.id
status (present|late|absent|on_time)
note
checked_in_at, ip_address, user_agent
```

A DB trigger (`handle_profile_claim`) auto-links a new profile to a roster member when emails match, so historical attendance follows the user once they sign up.

## Contributing

Pull requests welcome. The PR template includes a readiness checklist (code, security, db, ui, deployment) — please run through it before requesting review. CI will verify the basics on every push.

## License

[MIT](LICENSE) © Michelle Zhuang
