import { describe, it, expect } from 'vitest';
import { determineCheckinStatus, formatPacificDate, formatPacificTime, formatPacificDateTime, toPacificTime, fromPacificTime } from './timeLogic';

describe('determineCheckinStatus', () => {
  const opens = new Date('2026-05-17T10:00:00Z');
  const late = new Date('2026-05-17T10:15:00Z');
  const closes = new Date('2026-05-17T11:00:00Z');
  
  it('returns present for time strictly between opens_at and late_after', () => {
    expect(determineCheckinStatus({ now: new Date('2026-05-17T10:05:00Z'), opens_at: opens, late_after: late, closes_at: closes }).status).toBe('present');
  });

  it('returns not_open when current time is strictly before opens_at', () => {
    expect(determineCheckinStatus({ now: new Date('2026-05-17T09:59:59Z'), opens_at: opens, late_after: late, closes_at: closes }).status).toBe('not_open');
  });

  it('returns late when current time is strictly after late_after but before closes_at', () => {
    expect(determineCheckinStatus({ now: new Date('2026-05-17T10:16:00Z'), opens_at: opens, late_after: late, closes_at: closes }).status).toBe('late');
  });

  it('returns closed when current time is strictly after closes_at', () => {
    expect(determineCheckinStatus({ now: new Date('2026-05-17T11:00:01Z'), opens_at: opens, late_after: late, closes_at: closes }).status).toBe('closed');
  });

  it('returns present exactly at opens_at boundary', () => {
    expect(determineCheckinStatus({ now: opens, opens_at: opens, late_after: late, closes_at: closes }).status).toBe('present');
  });

  it('returns present exactly at late_after boundary', () => {
    expect(determineCheckinStatus({ now: late, opens_at: opens, late_after: late, closes_at: closes }).status).toBe('present');
  });

  it('returns late exactly at closes_at boundary', () => {
    expect(determineCheckinStatus({ now: closes, opens_at: opens, late_after: late, closes_at: closes }).status).toBe('late');
  });
});

describe('Pacific Time Helpers', () => {
  const utcDateStr = '2026-06-22T06:57:00Z'; // June 21, 2026, 11:57 PM PDT

  it('formats dates in Pacific Time correctly', () => {
    expect(formatPacificDate(utcDateStr)).toBe('Jun 21, 2026');
  });

  it('formats times in Pacific Time correctly', () => {
    // Note: depending on the exact implementation, PM/AM might be uppercase or lowercase, let's normalize or check
    expect(formatPacificTime(utcDateStr).replace(/\s+/g, ' ')).toMatch(/11:57\s*PM/i);
  });

  it('formats datetime in Pacific Time correctly', () => {
    expect(formatPacificDateTime(utcDateStr).replace(/\s+/g, ' ')).toMatch(/Jun 21, 2026,?\s+11:57\s*PM/i);
  });

  it('converts to Pacific Time zoned date correctly', () => {
    const pt = toPacificTime(utcDateStr);
    expect(pt.getFullYear()).toBe(2026);
    expect(pt.getMonth()).toBe(5); // June is 5
    expect(pt.getDate()).toBe(21);
    expect(pt.getHours()).toBe(23);
    expect(pt.getMinutes()).toBe(57);
  });

  it('converts from Pacific Time zoned date to UTC correctly', () => {
    const ptDate = new Date(2026, 5, 21, 23, 57, 0); // local day representation
    // Let's create from zoned representation of Jun 21, 23:57 PDT
    const utc = fromPacificTime('2026-06-21T23:57:00');
    expect(utc.toISOString()).toBe('2026-06-22T06:57:00.000Z');
  });
});

