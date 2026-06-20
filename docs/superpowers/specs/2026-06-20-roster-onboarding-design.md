# Spec: Roster Onboarding and Name-Based Auto-Linking

## Problem Statement
When a user signs up (e.g. using Google Auth), their account profile is created, but they might see the error message:
> "Your account is not linked to a roster entry yet. Please ask an admin to link you."

This happens because the system only attempts to auto-link profiles to roster members by exact case-sensitive email match during signup. If a user registered with a different email, or if their email wasn't set on the roster, they are left unlinked with no self-service path to check in.

## Objectives
1. **Name-Based Auto-Linking**: Automatically match and link a new user to an unclaimed roster member if their Google name (profile `full_name`) matches exactly (case-insensitive).
2. **Self-Service Roster Onboarding**: When a user's account cannot be automatically linked, show a dedicated onboarding card on `/checkin/[token]` to:
   - Present suggested roster matches based on fuzzy/substring name matching.
   - Let them search and select their name from a list of unclaimed roster entries.
   - Let them create a new roster entry for themselves if they are not in the roster.

---

## 1. Database & Security Changes
We will define a database migration `supabase/migrations/20260620000000_roster_onboarding.sql`:

### 1.1 Trigger Function Enhancement
Update `public.handle_profile_claim()` to also match on exact full name:
```sql
create or replace function public.handle_profile_claim()
returns trigger as $$
begin
  -- 1. Try matching by email
  if NEW.email is not null then
    update public.roster_members
    set claimed_user_id = NEW.id
    where email = NEW.email and claimed_user_id is null;
  end if;
  
  -- 2. Fallback: Try exact case-insensitive full name matching if no email match was found
  if not found and NEW.full_name is not null then
    update public.roster_members
    set claimed_user_id = NEW.id
    where id = (
      select id from public.roster_members
      where lower(trim(full_name)) = lower(trim(NEW.full_name))
        and claimed_user_id is null
      limit 1
    );
  end if;
  return NEW;
end;
$$ language plpgsql security definer;
```

### 1.2 RLS Insertion Policy
Add an insert policy on `public.roster_members` to allow authenticated users to add themselves to the roster:
```sql
create policy "Users can insert own roster member" on public.roster_members 
  for insert to authenticated with check (claimed_user_id = auth.uid());
```

---

## 2. Onboarding UI on `/checkin/[token]`
If a user is logged in but `!rosterMember`, the page [src/pages/checkin/[token].astro](file:///Users/richardluo/Developer/QRoll/src/pages/checkin/%5Btoken%5D.astro) will show the onboarding UI card.

### 2.1 Fuzzy Matching Algorithm
On the server side of the Astro component, we will fetch:
- The current user's profile (`full_name`).
- All unclaimed roster members (`claimed_user_id is null`).

We will implement a name matching score in JS:
- Extract tokens/words from both names (e.g. `['michelle', 'zhuang']`).
- Score based on:
  - Substring matching (e.g. "Michelle" matching "Michelle Zhuang").
  - Word intersection size (common names).
- Rank and select the top matching roster members (up to 3) with a similarity score above a minimum threshold.

### 2.2 Onboarding Form Actions
The Astro page will support three POST actions when submitting the onboarding card:
1. **Claim suggestion / existing entry**: Sets `claimed_user_id` on the chosen roster member ID to the current user's ID.
2. **Create new roster entry**: Inserts a new row in `public.roster_members` with `full_name`, `email`, and `claimed_user_id = session.user.id`.

### 2.3 Visual UI Design
The card will be styled to fit the application's glassmorphism theme:
- **Header**: "Let's link your account to the roster"
- **Suggested Matches (if any)**: Distinct buttons containing the names, e.g. "Yes, I am Michelle Zhuang".
- **Search Dropdown**: Searchable dropdown using native/custom elements showing all unclaimed members.
- **Add Me form**: Toggle collapse to show "Not on the list? Register as a new member". Pre-fills with their profile name and email.

---

## 3. Mock Database Client Updates
To support local development in `src/lib/supabase.ts`, we will extend `MockQueryBuilder` to support:
- Fetching profiles.
- Inserting and updating roster members.
- Simulated auto-linking trigger functionality.

---

## 4. Verification & Testing Plan
1. **Sign-up Match Testing**: In DEV, verify that if we insert a profile with a name matching an unclaimed roster member, they are linked.
2. **Onboarding UI Flow**: In DEV, log in as a user with no matching email or name. Verify the check-in page displays:
   - Fuzzy match suggestions if name is close.
   - Roster dropdown search.
   - "Register new member" option.
3. **RLS Verification**: Ensure authenticated users can claim unclaimed roster members and insert new roster members for themselves, but cannot claim someone else's linked roster member.
