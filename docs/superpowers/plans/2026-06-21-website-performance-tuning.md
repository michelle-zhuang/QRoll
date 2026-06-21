# Website Performance Tuning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve server-side rendering performance and load times by parallelizing database queries and caching/hoisting timezone-formatting CPU operations.

**Architecture:** We use caching for `Intl.DateTimeFormat` instances to prevent redundant CPU cycles. We parallelize database round-trips via `Promise.all` across admin pages to minimize wait latency.

**Tech Stack:** Astro, React, Supabase JS client, Vitest

## Global Constraints
- Target WCAG 2.1 AA text contrast (minimum 4.5:1).
- Respect user preference for reduced motion (`prefers-reduced-motion`).
- Avoid writing project code files to tmp, in the .gemini dir, or directly to the Desktop and similar folders.
- Always prefix shell commands with `rtk` to minimize token consumption.

---

### Task 1: Optimize Date/Time Formatting CPU Performance

**Files:**
- Modify: `src/lib/timeLogic.ts`
- Modify: `src/pages/dashboard.astro`
- Test: `src/lib/timeLogic.test.ts`

**Interfaces:**
- Consumes: None
- Produces: Optimized `formatInPacific` cache layer and hoisted `dashboard.astro` formatter

- [ ] **Step 1: Write a regression test verifying PT PT formatting**
  Verify existing PT helpers are covered in `src/lib/timeLogic.test.ts`.

- [ ] **Step 2: Run test suite to verify current state**
  Run: `rtk npm run test`
  Expected: PASS

- [ ] **Step 3: Modify `src/lib/timeLogic.ts` to implement cache map**
  Add a global `formatterCache` map and check/store `Intl.DateTimeFormat` instances in `formatInPacific`:
  ```typescript
  const formatterCache = new Map<string, Intl.DateTimeFormat>();

  export function formatInPacific(date: Date | string, options: Intl.DateTimeFormatOptions): string {
    const d = typeof date === "string" ? new Date(date) : date;
    const cacheKey = JSON.stringify(options);
    
    let formatter = formatterCache.get(cacheKey);
    if (!formatter) {
      formatter = new Intl.DateTimeFormat("en-US", {
        ...options,
        timeZone: PACIFIC_TIMEZONE,
      });
      formatterCache.set(cacheKey, formatter);
    }
    
    return formatter.format(d);
  }
  ```

- [ ] **Step 4: Modify `src/pages/dashboard.astro` to hoist loop formatter**
  In `src/pages/dashboard.astro:55-73`, hoist `new Intl.DateTimeFormat` out of the `forEach` loop:
  ```typescript
  // Map event_id -> ISO date (YYYY-MM-DD) using starts_at in America/Los_Angeles timezone
  const dateByEvent: Record<string, string> = {};
  const datesSet = new Set<string>();

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  events.forEach(e => {
    const d = new Date(e.starts_at);
    const parts = formatter.formatToParts(d);
    const year = parts.find(p => p.type === 'year')!.value;
    const month = parts.find(p => p.type === 'month')!.value;
    const day = parts.find(p => p.type === 'day')!.value;
    const localDateStr = `${year}-${month}-${day}`;

    dateByEvent[e.id] = localDateStr;
    datesSet.add(localDateStr);
  });
  ```

- [ ] **Step 5: Run tests to verify logic correctness**
  Run: `rtk npm run test`
  Expected: PASS

- [ ] **Step 6: Commit**
  ```bash
  rtk git add src/lib/timeLogic.ts src/pages/dashboard.astro
  rtk git commit -m "perf: cache Intl.DateTimeFormat instances and hoist formatter on dashboard"
  ```

---

### Task 2: Parallelize Queries and Remove Redundant Sync on Event Details Page

**Files:**
- Modify: `src/pages/admin/events/[id]/index.astro`

**Interfaces:**
- Consumes: Auth session and profile schemas
- Produces: consolidated parallel fetching block

- [ ] **Step 1: Check baseline compilation and page loading**
  Run: `rtk npm run test`
  Expected: PASS

- [ ] **Step 2: Modify `src/pages/admin/events/[id]/index.astro`**
  Modify file to parallelize the auth profile fetch, delete the redundant un-parameterized `await markAbsentForClosedEvents(supabase)` at line 29, and use the results of the unified `Promise.all` block.
  ```typescript
  // Fetch profile + event + attendance + roster in parallel to minimize sequential database calls!
  const [profileRes, eventRes, attendanceRes, rosterRes] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', session.user.id).single(),
    supabase.from('events').select('*').eq('id', id).single(),
    supabase.from('attendance').select('*, profiles(full_name, email), roster_members(full_name, email)').eq('event_id', id),
    supabase.from('roster_members').select('*')
  ]);

  const profile = profileRes.data;
  if (!profile || profile.role !== 'admin') {
    return Astro.redirect('/dashboard');
  }

  const event = eventRes.data;
  if (!event) return Astro.redirect('/admin');

  const roster = rosterRes.data || [];
  const rawAttendance = attendanceRes.data || [];

  // Background-sync the absent records with pre-fetched data
  await markAbsentForClosedEvents(supabase, { roster, closedEvents: [event] });
  ```

