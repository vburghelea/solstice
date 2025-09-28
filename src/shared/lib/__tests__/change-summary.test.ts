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

  it("describes cancellations with a concise message", () => {
    const prev = { status: "scheduled" };
    const next = { status: "canceled" };
    expect(summarizeEventChanges(prev, next)).toEqual(["Canceled"]);
  });

  it("ignores optional location fields when the location is unchanged", () => {
    const prev = {
      location: { address: "Same", lat: 12.34, lng: 56.78, placeId: null },
    };
    const next = {
      location: { address: "Same", lat: "12.34", lng: "56.78" },
    };
    expect(summarizeEventChanges(prev, next)).toEqual([]);
  });
});
