import { describe, expect, it } from "vitest";
import { buildPivotResultFromSqlRows, buildPivotSqlPlan } from "../pivot-sql-compiler";
import { DATASETS } from "../../semantic";
import type { PivotMeasureMeta } from "../pivot-aggregator";

describe("pivot SQL compiler", () => {
  it("builds a plan with dimension aliases", () => {
    const dataset = DATASETS["organizations"];
    const plan = buildPivotSqlPlan({
      dataset,
      rowFields: ["type"],
      columnFields: ["status"],
      measures: [
        {
          field: null,
          aggregation: "count",
          key: "count:count",
          label: "Count",
        },
      ] as PivotMeasureMeta[],
      filters: [],
      limit: 1000,
      maskedFieldIds: new Set(),
    });

    expect(plan.rowDimensions).toEqual([
      { fieldId: "type", alias: "r0", column: "type", isMasked: false },
    ]);
    expect(plan.columnDimensions).toEqual([
      { fieldId: "status", alias: "c0", column: "status", isMasked: false },
    ]);
    expect(plan.measures[0]?.alias).toBe("m0");
  });

  it("masks dimension fields without grouping by raw values", () => {
    const dataset = DATASETS["reporting_submissions"];
    const plan = buildPivotSqlPlan({
      dataset,
      rowFields: ["submittedBy"],
      columnFields: [],
      measures: [
        {
          field: null,
          aggregation: "count",
          key: "count:count",
          label: "Count",
        },
      ] as PivotMeasureMeta[],
      filters: [],
      limit: 1000,
      maskedFieldIds: new Set(["submittedBy"]),
    });

    expect(plan.rowDimensions).toEqual([
      { fieldId: "submittedBy", alias: "r0", column: "submitted_by", isMasked: true },
    ]);
  });

  it("transforms grouped rows into pivot result", () => {
    const measures: PivotMeasureMeta[] = [
      {
        field: null,
        aggregation: "count",
        key: "count:count",
        label: "Count",
      },
    ];

    const result = buildPivotResultFromSqlRows({
      rows: [
        { r0: "club", c0: "active", m0: 4 },
        { r0: "club", c0: "inactive", m0: 2 },
        { r0: "league", c0: "active", m0: 1 },
      ],
      rowDimensions: [{ fieldId: "type", alias: "r0", column: "type" }],
      columnDimensions: [{ fieldId: "status", alias: "c0", column: "status" }],
      measures,
      measureAliases: [
        {
          key: "count:count",
          alias: "m0",
          aggregation: "count",
          fieldId: null,
        },
      ],
    });

    expect(result.rowFields).toEqual(["type"]);
    expect(result.columnFields).toEqual(["status"]);
    expect(result.columnKeys).toHaveLength(2);
    expect(result.rows).toHaveLength(2);

    const clubRow = result.rows.find((row) => row.values["type"] === "club");
    expect(clubRow?.cells[result.columnKeys[0]?.key ?? ""]?.["count:count"]).toBe(4);
    expect(clubRow?.cells[result.columnKeys[1]?.key ?? ""]?.["count:count"]).toBe(2);
  });
});
