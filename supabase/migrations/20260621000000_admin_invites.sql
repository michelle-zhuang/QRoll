-- Create admin_invites table
create table public.admin_invites (
  email text primary key,
  created_at timestamptz not null default now()
);

-- Enable RLS and setup policies
alter table public.admin_invites enable row level security;

create policy "Admins can manage admin invites" on public.admin_invites
  for all to authenticated using (public.is_admin());

-- Update trigger to handle new user signup checks
create or replace function public.handle_new_user()
returns trigger as $$
declare
  is_invited_admin boolean;
begin
  select exists (
    select 1 from public.admin_invites where email = new.email
  ) into is_invited_admin;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    case when is_invited_admin then 'admin' else 'attendee' end
  );

  if is_invited_admin then
    delete from public.admin_invites where email = new.email;
  end if;

  return new;
end;
$$ language plpgsql security definer;
