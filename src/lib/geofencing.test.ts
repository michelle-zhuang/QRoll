import { describe, it, expect } from "vitest";
import { calculateDistance } from "./geofencing";

describe("Haversine Distance", () => {
  it("should calculate distance between two coordinates accurately", () => {
    // Space Needle to Pike Place Market (~1200 meters)
    const spaceNeedle = { lat: 47.6205, lon: -122.3493 };
    const pikePlace = { lat: 47.6097, lon: -122.3422 };
    
    const distance = calculateDistance(
      spaceNeedle.lat,
      spaceNeedle.lon,
      pikePlace.lat,
      pikePlace.lon
    );
    
    expect(distance).toBeGreaterThan(1100);
    expect(distance).toBeLessThan(1400);
  });

  it("should return 0 for identical points", () => {
    expect(calculateDistance(45, -120, 45, -120)).toBe(0);
  });
});
