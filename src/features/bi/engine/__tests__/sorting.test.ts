import { describe, expect, it } from "vitest";
import type { DatasetConfig } from "../../bi.types";
import { buildAllowedSortFields, normalizeSort } from "../sorting";

const dataset: DatasetConfig = {
  id: "organizations",
  name: "Organizations",
  baseTable: "organizations",
  fields: [
    {
      id: "name",
      name: "Name",
      sourceColumn: "name",
      dataType: "string",
      allowSort: true,
    },
    {
      id: "status",
      name: "Status",
      sourceColumn: "status",
      dataType: "enum",
      allowSort: false,
    },
  ],
};

describe("sorting helpers", () => {
  it("builds allowed sort fields", () => {
    const allowed = buildAllowedSortFields(dataset);
    expect(allowed.has("name")).toBe(true);
    expect(allowed.has("status")).toBe(false);
  });

  it("normalizes sort config", () => {
    const allowed = buildAllowedSortFields(dataset);
    expect(normalizeSort({ field: "name", direction: "asc" }, allowed)).toEqual({
      field: "name",
      direction: "asc",
    });
  });

  it("throws on disallowed sort fields", () => {
    const allowed = buildAllowedSortFields(dataset);
    expect(() => normalizeSort({ field: "status", direction: "desc" }, allowed)).toThrow(
      "Sort field 'status' is not allowed",
    );
  });
});
