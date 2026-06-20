import { toZonedTime, fromZonedTime } from "date-fns-tz";

export type CheckinStatus = 'not_open' | 'present' | 'late' | 'closed';

interface TimingData { now: Date; opens_at: Date; late_after: Date; closes_at: Date; }

export function determineCheckinStatus({ now, opens_at, late_after, closes_at }: TimingData): { status: CheckinStatus } {
  if (now < opens_at) return { status: 'not_open' };
  if (now > closes_at) return { status: 'closed' };
  if (now > late_after) return { status: 'late' };
  return { status: 'present' };
}

export const PACIFIC_TIMEZONE = "America/Los_Angeles";

export function toPacificTime(date: Date | string): Date {
  return toZonedTime(new Date(date), PACIFIC_TIMEZONE);
}

export function fromPacificTime(date: Date | string): Date {
  return fromZonedTime(date, PACIFIC_TIMEZONE);
}

export function formatInPacific(date: Date | string, options: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    ...options,
    timeZone: PACIFIC_TIMEZONE,
  }).format(d);
}

export function formatPacificDate(date: Date | string): string {
  return formatInPacific(date, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatPacificTime(date: Date | string): string {
  return formatInPacific(date, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatPacificDateTime(date: Date | string): string {
  return formatInPacific(date, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}
