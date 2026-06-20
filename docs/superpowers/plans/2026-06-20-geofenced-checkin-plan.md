# Geofenced Attendance Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement location verification for the event check-in flow, using client-side GPS coordinates when permitted and falling back to Vercel IP-based location headers, flagging out-of-bounds check-ins on the admin dashboard.

**Architecture:** 
- Add geofence coordinates (`latitude`, `longitude`, `radius`) configuration to `events` and `event_series`.
- Collect GPS coordinates in the browser via Geolocation API and post them during check-in.
- Compute distances via Haversine logic on the server; fall back to Vercel IP location headers if GPS is unavailable.
- Display warning indicators (pulsing red dots and verification details in tooltips) for out-of-bounds check-ins.

**Tech Stack:** Astro, React, Supabase (PostgreSQL), TypeScript.

## Global Constraints
- Soft flag system: check-ins always succeed but get flagged if out of bounds.
- GPS radius threshold calculation: `distance <= event.geofence_radius_meters + min(client_accuracy, 30)`.
- IP fallback radius threshold calculation: `distance <= 20000` (20km / 12 miles).
- Save location verification logs on the `attendance` table.

---

### Task 1: Database Migrations for Geofencing Configuration and Verification

**Files:**
- Create: `supabase/migrations/20260620000001_add_geofencing_columns.sql`

**Interfaces:**
- Produces: `event_series.geofence_enabled`, `events.geofence_enabled`, and `attendance.verification_status` columns.

- [ ] **Step 1: Write migration SQL file**
  Create the migration at `supabase/migrations/20260620000001_add_geofencing_columns.sql` containing the columns defined in the design spec:
  ```sql
  -- Add geofencing columns to configuration tables
  ALTER TABLE public.event_series
    ADD COLUMN geofence_enabled boolean NOT NULL DEFAULT false,
    ADD COLUMN latitude double precision,
    ADD COLUMN longitude double precision,
    ADD COLUMN geofence_radius_meters integer NOT NULL DEFAULT 100;

  ALTER TABLE public.events
    ADD COLUMN geofence_enabled boolean NOT NULL DEFAULT false,
    ADD COLUMN latitude double precision,
    ADD COLUMN longitude double precision,
    ADD COLUMN geofence_radius_meters integer NOT NULL DEFAULT 100;

  -- Add geofencing audit logs to attendance
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

- [ ] **Step 2: Apply migrations to remote/local database**
  Run DB sync or SQL execution on Supabase instance.
  Run: `npx supabase db push` or execute SQL directly if supabase CLI is not used.
  *(Note: Since DB is a remote instance configured via .env, we will push changes or run via migration scripts).*

- [ ] **Step 3: Commit migration**
  ```bash
  git add supabase/migrations/20260620000001_add_geofencing_columns.sql
  git commit -m "migration: add geofencing config and verification columns"
  ```

---

### Task 2: Implement Haversine Distance Logic

**Files:**
- Create: `src/lib/geofencing.ts`
- Create: `src/lib/geofencing.test.ts`

**Interfaces:**
- Produces: `calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number` (returns distance in meters)

- [ ] **Step 1: Write failing unit test for Haversine logic**
  Create `src/lib/geofencing.test.ts`:
  ```typescript
  import { describe, it, expect } from "vitest";
  import { calculateDistance } from "./geofencing";

  describe("Haversine Distance", () => {
    it("should calculate distance between two coordinates accurately", () => {
      // Space Needle to Pike Place Market (~1200 meters)
      const spaceNeedle = { lat: 47.6205, lon: -122.3493 };
      const pikePlace = { lat: 47.6097, lon: -122.3422 };
      
      const distance = calculateDistance(
        spaceNeedle.lat,
        spaceNeedle.lon,
        pikePlace.lat,
        pikePlace.lon
      );
      
      expect(distance).toBeGreaterThan(1100);
      expect(distance).toBeLessThan(1300);
    });

    it("should return 0 for identical points", () => {
      expect(calculateDistance(45, -120, 45, -120)).toBe(0);
    });
  });
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `npm run test -- src/lib/geofencing.test.ts`
  Expected: FAIL with import error / undefined function.

