export type AttendanceStatus = 'present' | 'late' | 'absent';

export interface AttendanceRecord {
  date: string;
  status: AttendanceStatus;
  reason: string | null;
  verification_status?: 'verified' | 'verified_ip' | 'out_of_bounds' | 'out_of_bounds_ip' | 'unverified';
  verification_method?: 'gps' | 'ip' | 'none';
  calculated_distance_meters?: number | null;
  checked_in_at?: string;
}

export interface AttendanceMember {
  id: string;
  name: string;
  records: AttendanceRecord[];
}

export interface AttendanceData {
  dates: string[];
  attendees: AttendanceMember[];
}
