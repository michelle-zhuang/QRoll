BEGIN;

-- Drop old attendance policies
DROP POLICY IF EXISTS "Users can view own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users can insert own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Team members can view team attendance" ON public.attendance;
DROP POLICY IF EXISTS "Company admins can manage attendance" ON public.attendance;

-- Create new RLS policies for attendance
CREATE POLICY "Team members can view team attendance" 
  ON public.attendance FOR SELECT TO authenticated 
  USING (
    is_team_member((SELECT team_id FROM public.events WHERE id = event_id))
    OR
    (SELECT team_id FROM public.events WHERE id = event_id) IN (
      SELECT t.id FROM public.teams t WHERE is_company_admin(t.company_id)
    )
  );

CREATE POLICY "Users can insert own attendance" 
  ON public.attendance FOR INSERT TO authenticated 
  WITH CHECK (
    user_id = auth.uid() 
    OR 
    team_member_id IN (SELECT id FROM public.team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Company admins can manage attendance" 
  ON public.attendance FOR ALL TO authenticated 
  USING (
    (SELECT team_id FROM public.events WHERE id = event_id) IN (
      SELECT t.id FROM public.teams t WHERE is_company_admin(t.company_id)
    )
  );

COMMIT;
