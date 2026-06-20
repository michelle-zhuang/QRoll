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
