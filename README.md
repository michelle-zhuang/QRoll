# QRoll

<div align="center">

![QRoll Logo](https://raw.githubusercontent.com/michelle-zhuang/QRoll/main/public/assets/qroll-logo.png "QRoll QR-based Attendance Tracker")

**A QR-based attendance tracker for recurring events — built for clubs and teams that need to know who showed up, who was late, and why.**

</div>

<div align="center">

![CI Status](https://img.shields.io/github/actions/workflow/status/michelle-zhuang/QRoll/ci.yml?branch=main&label=CI%20Status&color=brightgreen&size=large)
![License](https://img.shields.io/badge/license-MIT-blue.svg?style=plastic&logo=mit&logoColor=white&size=large)
![Release](https://img.shields.io/github/release/michelle-zhuang/QRoll?label=Latest%20Release&color=success&style=plastic&logo=GITHUB&link=https://github.com/michelle-zhuang/QRoll/releases)
[![Discord](https://img.shields.io/discord/xxxxxxxxxxxx?style=flat-square&logo=discord&logoColor=white)](https://discord.gg/xxxxxxxxxxxx)

</div>

## Overview

A beautiful, modern attendance tracking solution designed specifically for QRoll — the Active Canvas experience. Members scan an event-specific QR code to check in. Admins manage a roster, import historical attendance, and review a per-member matrix that highlights absences with editable notes.

## Quick Actions

| Command           | Action                                      |
| ----------------- | ------------------------------------------- |
| `npm run dev`     | Start local dev server at `localhost:4321`  |
| `npm run build`   | Production build (Vercel-targeted)          |
| `npm test`        | Run Vitest unit tests                       |
| `npx astro check` | Astro + TypeScript diagnostics              |

## ✨ Features

- **One-tap check-in** — Scan, sign in with Google, done. Status auto-classifies as present, late, or absent based on per-event time windows.
- **Roster-first model** — Members live in a `roster_members` table independent of auth. When someone signs up with a matching email, an auto-claim trigger links their account to historical records.
- **Historical import** — Past attendance from spreadsheets imports as real events (without QR tokens), so the analytics view shows one continuous timeline.
- **Attendance matrix** — Hover any cell for status + reason; admins click to add or edit notes. Notes persist via a server-side API.
- **Analytics dashboard** — Top attendees, least active, most-late-arrivals, on-time rate, and a per-event stacked bar.
- **Admin roster CRUD** — Add members, set emails to enable auto-claim, manually link a roster row to an existing profile, or delete.

## 🛠️ Tech Stack

<div align="center">

| Frontend | Backend | Deployment | CI & Tools |
|----------|---------|------------|-----------|
| [![Astro](https://img.shields.io/badge/Astro-FF5A5F?style=flat&logo=astro&logoColor=white)](https://astro.build) | [![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com) | [![Vercel](https://img.shields.io/badge/Vercel-black?style=flat&logo=vercel&logoColor=white)](https://vercel.com) | [![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088DA?style=flat&logo=githubactions&logoColor=white)](https://github.com/features/actions) |
| [![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=white)](https://react.dev) | [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org) | [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org) | [![Vitest](https://img.shields.io/badge/Vitest-6A9AE1?style=flat&logo=vitest&logoColor=white)](https://vitest.dev) |
| [![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com) | [![Zod](https://img.shields.io/badge/Zod-3E67B1?style=flat&logo=zod&logoColor=white)](https://zod.dev) | [![Vercel Astro](https://img.shields.io/badge/Vercel_Astro-000000?style=flat&logo=astro&logoColor=white)](https://vercel.com/docs/concepts/astro) | [![ESLint](https://img.shields.io/badge/ESLint-4B32E4?style=flat&logo=eslint&logoColor=white)](https://eslint.org) |

</div>

## 📋 Getting Started

### Prerequisites

- Node.js 24+ (Vercel runtime; `>=22.12` works locally for dev)
- A Supabase project ([create one](https://supabase.com/dashboard/projects))
- The Supabase CLI (`brew install supabase/tap/supabase`)

### 1. Setup Environment

```bash
cd /path/to/your/projects
```

### 2. Clone & Install

```bash
git clone https://github.com/michelle-zhuang/QRoll.git
```

```bash
cd QRoll
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

**Edit `.env`** with your Supabase project's API settings:

```env
PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # optional, server-only utilities
PUBLIC_APP_URL=http://localhost:4321
```

> **Security Note:** The anon key is intended to be public **only when row-level security is enabled**. Configure RLS policies before exposing the app publicly.

### 4. Apply Database Schema

```bash
supabase link --project-ref <project-ref>
supabase db push
```

This applies the production schema migrations:

- `20260520210000_roster_and_historical.sql` — roster, attendance updates, auto-claim trigger
- `20260520210001_seed_historical_data.sql` — 45 example roster members + 21 historical events + 566 attendance records (idempotent)

**For empty database:** Delete the seed migration before pushing.

### 5. Configure Authentication

In your Supabase Dashboard → Authentication → Providers → Google:

- Add your OAuth client ID and secret
- Set redirect URL to `http://localhost:4321/api/auth/callback` (and your Vercel URL for production)

### 6. Start Development

```bash
npm run dev
```

Visit [http://localhost:4321](http://localhost:4321) to experience the Active Canvas.

## 🏗️ Architecture

```mermaid
graph TD
    subgraph "Frontend Layer"
        A[Browser/QR Scanner] --> B[API Routes]
        B --> C[Layouts + Components]
        B --> D[SSR + React Islands]
    end
    
    subgraph "Backend Layer"
        D --> E[Astro Server]
        E --> F[Supabase API]
    end
    
    subgraph "Database Layer"
        F --> G[roster_members]
        F --> H[profiles]
        F --> I[events]
        F --> J[attendance]
    end
    
    subgraph "Integration Layer"
        G --> K[Auto-Claim Trigger]
        K --> H
        H --> K
    end

    style A fill:#2F2738,color:#FFFDF9
    style E fill:#D0F4DE,color:#2F2738
    style F fill:#E4C1F9,color:#2F2738
    style G fill:#FFFDF9,color:#2F2738
```

## 📁 Project Structure

```
.
├── .github/
│   ├── workflows/                # GitHub Actions
│   └── pull_request_template.md
├── .vercel/                      # Vercel config
├── docs/                         # Documentation
├── public/                       # Static assets
│   └── assets/                  # QRoll brand assets
├── src/
│   ├── components/              # React + Astro UI
│   ├── layouts/                 # Layout.astro with nav + auth context
│   ├── lib/                     # supabase client, time logic, attendance types
│   └── pages/                   # All Astro routes
│       ├── api/                 # Server endpoints
│       ├── admin/               # Event management
│       ├── checkin/             # QR scan landing pages
│       ├── dashboard.astro      # Analytics + matrix views
│       └── login.astro
├── supabase/
│   ├── migrations/              # Database migrations
│   └── config.toml             # Supabase config
├── styles/                      # CSS & design tokens
├── tsconfig.json               # TypeScript config
└── package.json                # Dependencies & scripts
```

## 🎨 Design System

The "Active Canvas" design system features:

- **Primary Color:** `#2F2738` (Eggplant Ink)
- **Secondary:** `#D0F4DE` (Fresh Mint)
- **Accent:** `#E4C1F9` (Soft Lavender)
- **Background:** `#FFFDF9` (Warm Milk)
- **Card BG:** `#FFFFFF` (Card White)
- **Border:** `#ECE6F2` (Pale Lilac)

**Key Design Rules:**
- Pill-shaped components with `12px` border-radius
- Generous spacing (`24px` padding on cards)
- Soft shadows (`Halo Glow` effect)
- System-based typography hierarchy

## 📊 Database Schema

### Core Tables Relationship

```mermaid
graph TD
    P[profiles] --> PM[roster_members]
    PM --> E[events]
    PM --> A[attendance]
    PM -.->|Auto-Claim| P
```

### Detailed Field Mapping

| **profiles** | **roster_members** | **events** | **attendance** |
|-------------|-------------------|------------|---------------|
| `id` | `id` | `id` | `id` |
| `email` | `email (unique)` | `title` | `status` |
| `full_name` | `full_name` | `starts_at` | `note` |
| `role` | `claimed_user_id` | `qr_token (nullable)` | `checked_in_at` |
| | `notes (nullable)` | `is_historical (bool)` | `ip_address` |
| | | `checkin_starts_at` | `user_agent` |
| | | `checkin_ends_at` |

### Schema Field Reference

```mermaid
graph LR
    P[profiles] --> PM[roster_members]
    subgraph "profiles Fields"
        P_id["id"]
        P_email["email"]
        P_name["full_name"]
        P_role["role"]
    end
    
    subgraph "roster_members Fields"
        PM_id["id"]
        PM_email["email (unique)"]
        PM_name["full_name"]
        PM_claimed["claimed_user_id"]
        PM_notes["notes"]
    end
    
    subgraph "events Fields"
        E_id["id"]
        E_title["title"]
        E_starts["starts_at"]
        E_qr["qr_token"]
        E_historical["is_historical"]
    end
    
    subgraph "attendance Fields"
        A_id["id"]
        A_status["status"]
        A_note["note"]
        A_checkin["checked_in_at"]
        A_ip["ip_address"]
    end
```

### Visual Schema Key

**profiles** - Eggplant Ink | **#2F2738**
**roster_members** - Warm Milk | **#FFFDF9**
**events** - Soft Lavender | **#E4C1F9**
**attendance** - Fresh Mint | **#D0F4DE**

## 🔄 Workflow Diagrams

### Check-in Flow

```mermaid
graph TD
    U[User scans QR code] --> A[QR Page loads]
    A --> B[User logs in]
    B --> C{Is member of roster?}
    C -->|Yes| D[Record attendance]
    C -->|No| E[Show onboarding]
    D --> F[Update status]
    F --> G[Show success]
    E --> G

    style U fill:#2F2738,color:#FFFDF9
    style D fill:#D0F4DE,color:#2F2738
    style E fill:#E4C1F9,color:#2F2738
    style G fill:#FFFDF9,color:#2F2738
```

### Admin Attendance Matrix

```mermaid
graph LR
    A[Attendance Table] --> B[Hover cell]
    B --> C[Show status + reason]
    A --> D[Click cell]
    D --> E[Edit note modal]
    E --> F[Save note]
    F --> A

    style A fill:#2F2738,color:#FFFDF9
    style B fill:#D0F4DE,color:#2F2738
    style D fill:#E4C1F9,color:#2F2738
    style E fill:#FFFDF9,color:#2F2738
```

## 🚀 Deployment

QRoll is production-ready on **Vercel**:

### CI/CD Pipeline

[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/michelle-zhuang/QRoll/ci.yml?branch=main&label=Build%20Status&color=blue)](https://github.com/michelle-zhuang/QRoll/actions/workflows/ci.yml)

**CI checks on every push/PR:**

- ✅ `astro check` — type errors block the merge
- ✅ `vitest run` — unit tests must pass
- ✅ `astro build` — build must succeed

### Vercel Configuration

The `vercel.json` file configures:

```json
{
  "framework": "astro",
  "buildCommand": "astro build",
  "outputDirectory": ".astro/server/output",
  "version": 3
}
```

### Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production releases |
| `preview` | Feature previews |
| Feature branches | Development work |

## 🤝 Contributing

[![GitHub Contributors](https://img.shields.io/github/contributors/michelle-zhuang/QRoll?style=flat-square&logo=github&logoColor=white)](https://github.com/michelle-zhuang/QRoll/graphs/contributors)

### Prerequisites

- [GitNexus](https://github.com/michelle-zhuang/QRoll/pkgs/gitnexus) - Code intelligence and impact analysis
- Node.js 24+
- Supabase CLI

### Code Quality

1. **Run impact analysis before any changes:**
   ```bash
   npx gitnexus impact --target "functionName"
   ```

2. **Run tests:**
   ```bash
   npm test
   ```

3. **Type checking:**
   ```bash
   npx astro check
   ```

### PR Process

The GitHub PR template includes a readiness checklist covering code, security, database, UI, and deployment aspects. Please ensure all items are completed before requesting review.

### Code Standards

- Follow the "Active Canvas" design system
- Maintain clean, readable code with TypeScript
- Write unit tests for new functionality
- Update documentation for new features

## 📄 License

<div align="center">

[MIT License](LICENSE)

© 2026 Michelle Zhuang

</div>

## 🔗 Quick Links

<div align="center">

[![GitHub Repo](https://img.shields.io/badge/View%20on%20GitHub-2B3137?style=for-the-badge&logo=github&logoColor=white)](https://github.com/michelle-zhuang/QRoll)
[![Documentation](https://img.shields.io/badge/Documentation-007AC9?style=for-the-badge&logo=markdown&logoColor=white)](https://github.com/michelle-zhuang/QRoll/wiki)
[![Releases](https://img.shields.io/badge/Releases-1D76DB?style=for-the-badge&logo=githubreleases&logoColor=white)](https://github.com/michelle-zhuang/QRoll/releases)
[![Issues](https://img.shields.io/badge/Issues-F29F05?style=for-the-badge&logo=githubissues&logoColor=white)](https://github.com/michelle-zhuang/QRoll/issues)

</div>

---

*Designed with ❤️ for the "Active Canvas" experience using QRoll's design system.*
