# Multi-Company/Team Architecture for QRoll — Revised Spec (v2)

## Overview

Force-migrate QRoll from a single-org attendance tracker to a multi-company/team model. No backward compatibility — the old `roster_members` table is dropped after data moves to `team_members`. The existing `events` and `attendance` tables evolve in-place with a new `team_id` column.

**Design decisions** (confirmed with user):
- **New tables**: `companies`, `company_members`, `teams`, `team_members` — then drop `roster_members`
- **In-place evolution**: `events` gets a `team_id` column (no separate `team_events` table)
- **Multi-team**: A person (email) can belong to multiple teams, even across companies
- **Seed data**: Existing data migrates to company="Party People", team="Season 1"
- **Admin model**: Any authenticated user can create a company; company admins create teams

---

## 1. Database Schema

### 1.1 New Tables

#### `companies` — top-level containers
```sql
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,  -- URL-safe identifier, no global name uniqueness
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX companies_slug_idx ON public.companies(slug);
```

#### `company_members` — who belongs to a company & their role
```sql
CREATE TABLE public.company_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, user_id)
);

CREATE INDEX company_members_company_id_idx ON public.company_members(company_id);
CREATE INDEX company_members_user_id_idx ON public.company_members(user_id);
```

> The company creator automatically gets `role = 'admin'`. Company admins can create teams and manage company-level settings.

#### `teams` — groups within a company, with an invite code
```sql
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  invite_code text NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, name)
);

CREATE INDEX teams_company_id_idx ON public.teams(company_id);
CREATE INDEX teams_invite_code_idx ON public.teams(invite_code);
```

> Renamed from `qr_code` → `invite_code` to distinguish from event-level QR tokens used for check-in.

#### `team_members` — roster entries, scoped to a team
```sql
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text,
  notes text,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, email)  -- same email can exist in different teams
);

CREATE INDEX team_members_team_id_idx ON public.team_members(team_id);
CREATE INDEX team_members_user_id_idx ON public.team_members(user_id);
CREATE INDEX team_members_email_idx ON public.team_members(email);
```

> `UNIQUE(team_id, email)` — NOT `UNIQUE(email)`. A person can be on multiple teams.

### 1.2 Evolve Existing Tables

#### `events` — add `team_id`
```sql
ALTER TABLE public.events
  ADD COLUMN team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE;

CREATE INDEX events_team_id_idx ON public.events(team_id);
```

> Events without a `team_id` are legacy/orphaned. After migration, all events will have a `team_id`.

#### `event_series` — add `team_id`
```sql
ALTER TABLE public.event_series
  ADD COLUMN team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE;

CREATE INDEX event_series_team_id_idx ON public.event_series(team_id);
```

#### `attendance` — rename FK column, re-point to `team_members`

The existing `attendance.roster_member_id` column currently references `roster_members(id)`. We need to:
1. Drop the old FK
2. Re-point it to `team_members(id)`
3. Rename the column to `team_member_id` for clarity

```sql
-- Drop old FK and constraint
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_roster_member_id_fkey;
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_event_roster_unique;

-- Rename column for clarity
ALTER TABLE public.attendance RENAME COLUMN roster_member_id TO team_member_id;

-- Add new FK
ALTER TABLE public.attendance
  ADD CONSTRAINT attendance_team_member_id_fkey
  FOREIGN KEY (team_member_id) REFERENCES public.team_members(id) ON DELETE CASCADE;

-- Restore uniqueness
ALTER TABLE public.attendance
  ADD CONSTRAINT attendance_event_team_member_unique
  UNIQUE (event_id, team_member_id);

CREATE INDEX attendance_team_member_id_idx ON public.attendance(team_member_id);
```

---

## 2. Data Migration

All migration runs inside a single transaction for atomicity.

