import { describe, expect, it } from "vitest";
import { summarizeEventChanges } from "~/shared/lib/change-summary";

describe("summarizeEventChanges", () => {
  it("detects status, time, and location changes", () => {
    const prev = {
      status: "scheduled",
      dateTime: new Date("2024-01-01T00:00:00Z"),
      location: { address: "Old", lat: 0, lng: 0 },
    };
    const next = {
      status: "completed",
      dateTime: new Date("2024-01-02T00:00:00Z"),
      location: { address: "New", lat: 1, lng: 1 },
    };
    expect(summarizeEventChanges(prev, next)).toEqual([
      "Status changed to completed",
      "Rescheduled",
      "Location updated",
    ]);
  });

  it("returns empty array when nothing changed", () => {
    const prev = {
      status: "scheduled",
      dateTime: new Date("2024-01-01T00:00:00Z"),
      location: { address: "Same", lat: 0, lng: 0 },
    };
    const next = {
      status: "scheduled",
      dateTime: new Date("2024-01-01T00:00:00Z"),
      location: { address: "Same", lat: 0, lng: 0 },
    };
    expect(summarizeEventChanges(prev, next)).toEqual([]);
  });
});
