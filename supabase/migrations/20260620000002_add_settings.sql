CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow select to everyone
CREATE POLICY "Allow read to everyone" ON public.app_settings
  FOR SELECT TO authenticated USING (true);

-- Allow all actions to admin
CREATE POLICY "Allow admin all access" ON public.app_settings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Insert default setting
INSERT INTO public.app_settings (key, value)
VALUES ('allow_member_dashboard', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;