```sql
BEGIN;

-- Step 1: Create the company
INSERT INTO public.companies (name, slug)
VALUES ('Party People', 'party-people')
RETURNING id AS company_id;
-- (capture this ID as :company_id)

-- Step 2: Create the team
INSERT INTO public.teams (company_id, name, invite_code)
VALUES (:company_id, 'Season 1', gen_random_uuid()::text)
RETURNING id AS team_id;
-- (capture this ID as :team_id)

-- Step 3: Copy roster_members → team_members
INSERT INTO public.team_members (id, team_id, full_name, email, notes, user_id, claimed_at, created_at)
SELECT
  id,            -- preserve UUIDs so attendance FK stays valid
  :team_id,
  full_name,
  email,
  notes,
  claimed_user_id,
  CASE WHEN claimed_user_id IS NOT NULL THEN now() END,
  created_at
FROM public.roster_members;

-- Step 4: Make existing admins into company admins
INSERT INTO public.company_members (company_id, user_id, role)
SELECT :company_id, id, 'admin'
FROM public.profiles
WHERE role = 'admin';

-- Step 5: Make claimed roster members into company members
INSERT INTO public.company_members (company_id, user_id, role)
SELECT DISTINCT :company_id, claimed_user_id, 'member'
FROM public.roster_members
WHERE claimed_user_id IS NOT NULL
  AND claimed_user_id NOT IN (SELECT id FROM public.profiles WHERE role = 'admin')
ON CONFLICT (company_id, user_id) DO NOTHING;

-- Step 6: Add team_id to existing events
UPDATE public.events SET team_id = :team_id;

-- Step 7: Add team_id to existing event_series
UPDATE public.event_series SET team_id = :team_id;

-- Step 8: Re-point attendance FK
-- Since we preserved roster_members.id → team_members.id, the UUID values match.
-- We just need to rename the column and re-add the FK (done in schema step above).

-- Step 9: Drop old table
DROP TABLE public.roster_members CASCADE;

-- Step 10: Make team_id NOT NULL now that all data is migrated
ALTER TABLE public.events ALTER COLUMN team_id SET NOT NULL;
ALTER TABLE public.event_series ALTER COLUMN team_id SET NOT NULL;

COMMIT;
```

> **Key insight**: By preserving the `id` values from `roster_members` into `team_members`, the existing `attendance.roster_member_id` (→ `team_member_id`) values remain valid without any attendance row updates.

---

## 3. Auto-Claim Trigger Update

Replace `handle_profile_claim()` to target `team_members` instead of `roster_members`:

```sql
CREATE OR REPLACE FUNCTION public.handle_profile_claim()
RETURNS trigger AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    UPDATE public.team_members
    SET user_id = NEW.id,
        claimed_at = now()
    WHERE email = NEW.email AND user_id IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

> This auto-claims across ALL teams — if the same email exists in 3 teams, all 3 get claimed. This is correct for multi-team membership.

---

## 4. RLS Policies

### Companies
```sql
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can browse companies
CREATE POLICY "Anyone can view companies"
  ON public.companies FOR SELECT TO authenticated USING (true);

-- Any authenticated user can create a company
CREATE POLICY "Authenticated users can create companies"
  ON public.companies FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Company admins can update their company
CREATE POLICY "Company admins can update company"
  ON public.companies FOR UPDATE TO authenticated
  USING (id IN (
    SELECT company_id FROM public.company_members
    WHERE user_id = auth.uid() AND role = 'admin'
  ));
```

### Company Members
```sql
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

-- Members can see who's in their companies
CREATE POLICY "Members can view own company members"
  ON public.company_members FOR SELECT TO authenticated
  USING (company_id IN (
    SELECT company_id FROM public.company_members WHERE user_id = auth.uid()
  ));

