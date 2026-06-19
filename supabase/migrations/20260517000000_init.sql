create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null, full_name text, role text not null default 'attendee', created_at timestamptz not null default now()
);
create table public.events (
  id uuid primary key default gen_random_uuid(), title text not null, description text,
  starts_at timestamptz not null, checkin_opens_at timestamptz not null,
  late_after_at timestamptz not null, checkin_closes_at timestamptz not null,
  qr_token text not null unique, created_by uuid references public.profiles(id), created_at timestamptz not null default now()
);
create table public.attendance (
  id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  checked_in_at timestamptz not null default now(), status text not null check (status in ('on_time', 'late')),
  ip_address text, user_agent text, created_at timestamptz not null default now(), unique(event_id, user_id)
);
