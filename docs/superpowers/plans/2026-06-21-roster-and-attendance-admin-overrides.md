# Roster & Attendance Admin Overrides & Role Promotion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow admins to manually override attendance status (present, late, absent, none) for any member/session, and manage administrative accounts by inviting new admin emails or promoting existing profiles.

**Architecture:** Extend the existing Astro API endpoint `/api/attendance/note.ts` to accept status overrides (including deleting the attendance row on "none"). Update the matrix React component's cell modal to support status changes. Add a new migration for `admin_invites` and signup auto-promotion, and create a `/admin/users` management page.

**Tech Stack:** Astro, React, Supabase PostgreSQL, Tailwind CSS

## Global Constraints
- Target WCAG 2.1 AA text contrast (minimum 4.5:1).
- Use QRoll styling tokens: Eggplant Ink (`#2F2738`), Warm Milk background (`#FFFDF9`), Fresh Mint (`#D0F4DE`), Soft Lavender (`#E4C1F9`), Pale Lilac (`#F5EFFA`), Muted Grape (`#6B6377`).
- All interactive elements must have at least an 8px corner radius.

---

### Task 1: Database Migration for Invites and Signup Auto-Promotion

**Files:**
- Create: `supabase/migrations/20260621000000_admin_invites.sql`

- [ ] **Step 1: Create SQL migration file**
  Create the migration containing the `admin_invites` table and updating `public.handle_new_user()` trigger:
  ```sql
  -- Create admin_invites table
  create table public.admin_invites (
    email text primary key,
    created_at timestamptz not null default now()
  );

  -- Enable RLS and setup policies
  alter table public.admin_invites enable row level security;

  create policy "Admins can manage admin invites" on public.admin_invites
    for all to authenticated using (public.is_admin());

  -- Update trigger to handle new user signup checks
  create or replace function public.handle_new_user()
  returns trigger as $$
  declare
    is_invited_admin boolean;
  begin
    select exists (
      select 1 from public.admin_invites where email = new.email
    ) into is_invited_admin;

    insert into public.profiles (id, email, full_name, role)
    values (
      new.id,
      new.email,
      new.raw_user_meta_data->>'full_name',
      case when is_invited_admin then 'admin' else 'attendee' end
    );

    if is_invited_admin then
      delete from public.admin_invites where email = new.email;
    end if;

    return new;
  end;
  $$ language plpgsql security definer;
  ```

- [ ] **Step 2: Commit migration**
  ```bash
  git add supabase/migrations/20260621000000_admin_invites.sql
  git commit -m "db: add admin_invites table and update handle_new_user signup trigger"
  ```

---

### Task 2: Update Attendance Note API Endpoint to Support Status Overrides

**Files:**
- Modify: `src/pages/api/attendance/note.ts`

- [ ] **Step 1: Implement status update support**
  Modify `/src/pages/api/attendance/note.ts` to accept `status` in the body payload. If status is `'none'`, delete the row. If not, upsert it.
  ```typescript
  import type { APIRoute } from 'astro';
  import { createSupabaseClient } from '../../../lib/supabase';
  import { fromZonedTime } from 'date-fns-tz';

  export const POST: APIRoute = async ({ request, cookies }) => {
    const supabase = createSupabaseClient(cookies);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return new Response('Unauthorized', { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
    if (profile?.role !== 'admin') return new Response('Forbidden', { status: 403 });

    let body: any;
    try {
      body = await request.json();
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }

    const { roster_member_id, date, note, status } = body || {};
    if (!roster_member_id || !date) {
      return new Response('Missing roster_member_id or date', { status: 400 });
    }

    const TZ = 'America/Los_Angeles';
    const dayStart = fromZonedTime(`${date}T00:00:00`, TZ).toISOString();
    const dayEnd = fromZonedTime(`${date}T23:59:59.999`, TZ).toISOString();

    const { data: events } = await supabase
      .from('events')
      .select('id')
      .gte('starts_at', dayStart)
      .lte('starts_at', dayEnd)
      .order('starts_at', { ascending: true });

    if (!events || events.length === 0) {
      return new Response('No event found for that date', { status: 404 });
    }

    const eventId = events[0].id;
    const noteValue = typeof note === 'string' ? note.trim() : '';

    const { data: existing } = await supabase
      .from('attendance')
      .select('id')
      .eq('event_id', eventId)
      .eq('roster_member_id', roster_member_id)
      .maybeSingle();

    if (status === 'none') {
      if (existing) {
        const { error } = await supabase
          .from('attendance')
          .delete()
          .eq('id', existing.id);
        if (error) return new Response(error.message, { status: 500 });
      }
    } else {
      const targetStatus = status || 'present';
      if (existing) {
        const { error } = await supabase
          .from('attendance')
          .update({ 
            note: noteValue || null,
            status: targetStatus
          })
          .eq('id', existing.id);
        if (error) return new Response(error.message, { status: 500 });
      } else {
        const { error } = await supabase
          .from('attendance')
          .insert({
            event_id: eventId,
            roster_member_id,
            status: targetStatus,
            note: noteValue || null,
            checked_in_at: dayStart,
          });
        if (error) return new Response(error.message, { status: 500 });
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  ```