- [ ] **Step 3: Write Haversine distance calculator**
  Create `src/lib/geofencing.ts`:
  ```typescript
  /**
   * Calculates the great-circle distance between two points on the Earth's surface
   * using the Haversine formula. Returns distance in meters.
   */
  export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) *
        Math.cos(phi2) *
        Math.sin(deltaLambda / 2) *
        Math.sin(deltaLambda / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
  ```

- [ ] **Step 4: Run unit tests to verify they pass**
  Run: `npm run test -- src/lib/geofencing.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/lib/geofencing.ts src/lib/geofencing.test.ts
  git commit -m "feat: implement haversine distance formula with tests"
  ```

---

### Task 3: Client-Side Geolocation Gathering in Check-in Page

**Files:**
- Modify: `src/pages/checkin/[token].astro`

**Interfaces:**
- Consumes: Geolocation browser API.
- Produces: Form payload with `client_latitude`, `client_longitude`, `client_accuracy`, `geolocation_error`.

- [ ] **Step 1: Add inputs and script tag to the form in `src/pages/checkin/[token].astro`**
  Modify the `form` section (under `Astro.request.method === 'POST'` section) to render hidden form inputs and trigger geo collection if geofencing is enabled.
  Locate the form in `[token].astro` (around line 265-275) and modify:
  ```html
            <form method="post" id="checkin-form">
              {event!.geofence_enabled && (
                <>
                  <input type="hidden" name="client_latitude" id="client_latitude" />
                  <input type="hidden" name="client_longitude" id="client_longitude" />
                  <input type="hidden" name="client_accuracy" id="client_accuracy" />
                  <input type="hidden" name="geolocation_error" id="geolocation_error" />
                </>
              )}
              <AstroButton type="submit" size="lg" className="w-full h-14 text-base font-semibold" id="submit-btn">
                <span class="flex flex-col items-center">
                  <span>Submit attendance</span>
                  {currentStatus?.status === 'late' && <span class="text-[10px] uppercase tracking-wider opacity-70 mt-0.5">Status: late</span>}
                  {currentStatus?.status === 'present' && <span class="text-[10px] uppercase tracking-wider opacity-70 mt-0.5">Status: on time</span>}
                </span>
              </AstroButton>
            </form>
  ```

- [ ] **Step 2: Add client-side script block to request geolocation**
  Append a script block at the end of the file or layout scope that loads the inputs before user clicks submit:
  ```html
  <script is:inline>
    const form = document.getElementById('checkin-form');
    if (form && document.getElementById('client_latitude')) {
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
      } else {
        document.getElementById('geolocation_error').value = 'GEOLOCATION_NOT_SUPPORTED';
      }
    }
  </script>
  ```

- [ ] **Step 3: Verify build compiles without TypeScript errors**
  Run: `npm run build`
  Expected: Successful compilation of Astro files.

- [ ] **Step 4: Commit**
  ```bash
  git add src/pages/checkin/\[token\].astro
  git commit -m "feat: add client-side geolocation collection scripts to checkin form"
  ```

---

### Task 4: Server-Side Geofence & IP Verification

**Files:**
- Modify: `src/pages/checkin/[token].astro`

**Interfaces:**
- Consumes: `calculateDistance` from `src/lib/geofencing`.
- Produces: Writes geofencing verification results to `attendance` table.

