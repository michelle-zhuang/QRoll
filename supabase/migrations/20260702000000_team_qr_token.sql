-- Add a persistent check-in QR token to each team.
-- This token never changes when events are edited, giving each team one stable QR code
-- that always resolves to whichever event is currently active for that team.

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS qr_token text UNIQUE DEFAULT gen_random_uuid()::text;

-- Back-fill any rows that might be NULL (shouldn't happen with DEFAULT, but safety net)
UPDATE public.teams SET qr_token = gen_random_uuid()::text WHERE qr_token IS NULL;

ALTER TABLE public.teams ALTER COLUMN qr_token SET NOT NULL;

CREATE INDEX IF NOT EXISTS teams_qr_token_idx ON public.teams(qr_token);
