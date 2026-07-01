BEGIN;

-- Drop team wide attendance policy
DROP POLICY IF EXISTS "Team members can view team attendance" ON public.attendance;
DROP POLICY IF EXISTS "Admins can view all attendance, users can view own" ON public.attendance;

-- Create the restricted SELECT policy
CREATE POLICY "Admins can view all attendance, users can view own" 
  ON public.attendance FOR SELECT TO authenticated 
  USING (
    -- 1. Is global admin
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    OR
    -- 2. Is company admin for the event's team
    (SELECT team_id FROM public.events WHERE id = event_id) IN (
      SELECT t.id FROM public.teams t WHERE is_company_admin(t.company_id)
    )
    OR
    -- 3. Is the user's own attendance record (so they can verify checkin on the checkin page)
    user_id = auth.uid()
    OR
    team_member_id IN (SELECT id FROM public.team_members WHERE user_id = auth.uid())
  );

COMMIT;
