# Design Specification: Website Performance Tuning

* **Date:** 2026-06-21
* **Status:** Approved
* **Topic:** CPU Loop Optimization and Database Parallelization

---

## 1. Overview
This specification details the performance improvements implemented to optimize the page load speed (TTFB and CPU rendering time) of the QRoll website. 

The scope is constrained to immediate, high-impact latency optimizations:
1. **Intl.DateTimeFormat Caching & Hoisting:** Reusing expensive timezone formatter instances to lower CPU consumption during server-side list compilation.
2. **Sequential Query Elimination:** Combining separate, sequential database round-trips for authorization, settings, and views into parallelized `Promise.all` queries.
3. **Redundant Sync Call Elimination:** Removing an duplicate un-parameterized background sync execution on the event details page.

---

## 2. Detailed Technical Design

### 2.1. `Intl.DateTimeFormat` CPU Caching
We will create a global, JSON-key-based `Map` cache inside `src/lib/timeLogic.ts` to cache built formatters.

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

On `src/pages/dashboard.astro`, the `formatter` used inside the `events.forEach` loop is hoisted to the page-level scope to reuse a single instance:

```typescript
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

---

### 2.2. Page Routing & Database Query Parallelization
We consolidate database queries into parallel execution threads per page to minimize user latency under high database round-trip times.

#### A. Event Details (`src/pages/admin/events/[id]/index.astro`)
Parallelize authorization and event/roster/attendance loads, deleting the redundant un-parameterized `markAbsentForClosedEvents(supabase)` call at line 29.
```typescript
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

await markAbsentForClosedEvents(supabase, { roster, closedEvents: [event] });
```

#### B. Edit Event (`src/pages/admin/events/[id]/edit.astro`)
Parallelize role check and edit event load:
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

#### C. Admin Dashboard (`src/pages/admin/index.astro`)
Parallelize setting, profile, and events fetch:
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

#### D. Roster Management (`src/pages/admin/roster.astro`)
Parallelize profile, roster members list, and profiles link selection:
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

#### E. User Directory (`src/pages/admin/users.astro`)
Parallelize profile, profiles list, and pending invites:
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

---

## 3. Risks & Verification
* **Unique Constraints & Redirects:** Ensure redirects correctly execute after parallel calls return rather than during the pipeline execution (handled).
* **Test Verification:** Run the suite (`npm run test`) to ensure mock and logic functions are unchanged in behavior.
