import { describe, expect, it, vi } from "vitest";
import type { DatasetConfig, QueryContext } from "~/features/bi/bi.types";

const datasets = vi.hoisted<Record<string, DatasetConfig>>(() => {
  const baseField = {
    id: "id",
    name: "ID",
    description: "Primary identifier",
    sourceColumn: "id",
    dataType: "uuid",
    allowGroupBy: true,
    allowFilter: true,
    allowAggregate: true,
    defaultAggregation: "count",
  } as const;

  return {
    public: {
      id: "public",
      name: "Public Dataset",
      description: "Public data",
      baseTable: "public_table",
      requiresOrgScope: false,
      fields: [
        baseField,
        {
          id: "secret",
          name: "Secret",
          description: "Restricted field",
          sourceColumn: "secret",
          dataType: "string",
          allowGroupBy: true,
          allowFilter: true,
          allowAggregate: true,
          requiredPermission: "pii.read",
        },
      ],
    },
    restricted: {
      id: "restricted",
      name: "Restricted Dataset",
      description: "Admin-only data",
      baseTable: "restricted_table",
      requiresOrgScope: false,
      allowedRoles: ["admin"],
      fields: [baseField],
    },
  };
});

const metrics = vi.hoisted(() => [
  {
    id: "public_total",
    name: "Public Total",
    description: "Count public rows",
    datasetId: "public",
    fieldId: "id",
    expression: "id",
    aggregation: "count",
  },
  {
    id: "secret_total",
    name: "Secret Total",
    description: "Count secret rows",
    datasetId: "public",
    fieldId: "secret",
    expression: "secret",
    aggregation: "count",
    requiredPermission: "metrics.secret",
  },
]);

vi.mock("~/features/bi/semantic", () => ({
  DATASETS: datasets,
}));

vi.mock("~/features/bi/semantic/metrics.config", () => ({
  METRICS: metrics,
}));

import { buildCatalogPrompt, buildNlCatalog } from "../semantic-layer";
import { validateCatalogSelection } from "../query-validator";

const baseContext = (overrides?: Partial<QueryContext>): QueryContext => ({
  userId: "user-1",
  organizationId: "org-1",
  orgRole: "reporter",
  isGlobalAdmin: false,
  permissions: new Set(),
  hasRecentAuth: false,
  timestamp: new Date("2024-01-01T00:00:00.000Z"),
  ...overrides,
});

describe("nl query semantic catalog", () => {
  it("filters datasets based on org role", () => {
    const catalog = buildNlCatalog(baseContext());
    expect(catalog.datasets.map((dataset) => dataset.id)).toEqual(["public"]);
  });

  it("filters fields and metrics by permissions", () => {
    const catalog = buildNlCatalog(baseContext());
    const dataset = catalog.datasets[0];

    expect(dataset?.dimensions.map((dimension) => dimension.id)).toEqual(["id"]);
    expect(dataset?.metrics.map((metric) => metric.id)).toEqual(
      expect.arrayContaining(["id", "public_total"]),
    );
    expect(dataset?.metrics.some((metric) => metric.id === "secret_total")).toBe(false);
  });

  it("includes restricted fields and metrics when permissions allow", () => {
    const catalog = buildNlCatalog(
      baseContext({
        permissions: new Set(["pii.read", "metrics.secret"]),
      }),
    );
    const dataset = catalog.datasets[0];

    expect(dataset?.dimensions.some((dimension) => dimension.id === "secret")).toBe(true);
    expect(dataset?.metrics.some((metric) => metric.id === "secret_total")).toBe(true);
  });

  it("builds prompt strings with dataset-qualified entries", () => {
    const catalog = buildNlCatalog(baseContext());
    const prompt = buildCatalogPrompt(catalog);
    expect(prompt.metrics).toContain("[public] public_total");
    expect(prompt.dimensions).toContain("[public] id");
  });
});

describe("nl query catalog validator", () => {
  it("validates dataset, metrics, and dimensions", () => {
    const catalog = buildNlCatalog(
      baseContext({
        permissions: new Set(["pii.read", "metrics.secret"]),
      }),
    );

    const valid = validateCatalogSelection(catalog, {
      datasetId: "public",
      metrics: ["public_total"],
      dimensions: ["id"],
      sortField: "id",
    });
    expect(valid.ok).toBe(true);

    const invalidDataset = validateCatalogSelection(catalog, {
      datasetId: "missing",
      metrics: ["public_total"],
    });
    expect(invalidDataset.ok).toBe(false);
    if (!invalidDataset.ok) {
      expect(invalidDataset.errors).toContain("Unknown dataset: missing");
    }

    const invalidMetric = validateCatalogSelection(catalog, {
      datasetId: "public",
      metrics: ["unknown_metric"],
    });
    expect(invalidMetric.ok).toBe(false);
    if (!invalidMetric.ok) {
      expect(invalidMetric.errors).toContain("Unknown metric: unknown_metric");
    }
  });
});
