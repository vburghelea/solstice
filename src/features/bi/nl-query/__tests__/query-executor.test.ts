import { describe, expect, it, vi } from "vitest";
import type { PivotResult } from "../../bi.schemas";
import type { QueryContext } from "../../bi.types";
import type { QueryIntent } from "../nl-query.schemas";
import type { SemanticCatalog } from "../semantic-layer";

const executePivotQueryInternalMock = vi.fn();

vi.mock("~/features/bi/engine/pivot-runner", () => ({
  executePivotQueryInternal: (...args: unknown[]) =>
    executePivotQueryInternalMock(...args),
}));

import { executeQueryIntent } from "../query-executor";

const baseContext: QueryContext = {
  userId: "user-1",
  organizationId: "org-1",
  orgRole: "reporter",
  isGlobalAdmin: false,
  permissions: new Set(),
  hasRecentAuth: false,
  timestamp: new Date("2024-01-01T00:00:00.000Z"),
};

const catalog: SemanticCatalog = {
  datasets: [
    {
      id: "events",
      name: "Events",
      description: "Event metadata",
      metrics: [
        {
          id: "events_total",
          name: "Total events",
          description: "Count of events",
          aggregation: "count",
          fieldId: "id",
          datasetId: "events",
          source: "metric",
        },
      ],
      dimensions: [
        {
          id: "sport",
          name: "Sport",
          description: "Sport name",
          fieldId: "sport",
          datasetId: "events",
          type: "string",
        },
      ],
    },
  ],
};

describe("executeQueryIntent", () => {
  it("translates intent and executes pivot query", async () => {
    const pivot: PivotResult = {
      rowFields: ["sport"],
      columnFields: [],
      measures: [
        {
          field: "id",
          aggregation: "count",
          key: "metric:events_total",
          label: "Total events",
        },
      ],
      columnKeys: [{ key: "__total__", label: "Total", values: {} }],
      rows: [
        {
          key: "Soccer",
          values: { sport: "Soccer" },
          cells: { __total__: { "metric:events_total": 12 } },
        },
      ],
    };

    executePivotQueryInternalMock.mockResolvedValue({
      pivot,
      rowCount: 12,
      executionTimeMs: 42,
    });

    const intent: QueryIntent = {
      datasetId: "events",
      metrics: ["events_total"],
      dimensions: ["sport"],
      filters: [
        {
          dimensionId: "sport",
          operator: "eq",
          value: "Soccer",
        },
      ],
      limit: 100,
      confidence: 0.9,
      explanation: "Count events by sport.",
    };

    const result = await executeQueryIntent(intent, {
      context: { organizationId: "org-1" },
      userId: "user-1",
      organizationId: "org-1",
      queryContext: baseContext,
      catalog,
    });

    expect(executePivotQueryInternalMock).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({
          datasetId: "events",
          rows: ["sport"],
          columns: [],
          filters: [
            {
              field: "sport",
              datasetId: "events",
              operator: "eq",
              value: "Soccer",
            },
          ],
        }),
      }),
    );
    expect(result.pivot.rows.length).toBe(1);
    expect(result.rowCount).toBe(12);
  });

  it("rejects intents that do not match the catalog", async () => {
    const intent: QueryIntent = {
      datasetId: "events",
      metrics: ["unknown_metric"],
      dimensions: [],
      filters: [],
      limit: 100,
      confidence: 0.5,
      explanation: "Invalid metric.",
    };

    await expect(
      executeQueryIntent(intent, {
        context: {},
        userId: "user-1",
        queryContext: baseContext,
        catalog,
      }),
    ).rejects.toThrow("Unknown metric");
  });
});
