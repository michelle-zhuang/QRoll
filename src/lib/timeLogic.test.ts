import { describe, it, expect } from 'vitest';
import { determineCheckinStatus } from './timeLogic';

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