- [ ] **Step 3: Run tests**
  Run: `rtk npm run test`
  Expected: PASS

- [ ] **Step 4: Commit**
  ```bash
  rtk git add src/pages/admin/events/\[id\]/index.astro
  rtk git commit -m "perf: parallelize DB calls and remove redundant markAbsentForClosedEvents on event details page"
  ```

---

### Task 3: Parallelize Queries on Event Edit Page

**Files:**
- Modify: `src/pages/admin/events/[id]/edit.astro`

**Interfaces:**
- Consumes: None
- Produces: Consolidated parallel fetching block

- [ ] **Step 1: Modify `src/pages/admin/events/[id]/edit.astro`**
  Modify lines 18-20 and 49-50 to load profile and event information in parallel:
  ```typescript
  const [profileRes, eventRes] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', session.user.id).single(),
    supabase.from('events').select('*').eq('id', id).single()
  ]);

  const profile = profileRes.data;
  if (profile?.role !== 'admin') return Astro.redirect('/dashboard');

  const event = eventRes.data;
  if (!event) return Astro.redirect('/admin');
  ```

- [ ] **Step 2: Run tests**
  Run: `rtk npm run test`
  Expected: PASS

- [ ] **Step 3: Commit**
  ```bash
  rtk git add src/pages/admin/events/\[id\]/edit.astro
  rtk git commit -m "perf: parallelize profiles and events check in event edit page"
  ```

---

### Task 4: Parallelize Queries on Admin Event List Page

**Files:**
- Modify: `src/pages/admin/index.astro`

**Interfaces:**
- Consumes: None
- Produces: Consolidated parallel fetching block

- [ ] **Step 1: Modify `src/pages/admin/index.astro`**
  Modify lines 11-13, 24-28, and 31 to fetch in parallel:
  ```typescript
  const [profileRes, settingRes, eventsRes] = await Promise.all([
    supabase.from('profiles').select('role, full_name, email').eq('id', session.user.id).single(),
    supabase.from('app_settings').select('value').eq('key', 'allow_member_dashboard').maybeSingle(),
    supabase.from('events').select('*').order('created_at', { ascending: false })
  ]);

  const profile = profileRes.data;
  if (profile?.role !== 'admin') return Astro.redirect('/dashboard');

  const setting = settingRes?.data;
  const allowMemberDashboard = setting ? (setting.value === true || setting.value === 'true') : false;

  const events = eventsRes.data || [];
  ```

- [ ] **Step 2: Run tests**
  Run: `rtk npm run test`
  Expected: PASS

- [ ] **Step 3: Commit**
  ```bash
  rtk git add src/pages/admin/index.astro
  rtk git commit -m "perf: parallelize queries on admin event list dashboard"
  ```

---

### Task 5: Parallelize Queries on Roster Page

**Files:**
- Modify: `src/pages/admin/roster.astro`

**Interfaces:**
- Consumes: None
- Produces: Consolidated parallel fetching block

- [ ] **Step 1: Modify `src/pages/admin/roster.astro`**
  Modify lines 15-17 and 67-71 to query roster, profiles, and admin role check in parallel:
  ```typescript
  const [profileRes, rosterRes, profilesRes] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', session.user.id).single(),
    supabase.from('roster_members').select('*').order('full_name', { ascending: true }),
    supabase.from('profiles').select('id, email, full_name').order('full_name', { ascending: true })
  ]);

  const profile = profileRes.data;
  if (profile?.role !== 'admin') return Astro.redirect('/dashboard');

  const roster = rosterRes.data || [];
  const profiles = profilesRes.data || [];
  ```

- [ ] **Step 2: Run tests**
  Run: `rtk npm run test`
  Expected: PASS

- [ ] **Step 3: Commit**
  ```bash
  rtk git add src/pages/admin/roster.astro
  rtk git commit -m "perf: parallelize database fetches on admin roster page"
  ```

---

### Task 6: Parallelize Queries on User Directory Page

**Files:**
- Modify: `src/pages/admin/users.astro`

**Interfaces:**
- Consumes: None
- Produces: Consolidated parallel fetching block

- [ ] **Step 1: Modify `src/pages/admin/users.astro`**
  Modify lines 15-17 and 78-82 to parallelize profiles directory load:
  ```typescript
  const [profileRes, profilesRes, invitesRes] = await Promise.all([
    supabase.from('profiles').select('role, id').eq('id', session.user.id).single(),
    supabase.from('profiles').select('*').order('full_name', { ascending: true }),
    supabase.from('admin_invites').select('*').order('email', { ascending: true })
  ]);

  const profile = profileRes.data;
  if (profile?.role !== 'admin') return Astro.redirect('/dashboard');

  const profiles = profilesRes.data || [];
  const invites = invitesRes.data || [];
  ```

- [ ] **Step 2: Run tests**
  Run: `rtk npm run test`
  Expected: PASS

- [ ] **Step 3: Commit**
  ```bash
  rtk git add src/pages/admin/users.astro
  rtk git commit -m "perf: parallelize profiles and invites fetches on admin users directory page"
  ```
