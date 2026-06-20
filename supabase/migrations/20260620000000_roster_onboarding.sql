-- Extend the auto-claim trigger to also match by full_name (case-insensitive) when email fails.
-- This allows e.g. "michellezhuang1014@gmail.com" to auto-link to "Michelle Zhuang" on the roster.
create or replace function public.handle_profile_claim()
returns trigger as $$
begin
  -- 1. Try email match first (existing behaviour)
  if NEW.email is not null then
    update public.roster_members
    set claimed_user_id = NEW.id
    where email = NEW.email and claimed_user_id is null;

    -- If we successfully claimed, we're done.
    if found then
      return NEW;
    end if;
  end if;

  -- 2. Fallback: exact full_name match (case-insensitive)
  if NEW.full_name is not null then
    update public.roster_members
    set claimed_user_id = NEW.id
    where lower(full_name) = lower(NEW.full_name)
      and claimed_user_id is null;
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

-- Allow authenticated users to insert a new roster_members row and self-claim it.
-- This supports the "Create new roster entry" flow in the onboarding card.
create policy "Users can insert and self-claim roster members"
  on public.roster_members
  for insert
  to authenticated
  with check (claimed_user_id = auth.uid());
