import { describe, expect, it } from "vitest";
import { convertDateFormat, swapColumns } from "../autofix-engine";

describe("autofix-engine", () => {
  it("swaps column values", () => {
    const rows = [{ a: "one", b: "two" }];
    const result = swapColumns(rows, "a", "b");

    expect(result.success).toBe(true);
    expect(result.rows[0]).toEqual({ a: "two", b: "one" });
  });

  it("converts date format to ISO", () => {
    const rows = [{ date: "12/31/2024" }];
    const result = convertDateFormat(rows, "date", "MM/dd/yyyy", "yyyy-MM-dd");

    expect(result.success).toBe(true);
    expect(result.rows[0]["date"]).toBe("2024-12-31");
  });
});
