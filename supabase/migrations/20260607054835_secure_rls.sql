-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.attendance enable row level security;
alter table public.roster_members enable row level security;
alter table public.event_series enable row level security;

-- Helper function to check admin status
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer;

-- PROFILES
create policy "Users can view own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Admins can view all profiles" on public.profiles for select to authenticated using (public.is_admin());
create policy "Users can update own profile" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Admins can manage profiles" on public.profiles for all to authenticated using (public.is_admin());

-- EVENTS
create policy "Anyone can view events" on public.events for select to authenticated using (true);
create policy "Admins can manage events" on public.events for all to authenticated using (public.is_admin());

-- ATTENDANCE
create policy "Users can view own attendance" on public.attendance for select to authenticated using (
  user_id = auth.uid() or
  roster_member_id in (select id from public.roster_members where claimed_user_id = auth.uid())
);
create policy "Users can insert own attendance" on public.attendance for insert to authenticated with check (
  user_id = auth.uid() or
  roster_member_id in (select id from public.roster_members where claimed_user_id = auth.uid())
);
create policy "Admins can manage attendance" on public.attendance for all to authenticated using (public.is_admin());

-- ROSTER_MEMBERS
create policy "Anyone can view roster members" on public.roster_members for select to authenticated using (true);
create policy "Admins can manage roster members" on public.roster_members for all to authenticated using (public.is_admin());
create policy "Users can claim roster members" on public.roster_members for update to authenticated using (
  claimed_user_id is null or claimed_user_id = auth.uid()
) with check (
  claimed_user_id = auth.uid()
);

-- EVENT_SERIES
create policy "Anyone can view event series" on public.event_series for select to authenticated using (true);
create policy "Admins can manage event series" on public.event_series for all to authenticated using (public.is_admin());
