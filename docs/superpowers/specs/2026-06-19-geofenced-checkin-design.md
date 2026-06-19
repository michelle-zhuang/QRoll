# Design Specification: Geofenced Attendance Verification with IP Fallback

This document outlines the design for adding location verification to the QRoll check-in flow, combining browser-based GPS with server-side IP geolocation fallback to detect remote check-in fraud.

## 1. Overview & Goals

When attendees scan a series or event QR code, we want to ensure they are physically present at the venue without introducing excessive friction or blocking them entirely. We will implement a **soft flag** system:
- Check-ins are always allowed to succeed to avoid blocking attendees due to technical glitches (e.g. poor GPS signals).
- Admins are shown warning indicators in the dashboard if a check-in occurred out of bounds.

### Goals
- Capture precise GPS coordinates from the browser when permitted.
- Fallback to IP address location when GPS is denied or unavailable.
- Check location boundaries (e.g., specific dance studio building for GPS, metropolitan region for IP).
- Flag out-of-bounds check-ins on the admin dashboard.
- Save location metadata on check-in records for audit.

---

## 2. Database Schema Changes

We will add configuration fields to `events` and `event_series` tables, and verification metadata fields to the `attendance` table.

```sql
-- Migration: Add geofencing fields

-- 1. Configuration on event series
ALTER TABLE public.event_series
  ADD COLUMN geofence_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN latitude double precision,
  ADD COLUMN longitude double precision,
  ADD COLUMN geofence_radius_meters integer NOT NULL DEFAULT 100;

-- 2. Configuration on individual events (allows overrides)
ALTER TABLE public.events
  ADD COLUMN geofence_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN latitude double precision,
  ADD COLUMN longitude double precision,
  ADD COLUMN geofence_radius_meters integer NOT NULL DEFAULT 100;

-- 3. Verification logs on attendance
ALTER TABLE public.attendance
  ADD COLUMN verification_method text CHECK (verification_method IN ('gps', 'ip', 'none')),
  ADD COLUMN verification_status text CHECK (verification_status IN ('verified', 'verified_ip', 'out_of_bounds', 'out_of_bounds_ip', 'unverified')),
  ADD COLUMN client_latitude double precision,
  ADD COLUMN client_longitude double precision,
  ADD COLUMN client_accuracy double precision,
  ADD COLUMN calculated_distance_meters double precision,
  ADD COLUMN ip_latitude double precision,
  ADD COLUMN ip_longitude double precision;
```

---

## 3. Client-Side Geolocation Capture

On `/src/pages/checkin/[token].astro`, if `event.geofence_enabled` is true:
1. Four hidden input fields are added to the HTML `<form>`:
   - `client_latitude`
   - `client_longitude`
   - `client_accuracy`
   - `geolocation_error`
2. A client-side script tag runs immediately on page load to request the user's location via standard browser API:
   ```javascript
   if (navigator.geolocation) {
     navigator.geolocation.getCurrentPosition(
       (position) => {
         document.getElementById('client_latitude').value = position.coords.latitude;
         document.getElementById('client_longitude').value = position.coords.longitude;
         document.getElementById('client_accuracy').value = position.coords.accuracy;
       },
       (error) => {
         const errorTypes = { 1: 'PERMISSION_DENIED', 2: 'POSITION_UNAVAILABLE', 3: 'TIMEOUT' };
         document.getElementById('geolocation_error').value = errorTypes[error.code] || 'UNKNOWN_ERROR';
       },
       { enableHighAccuracy: true, timeout: 6000 }
     );
   }
   ```
3. If they deny permissions, it populates `geolocation_error` as `'PERMISSION_DENIED'`. The "Submit attendance" button remains clickable.

---

## 4. Server-Side Verification Logic

When handling the `POST` request on `/src/pages/checkin/[token].astro`:
1. Parse coordinates and errors from form body.
2. Determine `verification_method` and `verification_status`:

### GPS Logic (Primary)
If `client_latitude` and `client_longitude` are present:
- Calculate distance in meters to target `(event.latitude, event.longitude)` using the Haversine formula.
- Mark as `'verified'` if:
  $$\text{distance} \le \text{event.geofence\_radius\_meters} + \min(\text{client\_accuracy}, 30)$$
- Otherwise, mark as `'out_of_bounds'`.
- Set `verification_method = 'gps'`.

### IP Geolocation Logic (Fallback)
If GPS parameters are missing (e.g. `PERMISSION_DENIED` or `TIMEOUT`):
- Read Vercel IP location headers from request:
  - Latitude: `Astro.request.headers.get('x-vercel-ip-latitude')`
  - Longitude: `Astro.request.headers.get('x-vercel-ip-longitude')`
- Calculate distance in meters to target `(event.latitude, event.longitude)`.
- Mark as `'verified_ip'` if:
  $$\text{distance} \le 20000 \text{ meters (approx. 12 miles)}$$
- Otherwise, mark as `'out_of_bounds_ip'`.
- Set `verification_method = 'ip'`.
- Store `ip_latitude` and `ip_longitude`.

### Local Dev / Missing Fallback
If Vercel headers are missing and GPS failed:
- Set `verification_method = 'none'`, `verification_status = 'unverified'`.

---

## 5. Admin Dashboard Reporting

We will update the `AttendanceMatrix` component (`/src/components/AttendanceMatrix.tsx`):

### Cell UI
- If an attendance record has `verification_status` of `'out_of_bounds'` or `'out_of_bounds_ip'`:
  - Show a small, pulsing red dot (`bg-rose-500 animate-pulse`) in the top-left corner of the cell's status box.

### Tooltips
- On hover, expand tooltip details to show location verification details:
  - Method (GPS or IP)
  - Distance from target in meters/miles
  - Verification status colored green (for verified) or red (for out of bounds).

### Note Editor Dialog
- Display a technical log snippet at the bottom of the note editing dialog for full visibility when an admin goes to add/change attendance notes.

---

## 6. Verification Plan

### Automated Tests
- Write unit tests for distance calculations (Haversine formula).
- Test mock requests simulating Vercel IP headers and GPS inputs.

### Manual Verification
- Simulate check-ins with:
  1. GPS allowed within boundary.
  2. GPS allowed outside boundary.
  3. GPS denied, IP within Seattle.
  4. GPS denied, IP outside Seattle.
- Verify that admin console properly displays warning flags.
