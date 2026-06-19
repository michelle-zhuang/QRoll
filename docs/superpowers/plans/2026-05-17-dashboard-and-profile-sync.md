# Dashboard and Profile Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a user dashboard and ensure profiles are automatically created on user signup.

**Architecture:** Use a Postgres trigger to sync auth users with the profiles table and create an Astro dashboard page protected by session checks.

**Tech Stack:** Astro, Supabase, Postgres

---

### Task 1: Add Profile Sync Trigger

**Files:**
- Modify: `supabase/migrations/20260517000000_init.sql`

- [ ] **Step 1: Append the trigger and function to the migration file**

```sql
-- Trigger to create profile on signup
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

- [ ] **Step 2: Verify migration file content**

Run: `cat supabase/migrations/20260517000000_init.sql`
Expected: The file should contain the new function and trigger at the end.

### Task 2: Create Dashboard Page

**Files:**
- Create: `src/pages/dashboard.astro`

- [ ] **Step 1: Create the dashboard file with session protection**

```html
---
import { createSupabaseClient } from '../lib/supabase';
const supabase = createSupabaseClient(Astro.cookies);
const { data: { session } } = await supabase.auth.getSession();
if (!session) return Astro.redirect('/login');

const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', session.user.id)
  .single();
---
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dashboard</title>
</head>
<body>
  <main class="max-w-4xl mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">Welcome, {profile?.full_name || profile?.email}</h1>
    <form action="/api/auth/signout" method="post">
      <button type="submit" class="text-red-600 hover:underline">Sign out</button>
    </form>
  </main>
</body>
</html>
```

- [ ] **Step 2: Verify file creation**

Run: `ls -l src/pages/dashboard.astro`
Expected: File exists.

### Task 3: Final Verification and Commit

- [ ] **Step 1: Run build to check for type errors**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 2: Commit changes**

```bash
git add src/pages/dashboard.astro supabase/migrations/20260517000000_init.sql
git commit -m "feat: add dashboard and profile sync"
```
