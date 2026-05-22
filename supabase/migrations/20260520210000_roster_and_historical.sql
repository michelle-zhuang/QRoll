-- Roster members: people who can attend events, independent of auth.
-- A roster_member becomes "claimed" when their email matches a signed-up profile,
-- or when an admin manually links them.
create table public.roster_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text unique,
  claimed_user_id uuid unique references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create index roster_members_email_idx on public.roster_members(email);
create index roster_members_claimed_user_id_idx on public.roster_members(claimed_user_id);

-- Allow events without a QR token (historical / imported events)
alter table public.events alter column qr_token drop not null;
alter table public.events add column is_historical boolean not null default false;

-- Attendance: link to a roster_member (always) and optionally a profile (for claimed members).
-- user_id remains nullable so historical attendance without an auth user is supported.
alter table public.attendance alter column user_id drop not null;
alter table public.attendance add column roster_member_id uuid references public.roster_members(id) on delete cascade;
alter table public.attendance add column note text;

-- Allow 'present' (replacing 'on_time') and 'absent' alongside 'late'.
alter table public.attendance drop constraint attendance_status_check;
alter table public.attendance add constraint attendance_status_check
  check (status in ('present', 'late', 'absent', 'on_time'));

-- Migrate existing 'on_time' rows to 'present' (no-op if table is empty).
update public.attendance set status = 'present' where status = 'on_time';

-- New uniqueness: one record per (event, roster_member). Drop old (event_id, user_id) one if present.
alter table public.attendance drop constraint if exists attendance_event_id_user_id_key;
alter table public.attendance add constraint attendance_event_roster_unique
  unique (event_id, roster_member_id);

-- Auto-claim trigger: when a new profile is inserted (i.e. someone signs up),
-- auto-link them to a roster_member with the same email if one exists and isn't claimed yet.
create or replace function public.handle_profile_claim()
returns trigger as $$
begin
  if NEW.email is not null then
    update public.roster_members
    set claimed_user_id = NEW.id
    where email = NEW.email and claimed_user_id is null;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger on_profile_created_claim
  after insert on public.profiles
  for each row execute procedure public.handle_profile_claim();

-- When a profile is deleted, the FK already nulls claimed_user_id; no extra trigger needed.
