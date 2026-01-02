import { describe, expect, it } from "vitest";
import { suggestChartType } from "../chart-suggestion";
import type { DatasetField } from "../../bi.types";
import type { AggregationType } from "../../bi.schemas";

const fields = new Map<string, DatasetField>([
  [
    "createdAt",
    {
      id: "createdAt",
      name: "Created",
      sourceColumn: "created_at",
      dataType: "datetime",
      allowGroupBy: true,
      allowFilter: true,
      allowAggregate: false,
    },
  ],
  [
    "status",
    {
      id: "status",
      name: "Status",
      sourceColumn: "status",
      dataType: "string",
      allowGroupBy: true,
      allowFilter: true,
      allowAggregate: false,
    },
  ],
]);

const measures: Array<{ field: string | null; aggregation: AggregationType }> = [
  { field: null, aggregation: "count" },
];

describe("suggestChartType", () => {
  it("suggests line for temporal breakdown", () => {
    const suggestion = suggestChartType({
      rows: ["createdAt"],
      columns: [],
      measures,
      fieldsById: fields,
    });
    expect(suggestion?.chartType).toBe("line");
  });

  it("suggests bar for categorical breakdown", () => {
    const suggestion = suggestChartType({
      rows: ["status"],
      columns: [],
      measures,
      fieldsById: fields,
    });
    expect(suggestion?.chartType).toBe("bar");
  });

  it("suggests heatmap for two dimensions", () => {
    const suggestion = suggestChartType({
      rows: ["status"],
      columns: ["createdAt"],
      measures,
      fieldsById: fields,
    });
    expect(suggestion?.chartType).toBe("heatmap");
  });

  it("suggests table for complex pivots", () => {
    const suggestion = suggestChartType({
      rows: ["status", "createdAt"],
      columns: ["status"],
      measures,
      fieldsById: fields,
    });
    expect(suggestion?.chartType).toBe("table");
  });
});
