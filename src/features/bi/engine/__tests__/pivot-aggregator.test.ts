import { describe, expect, it } from "vitest";
import { groupByDimensions, parseDimensionKey } from "../pivot-aggregator";

describe("groupByDimensions", () => {
  it("groups rows by dimension values", () => {
    const rows = [
      { status: "active", type: "club" },
      { status: "active", type: "league" },
      { status: "inactive", type: "club" },
    ];

    const grouped = groupByDimensions(rows, ["status"]);

    expect(grouped.get("active")?.length).toBe(2);
    expect(grouped.get("inactive")?.length).toBe(1);
  });

  it("returns a single group when no dimensions", () => {
    const rows = [{ id: 1 }, { id: 2 }];
    const grouped = groupByDimensions(rows, []);

    expect(grouped.get("__total__")?.length).toBe(2);
  });
});

describe("parseDimensionKey", () => {
  it("parses dimension keys back to values", () => {
    const values = parseDimensionKey("club|active", ["type", "status"]);
    expect(values).toEqual({ type: "club", status: "active" });
  });

  it("handles empty key segments", () => {
    const values = parseDimensionKey("club|", ["type", "status"]);
    expect(values).toEqual({ type: "club", status: "" });
  });
});
