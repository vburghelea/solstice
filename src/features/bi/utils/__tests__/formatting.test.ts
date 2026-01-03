import { describe, expect, it } from "vitest";
import { formatDimensionValue } from "../formatting";
import type { DatasetField } from "../../bi.types";

describe("formatDimensionValue", () => {
  it("renders masked values", () => {
    expect(formatDimensionValue("***")).toBe("Masked");
  });

  it("maps enum labels", () => {
    const field: DatasetField = {
      id: "status",
      name: "Status",
      sourceColumn: "status",
      dataType: "enum",
      enumValues: [{ value: "active", label: "Active" }],
    };

    expect(formatDimensionValue("active", field)).toBe("Active");
  });
});
