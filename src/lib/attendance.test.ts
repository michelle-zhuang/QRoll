import { describe, it, expect } from "vitest";
import { MockQueryBuilder, markAbsentForClosedEvents } from "./supabase";

const mockSupabase = {
  from(table: string) {
    return new MockQueryBuilder(table);
  }
};

describe("markAbsentForClosedEvents", () => {
  it("should mark roster members as absent for closed events they did not check into", async () => {
    const { data: initialAttendance } = await mockSupabase.from('attendance').select('*');
    const initialCount = initialAttendance?.length || 0;

    await markAbsentForClosedEvents(mockSupabase);

    const { data: finalAttendance } = await mockSupabase.from('attendance').select('*');
    expect(finalAttendance.length).toBeGreaterThan(initialCount);

    // Confirm that the newly created records have the status 'absent'
    const addedRecords = finalAttendance.slice(initialCount);
    expect(addedRecords.every((r: any) => r.status === 'absent')).toBe(true);
  });
});