- [ ] **Step 1: Import distance logic and implement verification**
  At the top of `src/pages/checkin/[token].astro` frontmatter, import:
  ```typescript
  import { calculateDistance } from '../../lib/geofencing';
  ```
  Locate the section handling the attendance database insert (around line 143) and rewrite it to handle coordinates:
  ```typescript
    const formData = await Astro.request.formData();
    const clientLat = formData.get('client_latitude') ? parseFloat(formData.get('client_latitude') as string) : null;
    const clientLon = formData.get('client_longitude') ? parseFloat(formData.get('client_longitude') as string) : null;
    const clientAcc = formData.get('client_accuracy') ? parseFloat(formData.get('client_accuracy') as string) : null;

    let verification_method: 'gps' | 'ip' | 'none' = 'none';
    let verification_status: 'verified' | 'verified_ip' | 'out_of_bounds' | 'out_of_bounds_ip' | 'unverified' = 'unverified';
    let calculated_distance_meters: number | null = null;
    let ipLat: number | null = null;
    let ipLon: number | null = null;

    if (event.geofence_enabled) {
      if (clientLat !== null && clientLon !== null && !isNaN(clientLat) && !isNaN(clientLon)) {
        verification_method = 'gps';
        calculated_distance_meters = calculateDistance(clientLat, clientLon, event.latitude, event.longitude);
        const maxRadius = event.geofence_radius_meters + Math.min(clientAcc || 0, 30);
        verification_status = calculated_distance_meters <= maxRadius ? 'verified' : 'out_of_bounds';
      } else {
        // Fallback to IP geolocation
        const headerLat = Astro.request.headers.get('x-vercel-ip-latitude');
        const headerLon = Astro.request.headers.get('x-vercel-ip-longitude');
        if (headerLat && headerLon) {
          ipLat = parseFloat(headerLat);
          ipLon = parseFloat(headerLon);
          if (!isNaN(ipLat) && !isNaN(ipLon)) {
            verification_method = 'ip';
            calculated_distance_meters = calculateDistance(ipLat, ipLon, event.latitude, event.longitude);
            verification_status = calculated_distance_meters <= 20000 ? 'verified_ip' : 'out_of_bounds_ip';
          }
        }
      }
    }

    const ip = Astro.request.headers.get('x-forwarded-for') || Astro.clientAddress;
    const ua = Astro.request.headers.get('user-agent');

    const { error } = await supabase.from('attendance').insert({
      event_id: event.id,
      user_id: session.user.id,
      roster_member_id: rosterMember.id,
      status: status,
      ip_address: ip,
      user_agent: ua,
      verification_method,
      verification_status,
      client_latitude: clientLat,
      client_longitude: clientLon,
      client_accuracy: clientAcc,
      calculated_distance_meters,
      ip_latitude: ipLat,
      ip_longitude: ipLon
    });
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add src/pages/checkin/\[token\].astro
  git commit -m "feat: parse locations and evaluate geofence with IP fallback on checkin form submission"
  ```

---

### Task 5: Admin Dashboard Report (UI Warn & Tooltip Details)

**Files:**
- Modify: `src/pages/dashboard.astro`
- Modify: `src/components/AttendanceMatrix.tsx`

**Interfaces:**
- Consumes: `verification_status` and location metadata from `attendance` rows.
- Produces: Cell alerts and tooltip details.

- [ ] **Step 1: Pull verification details in dashboard query**
  Modify `src/pages/dashboard.astro` query for attendance (around line 42) to select the new geofence verification columns:
  ```typescript
    supabase.from('attendance').select('event_id, roster_member_id, status, note, checked_in_at, verification_status, verification_method, calculated_distance_meters')
  ```
  And update map handler (around line 72-80):
  ```typescript
  attendance.forEach(a => {
    if (!a.roster_member_id) return;
    const date = dateByEvent[a.event_id];
    if (!date) return;
    const status = (a.status === 'on_time' ? 'present' : a.status) as AttendanceStatus;
    if (!recordsByMember[a.roster_member_id]) recordsByMember[a.roster_member_id] = [];
    recordsByMember[a.roster_member_id].push({ 
      date, 
      status, 
      reason: a.note ?? null,
      verification_status: (a as any).verification_status,
      verification_method: (a as any).verification_method,
      calculated_distance_meters: (a as any).calculated_distance_meters
    });
  });
  ```

- [ ] **Step 2: Update types mapping in `src/lib/attendanceTypes.ts`**
  Let's check `src/lib/attendanceTypes.ts` using view_file or add fields to the interface inside `AttendanceMatrix.tsx` or `attendanceTypes.ts`. Let's verify `src/lib/attendanceTypes.ts` exists.
  Wait, let's view `src/lib/attendanceTypes.ts`:
  ```typescript
  export type AttendanceStatus = 'present' | 'late' | 'absent';
  export interface AttendanceRecord {
    date: string;
    status: AttendanceStatus;
    reason: string | null;
    verification_status?: 'verified' | 'verified_ip' | 'out_of_bounds' | 'out_of_bounds_ip' | 'unverified';
    verification_method?: 'gps' | 'ip' | 'none';
    calculated_distance_meters?: number | null;
  }
  ```

