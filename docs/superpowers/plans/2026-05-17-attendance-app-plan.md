# Attendance App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack QR-based attendance web app with Astro SSR, Tailwind, React, and Supabase.

**Architecture:** Astro for SSR and routing, React/Tailwind for UI components, Supabase for PostgreSQL data and Auth. Pure logic (time validation) is extracted to testable TS functions.

**Tech Stack:** Astro, React, Tailwind CSS, Vitest, Supabase (JS client), Postgres.

---

### Task 1: Scaffold Project & Test Environment (COMPLETED)
### Task 2: Database Migrations Setup (COMPLETED)
### Task 3: Check-in Time Logic (Pure Functions) (COMPLETED)
### Task 4: UI Components & Auth Pages (COMPLETED)
### Task 5: Admin & Attendee Check-in Routes (COMPLETED)
### Task 6: Supabase Auth Integration (COMPLETED)
### Task 7: Dashboard and Profile Sync (COMPLETED)
### Task 8: Admin Event Management (COMPLETED)
### Task 9: Event Detail and QR Code (COMPLETED)

### Task 10: Attendee Check-in Flow

**Files:**
- Create: `src/pages/checkin/[token].astro` (update existing)

- [ ] **Step 1: Implement Check-in Page Logic**
Update `src/pages/checkin/[token].astro` to handle the actual check-in:
```html
---
import { createSupabaseClient } from '../../lib/supabase';
import { determineCheckinStatus } from '../../lib/timeLogic';
import Button from '../../components/Button';

const { token } = Astro.params;
const supabase = createSupabaseClient(Astro.cookies);

// 1. Get Session
const { data: { session } } = await supabase.auth.getSession();
if (!session) return Astro.redirect(`/login?next=/checkin/${token}`);

// 2. Fetch Event (use service role or admin client if RLS is too strict, 
// but here we assume anyone with token can read event or use a public RPC)
// For simplicity, we'll use the regular client.
const { data: event } = await supabase.from('events').select('*').eq('qr_token', token).single();
if (!event) return Astro.redirect('/404');

// 3. Check existing attendance
const { data: existing } = await supabase
  .from('attendance')
  .select('*')
  .eq('event_id', event.id)
  .eq('user_id', session.user.id)
  .single();

let message = '';
let success = !!existing;

if (Astro.request.method === 'POST' && !existing) {
  const { status } = determineCheckinStatus({
    now: new Date(),
    opens_at: new Date(event.checkin_opens_at),
    late_after: new Date(event.late_after_at),
    closes_at: new Date(event.checkin_closes_at)
  });

  if (status === 'not_open') {
    message = 'Check-in has not opened yet.';
  } else if (status === 'closed') {
    message = 'Check-in has closed.';
  } else {
    const ip = Astro.request.headers.get('x-forwarded-for') || Astro.clientAddress;
    const ua = Astro.request.headers.get('user-agent');
    
    const { error } = await supabase.from('attendance').insert({
      event_id: event.id,
      user_id: session.user.id,
      status: status,
      ip_address: ip,
      user_agent: ua
    });

    if (error) {
      message = error.message;
    } else {
      success = true;
      message = 'Attendance submitted successfully!';
    }
  }
}

// Current status for display
const currentStatus = determineCheckinStatus({
  now: new Date(),
  opens_at: new Date(event.checkin_opens_at),
  late_after: new Date(event.late_after_at),
  closes_at: new Date(event.checkin_closes_at)
});
---
<html lang="en">
<head><title>Check-in: {event.title}</title></head>
<body class="bg-gray-50">
  <main class="max-w-md mx-auto p-8 bg-white shadow mt-10 rounded text-center">
    <h1 class="text-2xl font-bold mb-4">{event.title}</h1>
    
    {success ? (
      <div class="bg-green-100 p-4 rounded text-green-800">
        <p class="font-bold">You are checked in!</p>
        {existing && <p class="text-sm">Recorded at {new Date(existing.checked_in_at).toLocaleTimeString()}</p>}
        {message && <p class="mt-2">{message}</p>}
        <a href="/dashboard" class="block mt-4 text-blue-600">Go to Dashboard</a>
      </div>
    ) : (
      <div>
        <p class="mb-6 text-gray-600">Click the button below to record your attendance for this event.</p>
        {message && <p class="text-red-600 mb-4">{message}</p>}
        
        {currentStatus.status === 'not_open' && <p class="text-orange-600">Check-in opens at {new Date(event.checkin_opens_at).toLocaleTimeString()}</p>}
        {currentStatus.status === 'closed' && <p class="text-red-600">Check-in closed at {new Date(event.checkin_closes_at).toLocaleTimeString()}</p>}
        
        {(currentStatus.status === 'on_time' || currentStatus.status === 'late') && (
          <form method="post">
            <Button type="submit" className="w-full py-4 text-xl">
              Submit Attendance
              {currentStatus.status === 'late' && <span class="block text-sm font-normal">(Late)</span>}
            </Button>
          </form>
        )}
      </div>
    )}
  </main>
</body>
</html>
```

- [ ] **Step 2: Commit**
`git add src/pages/checkin/ && git commit -m "feat: implement actual check-in flow"`
