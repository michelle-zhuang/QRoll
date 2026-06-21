# Spec: Roster & Attendance Admin Overrides & Role Promotion

This specification describes the changes required to allow admins to override individual attendee attendance records, and manage the system's admins/teachers by promoting existing users or pre-authorizing new email addresses.

---

## 1. Attendance Overrides

### 1.1 Goals
- Give administrators full control over attendance records from the matrix grid.
- Support overrides for: Present, Late, Absent, and Clear/None (reverting to no record).
- Maintain an audit trail of any original automatic QR scans even if manual overrides are applied.

### 1.2 Database Changes
We will update/create the API and database integration to handle attendance statuses cleanly.
- Table: `public.attendance` has a status check: `status in ('present', 'late', 'absent', 'on_time')`.
- Clear/None: Selecting "Clear/None" will delete the attendance row for that specific `(event_id, roster_member_id)` pair, removing it from the matrix calculations.

### 1.3 API Endpoint
We will update `/api/attendance/note.ts` or create a more general API endpoint to handle the updates:
- **Endpoint**: `POST /api/attendance/update`
- **Request Body**:
  ```json
  {
    "roster_member_id": "uuid",
    "date": "YYYY-MM-DD",
    "status": "present" | "late" | "absent" | "none",
    "note": "string (optional)"
  }
  ```
- **Behavior**:
  - Finds matching event based on starts_at date (Los Angeles timezone).
  - If `status` is `"none"`, deletes the row in `public.attendance` if it exists.
  - If `status` is not `"none"`, upserts the `public.attendance` record with the provided `status`, `note`, and `checked_in_at` (defaults to the start of the event day if created manually).

### 1.4 Frontend Changes (`AttendanceMatrix.tsx`)
- Enhance the popup editor to render:
  - A segmented/button-group status selector (Present, Late, Absent, N/A Clear).
  - A note textarea.
  - A check-in audit log showing original QR scans/times if they exist on the record.
- Handle state changes locally in the matrix to update cell indicators instantly.

---

## 2. Admin & Staff Roles

### 2.1 Goals
- Allow admins to promote or demote registered users.
- Allow pre-authorization of teaching staff/admins by email address before they sign up.
- Allow admins to exist outside of the attendee roster, or optionally be linked if they are also students.

### 2.2 Database Changes
We will create a new migration to support pre-authorized admin emails:
1. **New Table**:
   ```sql
   create table public.admin_invites (
     email text primary key,
     created_at timestamptz not null default now()
   );
   alter table public.admin_invites enable row level security;
   create policy "Admins can manage admin invites" on public.admin_invites for all to authenticated using (public.is_admin());
   ```
2. **Updated Handle New User Trigger**:
   Modify `public.handle_new_user()` to assign role `'admin'` if the signing up user's email exists in `public.admin_invites`:
   ```sql
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
   ```

### 2.3 Frontend Management Interface
We will add the user/admin management inside a new admin view:
- **Route**: `/admin/users`
- **Features**:
  - **Invite Section**: Form to add an email address to `public.admin_invites`.
  - **Active Admins & Users list**: Table showing registered users (from `public.profiles`), their current role, their linked roster member (if any), and action buttons:
    - **Demote**: Demote from admin to attendee (toggles `role` to `'attendee'`).
    - **Promote**: Promote from attendee to admin (toggles `role` to `'admin'`).
  - **Pending Invites list**: Shows all rows in `public.admin_invites` with a "Revoke" button to remove the invite.
- **Navbar update**: Add a link to "Users/Admins" from the admin sub-navigation.
