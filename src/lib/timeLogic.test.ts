import { describe, it, expect } from 'vitest';
import { determineCheckinStatus } from './timeLogic';

describe('determineCheckinStatus', () => {
  const opens = new Date('2026-05-17T10:00:00Z');
  const late = new Date('2026-05-17T10:15:00Z');
  const closes = new Date('2026-05-17T11:00:00Z');
  
  it('returns on_time', () => {
    expect(determineCheckinStatus({ now: new Date('2026-05-17T10:05:00Z'), opens_at: opens, late_after: late, closes_at: closes }).status).toBe('on_time');
  });
});
