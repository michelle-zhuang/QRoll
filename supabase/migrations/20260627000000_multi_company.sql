BEGIN;

-- 1. Create New Tables
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX companies_slug_idx ON public.companies(slug);

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

CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text,
  notes text,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, email)
);
CREATE INDEX team_members_team_id_idx ON public.team_members(team_id);
CREATE INDEX team_members_user_id_idx ON public.team_members(user_id);
CREATE INDEX team_members_email_idx ON public.team_members(email);

-- 2. Modify Existing Tables
ALTER TABLE public.events ADD COLUMN team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE;
CREATE INDEX events_team_id_idx ON public.events(team_id);

ALTER TABLE public.event_series ADD COLUMN team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE;
CREATE INDEX event_series_team_id_idx ON public.event_series(team_id);

-- Drop old attendance constraints
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_roster_member_id_fkey;
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_event_roster_unique;
ALTER TABLE public.attendance RENAME COLUMN roster_member_id TO team_member_id;
CREATE INDEX IF NOT EXISTS attendance_team_member_id_idx ON public.attendance(team_member_id);

-- 3. Data Migration
DO $$
DECLARE
  v_company_id uuid;
  v_team_id uuid;
BEGIN
  -- Create company
  INSERT INTO public.companies (name, slug)
  VALUES ('Party People', 'party-people')
  RETURNING id INTO v_company_id;

  -- Create team
  INSERT INTO public.teams (company_id, name, invite_code)
  VALUES (v_company_id, 'Season 1', gen_random_uuid()::text)
  RETURNING id INTO v_team_id;

  -- Copy roster_members -> team_members (preserving ID)
  INSERT INTO public.team_members (id, team_id, full_name, email, notes, user_id, claimed_at, created_at)
  SELECT
    id,
    v_team_id,
    full_name,
    email,
    notes,
    claimed_user_id,
    CASE WHEN claimed_user_id IS NOT NULL THEN now() END,
    created_at
  FROM public.roster_members;

  -- Make existing admins into company admins
  INSERT INTO public.company_members (company_id, user_id, role)
  SELECT v_company_id, id, 'admin'
  FROM public.profiles
  WHERE role = 'admin'
  ON CONFLICT (company_id, user_id) DO NOTHING;

  -- Make claimed roster members into company members
  INSERT INTO public.company_members (company_id, user_id, role)
  SELECT DISTINCT v_company_id, claimed_user_id, 'member'
  FROM public.roster_members
  WHERE claimed_user_id IS NOT NULL
    AND claimed_user_id NOT IN (SELECT id FROM public.profiles WHERE role = 'admin')
  ON CONFLICT (company_id, user_id) DO NOTHING;

  -- Link events
  UPDATE public.events SET team_id = v_team_id;
  UPDATE public.event_series SET team_id = v_team_id;

END $$;

-- 4. Apply New Constraints & Clean Up
ALTER TABLE public.attendance
  ADD CONSTRAINT attendance_team_member_id_fkey
  FOREIGN KEY (team_member_id) REFERENCES public.team_members(id) ON DELETE CASCADE;

ALTER TABLE public.attendance
  ADD CONSTRAINT attendance_event_team_member_unique
  UNIQUE (event_id, team_member_id);

ALTER TABLE public.events ALTER COLUMN team_id SET NOT NULL;
ALTER TABLE public.event_series ALTER COLUMN team_id SET NOT NULL;

DROP TABLE public.roster_members CASCADE;

-- 5. Helper & Triggers
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

CREATE OR REPLACE FUNCTION public.is_company_admin(p_company_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = p_company_id
      AND user_id = auth.uid()
      AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 6. RLS Policies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view companies" ON public.companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create companies" ON public.companies FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Company admins can update company" ON public.companies FOR UPDATE TO authenticated USING (id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid() AND role = 'admin'));

ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view own company members" ON public.company_members FOR SELECT TO authenticated USING (company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid()));
CREATE POLICY "Company admins can manage members" ON public.company_members FOR ALL TO authenticated USING (company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users can join companies" ON public.company_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND role = 'member');

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view teams" ON public.teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Company admins can manage teams" ON public.teams FOR ALL TO authenticated USING (company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid() AND role = 'admin'));

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team members can view team roster" ON public.team_members FOR SELECT TO authenticated USING (team_id IN (SELECT tm.team_id FROM public.team_members tm WHERE tm.user_id = auth.uid()) OR team_id IN (SELECT t.id FROM public.teams t JOIN public.company_members cm ON cm.company_id = t.company_id WHERE cm.user_id = auth.uid() AND cm.role = 'admin'));
CREATE POLICY "Company admins can manage team members" ON public.team_members FOR ALL TO authenticated USING (team_id IN (SELECT t.id FROM public.teams t JOIN public.company_members cm ON cm.company_id = t.company_id WHERE cm.user_id = auth.uid() AND cm.role = 'admin'));
CREATE POLICY "Users can claim team members" ON public.team_members FOR UPDATE TO authenticated USING (user_id IS NULL OR user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can insert and self-claim team members" ON public.team_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can view events" ON public.events;
CREATE POLICY "Team members can view events" ON public.events FOR SELECT TO authenticated USING (team_id IN (SELECT tm.team_id FROM public.team_members tm WHERE tm.user_id = auth.uid()) OR team_id IN (SELECT t.id FROM public.teams t JOIN public.company_members cm ON cm.company_id = t.company_id WHERE cm.user_id = auth.uid() AND cm.role = 'admin'));

DROP POLICY IF EXISTS "Users can view own attendance" ON public.attendance;
CREATE POLICY "Users can view own attendance" ON public.attendance FOR SELECT TO authenticated USING (user_id = auth.uid() OR team_member_id IN (SELECT id FROM public.team_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert own attendance" ON public.attendance;
CREATE POLICY "Users can insert own attendance" ON public.attendance FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR team_member_id IN (SELECT id FROM public.team_members WHERE user_id = auth.uid()));

COMMIT;
