import { fromZonedTime, toZonedTime } from "date-fns-tz";

export type RecurrenceFreq = "daily" | "weekly" | "biweekly" | "monthly";

export interface SeriesInput {
  freq: RecurrenceFreq;
  byweekday?: number[];
  count?: number | null;
  until?: Date | null;
  startsAtLocal: Date;
  opensOffsetMs: number;
  lateOffsetMs: number;
  closesOffsetMs: number;
  timezone: string;
}

export interface OccurrenceTimes {
  starts_at: Date;
  checkin_opens_at: Date;
  late_after_at: Date;
  checkin_closes_at: Date;
}

export const MAX_OCCURRENCES = 200;

function toZonedYMDH(date: Date, tz: string) {
  const z = toZonedTime(date, tz);
  return {
    year: z.getFullYear(),
    month: z.getMonth(),
    day: z.getDate(),
    hour: z.getHours(),
    minute: z.getMinutes(),
    second: z.getSeconds(),
    weekday: z.getDay(),
  };
}

function localDateInTz(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  tz: string,
): Date {
  const iso = `${year.toString().padStart(4, "0")}-${(month + 1).toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")}T${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}:${second.toString().padStart(2, "0")}`;
  return fromZonedTime(iso, tz);
}

function endLocalDateInTz(d: Date, tz: string): Date {
  const z = toZonedYMDH(d, tz);
  return localDateInTz(z.year, z.month, z.day, 23, 59, 59, tz);
}

export function expandOccurrences(input: SeriesInput): OccurrenceTimes[] {
  const {
    freq,
    byweekday,
    count,
    until,
    startsAtLocal,
    opensOffsetMs,
    lateOffsetMs,
    closesOffsetMs,
    timezone,
  } = input;

  const limit = Math.min(count ?? MAX_OCCURRENCES, MAX_OCCURRENCES);
  const untilTs = until ? endLocalDateInTz(until, timezone).getTime() : Infinity;

  const startZ = toZonedYMDH(startsAtLocal, timezone);
  const hour = startZ.hour;
  const minute = startZ.minute;
  const second = startZ.second;

  const results: OccurrenceTimes[] = [];

  const push = (year: number, month: number, day: number) => {
    if (results.length >= limit) return false;
    const starts = localDateInTz(year, month, day, hour, minute, second, timezone);
    if (starts.getTime() > untilTs) return false;
    if (starts.getTime() < startsAtLocal.getTime() - 1000) return true;
    results.push({
      starts_at: starts,
      checkin_opens_at: new Date(starts.getTime() + opensOffsetMs),
      late_after_at: new Date(starts.getTime() + lateOffsetMs),
      checkin_closes_at: new Date(starts.getTime() + closesOffsetMs),
    });
    return true;
  };

  if (freq === "daily") {
    let cursor = new Date(startsAtLocal);
    while (results.length < limit) {
      const z = toZonedYMDH(cursor, timezone);
      const ok = push(z.year, z.month, z.day);
      if (!ok) break;
      cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
      if (cursor.getTime() > untilTs + 24 * 60 * 60 * 1000) break;
    }
  } else if (freq === "weekly" || freq === "biweekly") {
    const stride = freq === "biweekly" ? 14 : 7;
    const days = (byweekday && byweekday.length > 0 ? [...byweekday] : [startZ.weekday]).slice().sort((a, b) => a - b);

    const startWeekday = startZ.weekday;
    const startDayMs = localDateInTz(startZ.year, startZ.month, startZ.day, 0, 0, 0, timezone).getTime();

    let weekAnchorMs = startDayMs - startWeekday * 24 * 60 * 60 * 1000;

    while (results.length < limit) {
      let advanced = false;
      for (const wd of days) {
        const dayMs = weekAnchorMs + wd * 24 * 60 * 60 * 1000;
        const dz = toZonedYMDH(new Date(dayMs + 12 * 60 * 60 * 1000), timezone);
        const ok = push(dz.year, dz.month, dz.day);
        if (!ok) {
          if (results.length === 0 && dayMs < startDayMs) continue;
          if (dayMs > untilTs) {
            advanced = false;
            break;
          }
          continue;
        }
        advanced = true;
      }
      if (!advanced && weekAnchorMs > untilTs) break;
      weekAnchorMs += stride * 24 * 60 * 60 * 1000;
      if (weekAnchorMs > untilTs + stride * 24 * 60 * 60 * 1000) break;
    }
  } else if (freq === "monthly") {
    let monthCursor = { year: startZ.year, month: startZ.month };
    while (results.length < limit) {
      const ok = push(monthCursor.year, monthCursor.month, startZ.day);
      if (!ok) break;
      monthCursor = monthCursor.month === 11
        ? { year: monthCursor.year + 1, month: 0 }
        : { year: monthCursor.year, month: monthCursor.month + 1 };
    }
  }

  return results.slice(0, limit);
}
