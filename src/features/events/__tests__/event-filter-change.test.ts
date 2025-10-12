import { describe, expect, it } from "vitest";

import type { EventFilters } from "~/features/events/events.types";
import { applyEventFilterChange } from "~/features/events/utils";

const createFilters = (filters: EventFilters = {}): EventFilters => ({ ...filters });

describe("applyEventFilterChange", () => {
  it("returns the original filters when removing a non-existent key", () => {
    const filters = createFilters({ city: "Toronto" });
    const result = applyEventFilterChange(filters, "country", undefined);

    expect(result.changed).toBe(false);
    expect(result.nextFilters).toBe(filters);
  });

  it("removes keys when the value is empty", () => {
    const filters = createFilters({ city: "Toronto" });
    const result = applyEventFilterChange(filters, "city", " ");

    expect(result.changed).toBe(true);
    expect(result.nextFilters).toEqual({});
  });

  it("trims string values before comparing", () => {
    const filters = createFilters({ city: "Toronto" });
    const result = applyEventFilterChange(filters, "city", " Toronto  ");

    expect(result.changed).toBe(false);
    expect(result.nextFilters).toBe(filters);
  });

  it("preserves referential equality when the value does not change", () => {
    const filters = createFilters({ status: "published" });
    const result = applyEventFilterChange(filters, "status", "published");

    expect(result.changed).toBe(false);
    expect(result.nextFilters).toBe(filters);
  });

  it("replaces array values when they change", () => {
    const filters = createFilters({ type: ["tournament"] });
    const result = applyEventFilterChange(filters, "type", ["league"]);

    expect(result.changed).toBe(true);
    expect(result.nextFilters).toEqual({ type: ["league"] });
  });

  it("keeps array values when they are identical", () => {
    const filters = createFilters({ type: ["tournament", "league"] });
    const value = ["tournament", "league"] as EventFilters["type"];
    const result = applyEventFilterChange(filters, "type", value);

    expect(result.changed).toBe(false);
    expect(result.nextFilters).toBe(filters);
  });
});
