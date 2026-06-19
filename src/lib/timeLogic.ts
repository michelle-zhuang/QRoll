export type CheckinStatus = 'not_open' | 'present' | 'late' | 'closed';

interface TimingData { now: Date; opens_at: Date; late_after: Date; closes_at: Date; }

export function determineCheckinStatus({ now, opens_at, late_after, closes_at }: TimingData): { status: CheckinStatus } {
  if (now < opens_at) return { status: 'not_open' };
  if (now > closes_at) return { status: 'closed' };
  if (now > late_after) return { status: 'late' };
  return { status: 'present' };
}