- [ ] **Step 3: Modify cells in `AttendanceMatrix.tsx` to render warnings**
  Locate cell buttons rendering in `AttendanceMatrix.tsx` (around lines 390-410). If `verification_status` is `'out_of_bounds'` or `'out_of_bounds_ip'`, render a pulsing red warning dot in the top-left of the status block:
  ```tsx
                          <button
                            type="button"
                            onClick={e => onCellClick(a.name, d, e)}
                            onMouseEnter={e => onCellEnter(a.name, d, e)}
                            onMouseLeave={onCellLeave}
                            className={cn(
                              "relative h-6 w-6 rounded-md cursor-pointer transition-all hover:scale-125 hover:shadow-md hover:z-10 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                              statusClass(rec?.status)
                            )}
                            aria-label={`${a.name} ${d} ${statusLabel(rec?.status)}`}
                          >
                            {/* Geofence warning dot */}
                            {(rec?.verification_status === 'out_of_bounds' || rec?.verification_status === 'out_of_bounds_ip') && (
                              <span className="absolute -top-1 -left-1 h-2 w-2 rounded-full bg-rose-500 animate-pulse border border-card" />
                            )}
                            {note && (
                              <span
                                className={cn(
                                  "absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full ring-1 ring-card",
                                  overridden ? "bg-[#A9DEF9]" : "bg-foreground/40"
                                )}
                              />
                            )}
                          </button>
  ```

- [ ] **Step 4: Update Tooltip details inside `AttendanceMatrix.tsx`**
  Modify `renderTooltip()` to show location info (around line 230):
  ```tsx
            {note ? (
              <p className="text-xs text-muted-foreground italic leading-snug">
                &ldquo;{note}&rdquo;
                {overridden && <span className="ml-1.5 not-italic text-[9px] uppercase tracking-wide text-[#A9DEF9] font-semibold">edited</span>}
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground/60 italic">Click to add a note</p>
            )}
            
            {/* Geofence verification details */}
            {rec?.verification_status && rec.verification_status !== 'unverified' && (
              <div className="mt-2 pt-2 border-t text-[10px] text-muted-foreground">
                <div className="flex justify-between">
                  <span>Location:</span>
                  <span className={cn(
                    "font-semibold",
                    rec.verification_status.startsWith('out_of_bounds') ? "text-rose-500" : "text-emerald-500"
                  )}>
                    {rec.verification_status.startsWith('out_of_bounds') ? "Out of Bounds" : "Verified"}
                    {rec.verification_method === 'ip' && " (IP)"}
                  </span>
                </div>
                {rec.calculated_distance_meters !== null && rec.calculated_distance_meters !== undefined && (
                  <div className="flex justify-between mt-0.5">
                    <span>Distance:</span>
                    <span>{Math.round(rec.calculated_distance_meters)}m</span>
                  </div>
                )}
              </div>
            )}
  ```

- [ ] **Step 5: Update Note Editor Dialog bottom section**
  Display a small warning box or log inside `renderEditor()` (around line 300) showing raw coordinates and accuracy if available:
  ```tsx
              {rec?.verification_status && (
                <div className="mt-4 p-3 bg-muted/50 rounded-2xl text-[11px] text-muted-foreground border">
                  <p className="font-semibold text-foreground mb-1">Location Verification Log</p>
                  <p>Method: {rec.verification_method?.toUpperCase() || 'NONE'}</p>
                  <p>Status: {rec.verification_status?.toUpperCase()}</p>
                  {rec.calculated_distance_meters !== null && rec.calculated_distance_meters !== undefined && (
                    <p>Calculated Distance: {Math.round(rec.calculated_distance_meters)} meters</p>
                  )}
                </div>
              )}
  ```

- [ ] **Step 6: Commit**
  ```bash
  git add src/pages/dashboard.astro src/components/AttendanceMatrix.tsx
  git commit -m "feat: show pulsing warning dot, verification status tooltips, and note log in admin dashboard"
  ```
