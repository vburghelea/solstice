/**
 * BI Module Queries (Server Functions)
 *
 * Read-only server functions for BI operations.
 *
 * @see docs/sin-rfp/decisions/bi/SPEC-bi-platform.md
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { pivotQuerySchema } from "./bi.schemas";

// =============================================================================
// Dataset Queries
// =============================================================================

/**
 * Get available datasets for the current user
 */
export const getAvailableDatasets = createServerFn({ method: "GET" }).handler(
  async () => {
    // TODO: Implement in Slice 2
    // - Load dataset configs from semantic/datasets.config.ts
    // - Filter by user's org role and permissions
    // - Return dataset metadata (not data)
    return {
      datasets: [] as Array<{
        id: string;
        name: string;
        description: string;
        fieldCount: number;
      }>,
    };
  },
);

/**
 * Get field definitions for a specific dataset
 */
export const getDatasetFields = createServerFn({ method: "GET" })
  .inputValidator(z.object({ datasetId: z.string().min(1) }).parse)
  .handler(async ({ data }) => {
    const { datasetId } = data;

    // TODO: Implement in Slice 2
    // - Load dataset config
    // - Filter fields by user's role (minRole check)
    // - Return field metadata
    return {
      datasetId,
      fields: [] as Array<{
        column: string;
        label: string;
        type: string;
        allowDimension: boolean;
        allowMeasure: boolean;
      }>,
    };
  });

// =============================================================================
// Pivot Queries
// =============================================================================

/**
 * Execute a pivot query
 *
 * This is the main entry point for pivot table queries.
 * Delegates to engine/pivot-aggregator.ts for actual execution.
 */
export const executePivotQuery = createServerFn({ method: "POST" })
  .inputValidator(pivotQuerySchema.parse)
  .handler(async ({ data: query }) => {
    // TODO: Implement in Slice 1
    // 1. Validate dataset exists and user has access
    // 2. Build query context (user, org, role)
    // 3. Apply org scoping via governance/org-scoping.ts
    // 4. Apply field ACL via governance/field-acl.ts
    // 5. Execute via engine/pivot-aggregator.ts
    // 6. Log to bi_query_log
    // 7. Return result

    return {
      cells: [],
      dimensions: query.dimensions.map((d) => d.field),
      measures: query.measures.map((m) => `${m.aggregation}(${m.field})`),
      totalRows: 0,
      truncated: false,
      executionTimeMs: 0,
    };
  });

// =============================================================================
// Dashboard Queries (Phase 2)
// =============================================================================

/**
 * Get dashboards for the current organization
 */
export const getDashboards = createServerFn({ method: "GET" }).handler(async () => {
  // TODO: Implement in Slice 3
  return {
    dashboards: [] as Array<{
      id: string;
      name: string;
      description: string | null;
      widgetCount: number;
      createdAt: Date;
    }>,
  };
});

/**
 * Get a specific dashboard by ID
 */
export const getDashboard = createServerFn({ method: "GET" })
  .inputValidator(z.object({ dashboardId: z.uuid() }).parse)
  .handler(async ({ data }) => {
    const { dashboardId } = data;

    // TODO: Implement in Slice 3
    return {
      id: dashboardId,
      name: "",
      description: null,
      widgets: [],
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });
