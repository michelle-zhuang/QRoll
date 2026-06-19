-- Recurring events: a series describes the recurrence rule and groups occurrences.
-- Each occurrence is still a row in `events` with its own check-in window.
create table public.event_series (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  timezone text not null default 'UTC',
  recurrence_freq text not null check (recurrence_freq in ('daily','weekly','biweekly','monthly')),
  recurrence_byweekday smallint[],
  recurrence_count int,
  recurrence_until date,
  qr_token text unique default gen_random_uuid()::text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  check (recurrence_count is not null or recurrence_until is not null)
);

create index event_series_qr_token_idx on public.event_series(qr_token);

alter table public.events
  add column series_id uuid references public.event_series(id) on delete cascade,
  add column occurrence_index int,
  add column cancelled_at timestamptz,
  add column detached_from_series boolean not null default false;

create index events_series_id_starts_at_idx on public.events (series_id, starts_at);

create unique index events_series_occurrence_idx
  on public.events (series_id, occurrence_index)
  where series_id is not null;