-- Company admins can manage members
CREATE POLICY "Company admins can manage members"
  ON public.company_members FOR ALL TO authenticated
  USING (company_id IN (
    SELECT company_id FROM public.company_members
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Users can insert themselves (for joining)
CREATE POLICY "Users can join companies"
  ON public.company_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND role = 'member');
```

### Teams
```sql
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Anyone can view teams (needed for invite code lookup in join flow)
CREATE POLICY "Anyone can view teams"
  ON public.teams FOR SELECT TO authenticated
  USING (true);

-- Company admins can manage teams
CREATE POLICY "Company admins can manage teams"
  ON public.teams FOR ALL TO authenticated
  USING (company_id IN (
    SELECT company_id FROM public.company_members
    WHERE user_id = auth.uid() AND role = 'admin'
  ));
```

### Team Members
```sql
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Team members can view their team's roster; company admins can view all team rosters
CREATE POLICY "Team members can view team roster"
  ON public.team_members FOR SELECT TO authenticated
  USING (team_id IN (
    SELECT tm.team_id FROM public.team_members tm WHERE tm.user_id = auth.uid()
  ) OR team_id IN (
    SELECT t.id FROM public.teams t
    JOIN public.company_members cm ON cm.company_id = t.company_id
    WHERE cm.user_id = auth.uid() AND cm.role = 'admin'
  ));

-- Company admins can manage team members
CREATE POLICY "Company admins can manage team members"
  ON public.team_members FOR ALL TO authenticated
  USING (team_id IN (
    SELECT t.id FROM public.teams t
    JOIN public.company_members cm ON cm.company_id = t.company_id
    WHERE cm.user_id = auth.uid() AND cm.role = 'admin'
  ));

-- Users can self-claim (update their own unclaimed entry)
CREATE POLICY "Users can claim team members"
  ON public.team_members FOR UPDATE TO authenticated
  USING (user_id IS NULL OR user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can self-insert (onboarding flow)
CREATE POLICY "Users can insert and self-claim team members"
  ON public.team_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
```

### Events / Attendance — update existing policies
```sql
-- Events: scope to team membership
DROP POLICY IF EXISTS "Anyone can view events" ON public.events;
CREATE POLICY "Team members can view events"
  ON public.events FOR SELECT TO authenticated
  USING (team_id IN (
    SELECT tm.team_id FROM public.team_members tm WHERE tm.user_id = auth.uid()
  ) OR team_id IN (
    SELECT t.id FROM public.teams t
    JOIN public.company_members cm ON cm.company_id = t.company_id
    WHERE cm.user_id = auth.uid() AND cm.role = 'admin'
  ));

-- Attendance: update FK column name in policies
DROP POLICY IF EXISTS "Users can view own attendance" ON public.attendance;
CREATE POLICY "Users can view own attendance"
  ON public.attendance FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    team_member_id IN (SELECT id FROM public.team_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own attendance" ON public.attendance;
CREATE POLICY "Users can insert own attendance"
  ON public.attendance FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    team_member_id IN (SELECT id FROM public.team_members WHERE user_id = auth.uid())
  );
```

---

## 5. Updated `is_admin()` Helper

The global `is_admin()` function should be supplemented with a company-scoped check:

```sql
-- Add company-scoped helper
CREATE OR REPLACE FUNCTION public.is_company_admin(p_company_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = p_company_id
      AND user_id = auth.uid()
      AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

---

## 6. API Endpoints

### Existing (updated)
| Endpoint | Change |
|----------|--------|
| `GET /api/events` | Filter by user's teams via `team_id` |
| `POST /api/roster/link` | → Rename to `/api/team-members/link`, target `team_members` |
| `POST /api/attendance/note` | Update column name `roster_member_id` → `team_member_id` |

### New
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/companies` | GET | authenticated | List companies user belongs to |
| `/api/companies` | POST | authenticated | Create company (creator becomes admin) |
| `/api/companies/:slug/teams` | GET | company member | List teams in company |
| `/api/companies/:slug/teams` | POST | company admin | Create team |
| `/api/teams/join/:invite_code` | POST | authenticated | Join team via invite code |
| `/api/user/teams` | GET | authenticated | Get all teams user belongs to |

### Request/Response shapes

**POST `/api/companies`**
```json
// Request
{ "name": "Party People" }
// → slug auto-generated from name

// Response 201
{ "id": "uuid", "name": "Party People", "slug": "party-people" }
```

**POST `/api/companies/:slug/teams`**
```json
// Request
{ "name": "Season 1" }

// Response 201
{ "id": "uuid", "name": "Season 1", "invite_code": "abc-123-..." }
```

**POST `/api/teams/join/:invite_code`**
```json
// Response 200
{ "team": { "id": "uuid", "name": "Season 1" }, "company": { "name": "Party People" } }
// Side effects: creates team_members entry + company_members entry if not exists
```

---

## 7. Frontend Code Changes — Blast Radius

### Files requiring changes (13 files)

| File | Changes Needed |
|------|---------------|
| `src/lib/supabase.ts` | Update mock client: `roster_members` → `team_members`, add `companies`/`teams` mocks. Update auto-claim to target `team_members`. Role checks become company-scoped. |
| `src/lib/onboarding.ts` | All 4 functions: `roster_members` → `team_members`. Add `team_id` parameter. |
| `src/pages/admin/roster.astro` | `roster_members` → `team_members` (5 queries). Add team context/selector. Admin guard: company admin check. |
| `src/pages/admin/events/[id]/index.astro` | Join: `roster_members(...)` → `team_members(...)`. Admin guard: company admin. |
| `src/pages/admin/events/index.astro` | Filter events by `team_id`. Admin guard: company admin. |
| `src/pages/dashboard.astro` | `roster_members` → `team_members`. Filter by team. `isAdmin` → company admin check. |
| `src/pages/checkin/[token].astro` | `roster_members` → `team_members`. |
| `src/pages/api/roster/link.ts` | Rename to `api/team-members/link.ts`. `roster_members` → `team_members`. |
| `src/pages/api/attendance/note.ts` | Column rename: `roster_member_id` → `team_member_id`. |
| `src/components/CreateEventForm.tsx` | Add `team_id` to event insert. |
| `src/layouts/Layout.astro` | Role check: company-scoped admin. Add team/company context to nav. |
| `src/pages/login.astro` | Post-login redirect: check team membership, route to team selector if multi-team. |
| `import_attendance.js` | `roster_members` → `team_members`. Add `team_id` to events. |

### New pages/components needed

| Component | Purpose |
|-----------|---------|
| `pages/companies/index.astro` | Browse/create companies |
| `pages/companies/[slug]/index.astro` | Company detail — list teams |
| `pages/teams/join/[code].astro` | Join team via invite link |
| `components/CompanySelector.tsx` | Company/team picker (nav dropdown) |
| `components/TeamSelector.tsx` | Team switcher within a company |

---

## 8. User Experience Flow

### New User
```
Landing → Sign in with Google → No team memberships
  → "Join a team" (enter invite code / scan QR)
  → OR "Create a company" → Create first team
  → Team dashboard (events, roster, check-in)
```

### Existing User (post-migration)
```
Sign in → Auto-claimed to "Party People" / "Season 1"
  → Team dashboard shows existing events + attendance
  → Can join additional teams via invite codes
```

### Admin
```
Company admin (per-company, not global)
  → Create teams within their company
  → Manage team rosters
  → Create events scoped to a team
  → View attendance matrix per team
```

---

## 9. Migration Checklist

> **Warning**: The `roster_members` table is **dropped** at the end of migration. This is irreversible. Take a database backup before running.

- [ ] Backup database
- [ ] Run migration SQL in transaction
- [ ] Verify `team_members` row count matches old `roster_members` count
- [ ] Verify all `attendance` rows have valid `team_member_id` FK
- [ ] Verify all `events` have `team_id` set
- [ ] Update auto-claim trigger
- [ ] Deploy updated RLS policies
- [ ] Deploy updated frontend code
- [ ] Test check-in flow end-to-end
- [ ] Test attendance matrix loads correctly
- [ ] Verify admin pages work with company-scoped permissions

---

## 10. What's NOT Changing

- `profiles` table — unchanged
- `attendance` table — columns evolve, table stays
- `events` table — gains `team_id`, otherwise identical
- `event_series` table — gains `team_id`, otherwise identical
- `app_settings` table — unchanged (company-scoping is Phase 2)
- `admin_invites` table — unchanged (still works for bootstrapping admins)
- Check-in flow — QR token → event lookup → attendance insert (same, just team-scoped)
- Geofencing columns — preserved on `events` and `attendance`

---

*Revised: 2026-06-30*
*Status: Ready for implementation planning*
*Next step: Execute with writing-plans skill*
