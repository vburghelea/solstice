/**
 * BI Module Schemas
 *
 * Zod schemas for BI operations including pivot queries, filters, and exports.
 * These schemas serve as the contract-first source of truth for the BI API.
 *
 * @see docs/sin-rfp/decisions/bi/SPEC-bi-platform.md
 */

import { z } from "zod";

// =============================================================================
// Filter Operators (Phase 1 - Current Implementation)
// =============================================================================

/**
 * Phase 1 filter operators - matches current reports.config.ts
 */
export const filterOperatorSchema = z.enum([
  "eq", // equals
  "neq", // not equals
  "gt", // greater than
  "gte", // greater than or equal
  "lt", // less than
  "lte", // less than or equal
  "in", // in array
  "between", // between two values
]);

export type FilterOperator = z.infer<typeof filterOperatorSchema>;

// =============================================================================
// Aggregation Types (Phase 1 - Current Implementation)
// =============================================================================

/**
 * Phase 1 aggregations - matches current reports.mutations.ts
 */
export const aggregationTypeSchema = z.enum(["count", "sum", "avg", "min", "max"]);

export type AggregationType = z.infer<typeof aggregationTypeSchema>;

// =============================================================================
// Filter Schemas
// =============================================================================

export const filterValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.union([z.string(), z.number()])),
]);

export type FilterValue = z.infer<typeof filterValueSchema>;

export const filterSchema = z.object({
  field: z.string().min(1),
  operator: filterOperatorSchema,
  value: filterValueSchema,
});

export type Filter = z.infer<typeof filterSchema>;

// =============================================================================
// Pivot Query Schemas
// =============================================================================

export const pivotDimensionSchema = z.object({
  field: z.string().min(1),
  label: z.string().optional(),
});

export type PivotDimension = z.infer<typeof pivotDimensionSchema>;

export const pivotMeasureSchema = z.object({
  field: z.string().min(1),
  aggregation: aggregationTypeSchema,
  label: z.string().optional(),
});

export type PivotMeasure = z.infer<typeof pivotMeasureSchema>;

export const pivotQuerySchema = z.object({
  datasetId: z.string().min(1),
  dimensions: z.array(pivotDimensionSchema).default([]),
  measures: z.array(pivotMeasureSchema).min(1),
  filters: z.array(filterSchema).default([]),
  limit: z.number().int().min(1).max(10000).default(1000),
});

export type PivotQuery = z.infer<typeof pivotQuerySchema>;

// =============================================================================
// Export Schemas
// =============================================================================

export const exportFormatSchema = z.enum(["csv", "xlsx", "json"]);

export type ExportFormat = z.infer<typeof exportFormatSchema>;

export const exportRequestSchema = z.object({
  queryId: z.uuid().optional(),
  pivotQuery: pivotQuerySchema.optional(),
  format: exportFormatSchema,
  includeHeaders: z.boolean().default(true),
});

export type ExportRequest = z.infer<typeof exportRequestSchema>;

// =============================================================================
// Pivot Result Schemas
// =============================================================================

export const pivotCellSchema = z.object({
  dimensionValues: z.record(z.string(), z.unknown()),
  measureValues: z.record(z.string(), z.union([z.number(), z.null()])),
});

export type PivotCell = z.infer<typeof pivotCellSchema>;

export const pivotResultSchema = z.object({
  cells: z.array(pivotCellSchema),
  dimensions: z.array(z.string()),
  measures: z.array(z.string()),
  totalRows: z.number().int().nonnegative(),
  truncated: z.boolean(),
  executionTimeMs: z.number().nonnegative(),
});

export type PivotResult = z.infer<typeof pivotResultSchema>;
