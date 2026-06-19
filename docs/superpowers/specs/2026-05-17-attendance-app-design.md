# Attendance App Design Specification

## Overview
A full-stack web application for QR-based attendance tracking, aimed at simplicity and ease-of-use on mobile devices. Admins can manage events and view attendance; users can quickly check in by scanning a QR code.

## Architecture
- **Framework:** Astro in SSR mode (Node.js adapter)
- **UI Integrations:** React via `@astrojs/react` for interactive components
- **Styling:** Tailwind CSS
- **Icons & Animation:** Lucide React, Framer Motion
- **Data Grids:** TanStack Table (for admin views)
- **Database & Auth:** Supabase (Postgres & Auth)
- **Deployment:** Vercel

## Data Model (Supabase Postgres)
- **profiles:** Syncs with `auth.users`. Fields: `id` (uuid), `email`, `full_name`, `role` (default 'attendee'), `created_at`.
- **events:** Managed by admins. Fields: `id`, `title`, `description`, `starts_at`, `checkin_opens_at`, `late_after_at`, `checkin_closes_at`, `qr_token` (unique), `created_by`.
- **attendance:** Records the check-in. Fields: `id`, `event_id`, `user_id`, `checked_in_at`, `status` ('on_time', 'late'), `ip_address`, `user_agent`, `created_at`. Unique constraint on `(event_id, user_id)`.

## Authentication & Security
- **Auth Provider:** Google OAuth via Supabase Auth.
- **Session:** Supabase SSR cookie-based sessions. Users stay logged in.
- **Authorization:** 
  - Admins can manage events and view all attendance.
  - Attendees can read events if they have a valid QR token.
  - Role (`attendee` vs `admin`) is checked server-side before performing sensitive actions.

## Routing (Astro Pages)
- `/login`: Google sign-in.
- `/dashboard`: Attendee view of past check-ins.
- `/checkin/[token]`: Attendee check-in flow. Validates time constraints and records attendance.
- `/admin`: Admin dashboard, lists events.
- `/admin/events/new`: Create event.
- `/admin/events/[id]`: Event details, QR code display, attendance table.
- `/admin/events/[id]/export`: CSV export endpoint.

## Check-in Flow
1. User scans QR code: `${APP_URL}/checkin/[qr_token]`
2. If not logged in, redirect to `/login` with an intent to return.
3. If logged in, Astro server fetches event by token using a service role client to bypass strict RLS for unassigned attendees.
4. Server evaluates time windows (`checkin_opens_at`, `checkin_closes_at`).
5. User clicks "Submit Attendance".
6. Form submission to an Astro API route or server endpoint securely grabs `x-forwarded-for` and `user-agent` headers, determines `status` (`on_time` vs `late`), and inserts the `attendance` record.

## Error Handling & Validation
- Server-side validation of time logic (e.g., opens before closes).
- Graceful error states (e.g., "Check-in closed") using Framer Motion for smooth transitions.

## Testing & Quality
- Clean code with strong TypeScript types.
- Reusable UI components.