- [ ] **Step 2: Commit API changes**
  ```bash
  git add src/pages/api/attendance/note.ts
  git commit -m "feat: add support for status overrides and deletions in attendance note API"
  ```

---

### Task 3: Upgrade Attendance Matrix Editor component

**Files:**
- Modify: `src/components/AttendanceMatrix.tsx`

- [ ] **Step 1: Add status override options inside editor dialog modal**
  Open `/src/components/AttendanceMatrix.tsx`. Modify the component:
  1. Add a status selector state inside the editor dialog.
  2. In `onCellClick`, set the status draft: `setDraftStatus(rec?.status || 'none')`.
  3. In `persistNote`, include the status: `body: JSON.stringify({ roster_member_id: memberId, date, note: trimmed, status: selectedStatus })`.
  4. Render status selector buttons styled with corresponding state colors (mint, amber, rose).
  Modify `persistNote` function signature and implementation:
  ```typescript
  const persistNote = async (name: string, date: string, value: string, selectedStatus: string) => {
    const k = noteKey(name, date);
    const trimmed = value.trim();
    
    if (usingRemote && noteApiUrl) {
      const memberId = memberByName[name];
      if (!memberId) return;
      try {
        setSaving(true);
        const res = await fetch(noteApiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roster_member_id: memberId, date, note: trimmed, status: selectedStatus }),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to save note");
        }
      } finally {
        setSaving(false);
      }
    }
  };
  ```
  Render the status selection section inside `renderEditor`:
  ```jsx
  const [draftStatus, setDraftStatus] = useState<string>("none");

  // Inside onCellClick:
  setDraftStatus(rec?.status || "none");

  // Inside renderEditor status buttons grid:
  <div className="grid grid-cols-4 gap-2 mb-4">
    {["present", "late", "absent", "none"].map(s => (
      <button
        key={s}
        type="button"
        onClick={() => setDraftStatus(s)}
        className={cn(
          "flex flex-col items-center justify-center py-2.5 rounded-2xl border text-xs font-semibold cursor-pointer transition-all",
          draftStatus === s 
            ? s === "present" ? "border-emerald-500 bg-emerald-50 text-emerald-700"
              : s === "late" ? "border-amber-500 bg-amber-50 text-amber-700"
              : s === "absent" ? "border-rose-500 bg-rose-50 text-rose-700"
              : "border-foreground bg-muted text-foreground"
            : "border-border bg-card text-muted-foreground hover:bg-muted/40"
        )}
      >
        <span className={cn(
          "w-2.5 h-2.5 rounded-full mb-1",
          s === "present" ? "bg-emerald-500" :
          s === "late" ? "bg-amber-500" :
          s === "absent" ? "bg-rose-500" : "bg-muted-foreground"
        )} />
        {s === "none" ? "N/A Clear" : s.charAt(0).toUpperCase() + s.slice(1)}
      </button>
    ))}
  </div>
  ```

- [ ] **Step 2: Commit matrix component changes**
  ```bash
  git add src/components/AttendanceMatrix.tsx
  git commit -m "feat: upgrade attendance matrix cell dialog to support status override selectors"
  ```

---

### Task 4: Add Admins & Users Management Interface

**Files:**
- Create: `src/pages/admin/users.astro`
- Modify: `src/components/ui/Navbar.tsx`

- [ ] **Step 1: Create user/role management admin page**
  Create `/src/pages/admin/users.astro` with role check and functionality to:
  1. Add/invite email address to `admin_invites`.
  2. Toggle role (`admin` or `attendee`) of registered `profiles` users.
  3. Demote other admins (ensuring the current admin cannot demote themselves to avoid locking).
  4. Display pending admin invites with a revoke option.
  
- [ ] **Step 2: Update Navbar component links**
  Modify `/src/components/ui/Navbar.tsx` to add a new link to the user/admin management page for admins:
  ```typescript
  // Inside Navbar links array definition:
  ...(role === "admin" ? [
    { href: "/admin", label: "Events" },
    { href: "/admin/roster", label: "Roster" },
    { href: "/admin/users", label: "Staff & Admins" }
  ] : [])
  ```

- [ ] **Step 3: Commit administration view and navigation updates**
  ```bash
  git add src/pages/admin/users.astro src/components/ui/Navbar.tsx
  git commit -m "feat: implement staff & admins directory page and nav links"
  ```
