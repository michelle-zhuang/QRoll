BEGIN;

-- 1. Define Helper Functions (SECURITY DEFINER to bypass RLS recursion)
CREATE OR REPLACE FUNCTION public.is_company_member(p_company_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = p_company_id
      AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_team_member(p_team_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = p_team_id
      AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Re-define is_company_admin just in case
CREATE OR REPLACE FUNCTION public.is_company_admin(p_company_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = p_company_id
      AND user_id = auth.uid()
      AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;


-- 2. Update Companies Policies
DROP POLICY IF EXISTS "Company admins can update company" ON public.companies;
CREATE POLICY "Company admins can update company" ON public.companies FOR UPDATE TO authenticated USING (is_company_admin(id));


-- 3. Update Company Members Policies
DROP POLICY IF EXISTS "Members can view own company members" ON public.company_members;
CREATE POLICY "Members can view own company members" ON public.company_members FOR SELECT TO authenticated USING (is_company_member(company_id));

DROP POLICY IF EXISTS "Company admins can manage members" ON public.company_members;
CREATE POLICY "Company admins can manage members" ON public.company_members FOR ALL TO authenticated USING (is_company_admin(company_id));


-- 4. Update Teams Policies
DROP POLICY IF EXISTS "Company admins can manage teams" ON public.teams;
CREATE POLICY "Company admins can manage teams" ON public.teams FOR ALL TO authenticated USING (is_company_admin(company_id));


-- 5. Update Team Members Policies
DROP POLICY IF EXISTS "Team members can view team roster" ON public.team_members;
CREATE POLICY "Team members can view team roster" ON public.team_members FOR SELECT TO authenticated USING (
  is_team_member(team_id) OR team_id IN (
    SELECT t.id FROM public.teams t WHERE is_company_admin(t.company_id)
  )
);

DROP POLICY IF EXISTS "Company admins can manage team members" ON public.team_members;
CREATE POLICY "Company admins can manage team members" ON public.team_members FOR ALL TO authenticated USING (
  team_id IN (
    SELECT t.id FROM public.teams t WHERE is_company_admin(t.company_id)
  )
);


-- 6. Update Events Policies
DROP POLICY IF EXISTS "Team members can view events" ON public.events;
CREATE POLICY "Team members can view events" ON public.events FOR SELECT TO authenticated USING (
  is_team_member(team_id) OR team_id IN (
    SELECT t.id FROM public.teams t WHERE is_company_admin(t.company_id)
  )
);

COMMIT;
