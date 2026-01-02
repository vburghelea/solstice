import { describe, expect, it } from "vitest";
import { estimateQueryCost } from "../query-cost";
import type { PivotQuery } from "../../bi.schemas";

const baseQuery: PivotQuery = {
  datasetId: "events",
  organizationId: undefined,
  rows: [],
  columns: [],
  measures: [{ field: null, aggregation: "count" }],
  filters: [],
  limit: 1000,
};

describe("estimateQueryCost", () => {
  it("marks queries without measures as unsafe", () => {
    const cost = estimateQueryCost({ ...baseQuery, measures: [] });
    expect(cost.isSafe).toBe(false);
    expect(cost.estimatedCardinality).toBe(0);
  });

  it("treats single-total queries as safe", () => {
    const cost = estimateQueryCost(baseQuery);
    expect(cost.isSafe).toBe(true);
    expect(cost.estimatedCardinality).toBe(1);
  });

  it("flags multi-dimension queries without filters", () => {
    const cost = estimateQueryCost({
      ...baseQuery,
      rows: ["type"],
      columns: ["status"],
    });
    expect(cost.isSafe).toBe(false);
    expect(cost.reason).toBeTruthy();
  });

  it("treats filtered single-dimension queries as safe", () => {
    const cost = estimateQueryCost({
      ...baseQuery,
      rows: ["type"],
      filters: [
        {
          field: "status",
          operator: "eq",
          value: "active",
        },
      ],
    });
    expect(cost.isSafe).toBe(true);
  });
});
