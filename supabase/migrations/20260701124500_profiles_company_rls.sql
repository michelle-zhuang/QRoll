BEGIN;

-- Drop policy if it already exists
DROP POLICY IF EXISTS "Company members can view profiles of other company members" ON public.profiles;

-- Create the policy
CREATE POLICY "Company members can view profiles of other company members"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT user_id FROM public.company_members WHERE company_id IN (
        SELECT company_id FROM public.company_members WHERE user_id = auth.uid()
      )
    )
  );

COMMIT;
