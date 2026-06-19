import { describe, it, expect } from "vitest";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { expandOccurrences, MAX_OCCURRENCES } from "./recurrence";

const TZ = "America/Los_Angeles";

function localPT(iso: string): Date {
  return fromZonedTime(iso, TZ);
}

function ptHourMinute(d: Date): string {
  const z = toZonedTime(d, TZ);
  return `${z.getHours().toString().padStart(2, "0")}:${z.getMinutes().toString().padStart(2, "0")}`;
}

describe("expandOccurrences", () => {
  it("daily until end-date produces the right number of days", () => {
    const start = localPT("2026-01-01T09:00:00");
    const occs = expandOccurrences({
      freq: "daily",
      startsAtLocal: start,
      until: localPT("2026-01-10T00:00:00"),
      opensOffsetMs: -10 * 60_000,
      lateOffsetMs: 15 * 60_000,
      closesOffsetMs: 60 * 60_000,
      timezone: TZ,
    });
    expect(occs.length).toBe(10);
    expect(occs.every(o => ptHourMinute(o.starts_at) === "09:00")).toBe(true);
  });

  it("weekly Mon/Wed/Fri count=6 produces 6 occurrences in tz", () => {
    const start = localPT("2026-03-02T18:00:00");
    const occs = expandOccurrences({
      freq: "weekly",
      byweekday: [1, 3, 5],
      count: 6,
      startsAtLocal: start,
      opensOffsetMs: -5 * 60_000,
      lateOffsetMs: 10 * 60_000,
      closesOffsetMs: 60 * 60_000,
      timezone: TZ,
    });
    expect(occs.length).toBe(6);
    expect(occs.every(o => ptHourMinute(o.starts_at) === "18:00")).toBe(true);
    const weekdays = occs.map(o => toZonedTime(o.starts_at, TZ).getDay());
    expect(weekdays).toEqual([1, 3, 5, 1, 3, 5]);
  });

  it("preserves wall-clock time across spring DST transition", () => {
    const start = localPT("2026-03-02T18:00:00");
    const occs = expandOccurrences({
      freq: "weekly",
      byweekday: [1],
      count: 4,
      startsAtLocal: start,
      opensOffsetMs: 0,
      lateOffsetMs: 15 * 60_000,
      closesOffsetMs: 60 * 60_000,
      timezone: TZ,
    });
    expect(occs.length).toBe(4);
    for (const o of occs) {
      expect(ptHourMinute(o.starts_at)).toBe("18:00");
    }
    const beforeDst = occs[0].starts_at.toISOString();
    const afterDst = occs[2].starts_at.toISOString();
    expect(beforeDst.endsWith("02:00:00.000Z")).toBe(true);
    expect(afterDst.endsWith("01:00:00.000Z")).toBe(true);
  });

  it("biweekly with byweekday=[2] count=4 strides 14 days", () => {
    const start = localPT("2026-04-07T17:00:00");
    const occs = expandOccurrences({
      freq: "biweekly",
      byweekday: [2],
      count: 4,
      startsAtLocal: start,
      opensOffsetMs: 0,
      lateOffsetMs: 10 * 60_000,
      closesOffsetMs: 60 * 60_000,
      timezone: TZ,
    });
    expect(occs.length).toBe(4);
    const dates = occs.map(o => toZonedTime(o.starts_at, TZ).getDate());
    expect(dates).toEqual([7, 21, 5, 19]);
  });

  it("caps at MAX_OCCURRENCES even when count exceeds it", () => {
    const start = localPT("2026-01-01T09:00:00");
    const occs = expandOccurrences({
      freq: "daily",
      count: 500,
      startsAtLocal: start,
      opensOffsetMs: 0,
      lateOffsetMs: 0,
      closesOffsetMs: 60_000,
      timezone: TZ,
    });
    expect(occs.length).toBe(MAX_OCCURRENCES);
  });

  it("monthly count=3 keeps the same day-of-month", () => {
    const start = localPT("2026-01-15T10:00:00");
    const occs = expandOccurrences({
      freq: "monthly",
      count: 3,
      startsAtLocal: start,
      opensOffsetMs: 0,
      lateOffsetMs: 0,
      closesOffsetMs: 60_000,
      timezone: TZ,
    });
    expect(occs.length).toBe(3);
    const z = occs.map(o => {
      const local = toZonedTime(o.starts_at, TZ);
      return { y: local.getFullYear(), m: local.getMonth(), d: local.getDate() };
    });
    expect(z).toEqual([
      { y: 2026, m: 0, d: 15 },
      { y: 2026, m: 1, d: 15 },
      { y: 2026, m: 2, d: 15 },
    ]);
  });
});
