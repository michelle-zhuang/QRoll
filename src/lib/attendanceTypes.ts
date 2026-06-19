export type AttendanceStatus = 'present' | 'late' | 'absent';

export interface AttendanceRecord {
  date: string;
  status: AttendanceStatus;
  reason: string | null;
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
