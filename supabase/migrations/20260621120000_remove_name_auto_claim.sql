-- Remove name-based auto-claiming fallback from handle_profile_claim trigger to prevent insecure auto-linking
create or replace function public.handle_profile_claim()
returns trigger as $$
begin
  -- Try email match only
  if NEW.email is not null then
    update public.roster_members
    set claimed_user_id = NEW.id
    where email = NEW.email and claimed_user_id is null;
  end if;

  return NEW;
end;
$$ language plpgsql security definer;
