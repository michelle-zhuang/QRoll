# Attendance App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack QR-based attendance web app with Astro SSR, Tailwind, React, and Supabase.

**Architecture:** Astro for SSR and routing, React/Tailwind for UI components, Supabase for PostgreSQL data and Auth. Pure logic (time validation) is extracted to testable TS functions.

**Tech Stack:** Astro, React, Tailwind CSS, Vitest, Supabase (JS client), Postgres.

---

### Task 1: Scaffold Project & Test Environment

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`

- [ ] **Step 1: Scaffold Astro & Install Dependencies**
```bash
npm create astro@latest . -- --template basics --install no --yes
npm install @astrojs/react @astrojs/tailwind @astrojs/node tailwindcss react react-dom @supabase/supabase-js @supabase/ssr lucide-react framer-motion @tanstack/react-table qrcode
npm install -D vitest @testing-library/react jsdom
```

- [ ] **Step 2: Setup Vitest Config**
Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { environment: 'jsdom', include: ['src/**/*.test.ts', 'src/**/*.test.tsx'] },
});
```

- [ ] **Step 3: Update package.json Scripts**
Update `package.json` to include `"test": "vitest run"` in scripts.

- [ ] **Step 4: Configure Astro Integrations**
Modify `astro.config.mjs`:
```javascript
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import node from '@astrojs/node';
export default defineConfig({ output: 'server', adapter: node({ mode: "standalone" }), integrations: [tailwind(), react()] });
```

- [ ] **Step 5: Commit**
```bash
git add .
git commit -m "chore: scaffold astro project with react, tailwind, and vitest"
```

### Task 2: Database Migrations Setup

**Files:**
- Create: `supabase/migrations/20260517000000_init.sql`

- [ ] **Step 1: Create Supabase schema SQL file**
Create `supabase/migrations/20260517000000_init.sql`:
```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null, full_name text, role text not null default 'attendee', created_at timestamptz not null default now()
);
create table public.events (
  id uuid primary key default gen_random_uuid(), title text not null, description text,
  starts_at timestamptz not null, checkin_opens_at timestamptz not null,
  late_after_at timestamptz not null, checkin_closes_at timestamptz not null,
  qr_token text not null unique, created_by uuid references public.profiles(id), created_at timestamptz not null default now()
);
create table public.attendance (
  id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  checked_in_at timestamptz not null default now(), status text not null check (status in ('on_time', 'late')),
  ip_address text, user_agent text, created_at timestamptz not null default now(), unique(event_id, user_id)
);
```

- [ ] **Step 2: Commit**
```bash
git add supabase/ && git commit -m "db: add initial database migration script"
```

### Task 3: Check-in Time Logic (Pure Functions)

**Files:**
- Create: `src/lib/timeLogic.ts`, `src/lib/timeLogic.test.ts`

- [ ] **Step 1: Write test & implementation**
Create `src/lib/timeLogic.ts`:
```typescript
export type CheckinStatus = 'not_open' | 'on_time' | 'late' | 'closed';
interface TimingData { now: Date; opens_at: Date; late_after: Date; closes_at: Date; }
export function determineCheckinStatus({ now, opens_at, late_after, closes_at }: TimingData): { status: CheckinStatus } {
  if (now < opens_at) return { status: 'not_open' };
  if (now > closes_at) return { status: 'closed' };
  if (now > late_after) return { status: 'late' };
  return { status: 'on_time' };
}
```
Create `src/lib/timeLogic.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { determineCheckinStatus } from './timeLogic';
describe('determineCheckinStatus', () => {
  const opens = new Date('2026-05-17T10:00:00Z');
  const late = new Date('2026-05-17T10:15:00Z');
  const closes = new Date('2026-05-17T11:00:00Z');
  it('returns on_time', () => {
    expect(determineCheckinStatus({ now: new Date('2026-05-17T10:05:00Z'), opens_at: opens, late_after: late, closes_at: closes }).status).toBe('on_time');
  });
});
```

- [ ] **Step 2: Run test to verify it passes**
Run: `npm run test`
Expected: PASS

- [ ] **Step 3: Commit**
```bash
git add src/lib/timeLogic* && git commit -m "feat: add check-in time validation logic"
```

### Task 4: UI Components & Auth Pages

**Files:**
- Create: `src/components/Button.tsx`, `src/pages/login.astro`, `src/pages/api/auth/callback.ts`

- [ ] **Step 1: Write minimal Button component**
Create `src/components/Button.tsx`:
```tsx
import React from 'react';
export default function Button({ children, className = '', ...props }: any) {
  return <button className={`px-4 py-2 bg-blue-600 text-white rounded-md ${className}`} {...props}>{children}</button>;
}
```

- [ ] **Step 2: Create Login Page**
Create `src/pages/login.astro`:
```html
---
import Button from '../components/Button.tsx';
---
<html lang="en">
  <body>
    <main class="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 class="text-2xl font-bold mb-4">Login</h1>
      <form action="/api/auth/signin" method="post">
        <Button type="submit">Sign in with Google</Button>
      </form>
    </main>
  </body>
</html>
```

- [ ] **Step 3: Commit**
```bash
git add src/components/ src/pages/ && git commit -m "feat: add login page and button"
```

### Task 5: Admin & Attendee Check-in Routes

**Files:**
- Create: `src/pages/admin/index.astro`, `src/pages/checkin/[token].astro`

- [ ] **Step 1: Admin Dashboard mock**
Create `src/pages/admin/index.astro`:
```html
---
// Auth check will go here
---
<html><body><h1>Admin Dashboard</h1></body></html>
```

- [ ] **Step 2: Check-in Page mock**
Create `src/pages/checkin/[token].astro`:
```html
---
const { token } = Astro.params;
---
<html><body><h1>Check-in for {token}</h1></body></html>
```

- [ ] **Step 3: Commit**
```bash
git add src/pages/admin/ src/pages/checkin/ && git commit -m "feat: add mock admin and checkin pages"
```
