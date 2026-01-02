/**
 * BI Module Schemas
 *
 * Contract-first Zod schemas for BI operations, datasets, and query configs.
 *
 * @see src/features/bi/docs/SPEC-bi-platform.md
 */

import { z } from "zod";
import { jsonRecordSchema } from "~/shared/lib/json";

// =============================================================================
// Operators + Aggregations
// =============================================================================

export const filterOperatorSchema = z.enum([
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
  "in",
  "between",
  "not_in",
  "contains",
  "starts_with",
  "ends_with",
  "is_null",
  "is_not_null",
]);

export type FilterOperator = z.infer<typeof filterOperatorSchema>;

export const aggregationTypeSchema = z.enum([
  "count",
  "sum",
  "avg",
  "min",
  "max",
  "count_distinct",
  "median",
  "stddev",
  "variance",
]);

export type AggregationType = z.infer<typeof aggregationTypeSchema>;

export const chartTypeSchema = z.enum([
  "table",
  "bar",
  "line",
  "area",
  "pie",
  "donut",
  "heatmap",
  "scatter",
  "kpi",
]);

export type ChartType = z.infer<typeof chartTypeSchema>;

export const widgetTypeSchema = z.enum(["chart", "pivot", "kpi", "text", "filter"]);

export type WidgetType = z.infer<typeof widgetTypeSchema>;

// =============================================================================
// Filters
// =============================================================================

const filterPrimitiveSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

export const filterValueSchema = z.union([
  filterPrimitiveSchema,
  z.array(filterPrimitiveSchema),
]);

export type FilterValue = z.infer<typeof filterValueSchema>;

export const filterSchema = z.object({
  field: z.string().min(1),
  datasetId: z.string().optional(),
  operator: filterOperatorSchema,
  value: filterValueSchema.optional(),
  label: z.string().optional(),
});

export type FilterConfig = z.infer<typeof filterSchema>;

export const fieldValueSuggestionsSchema = z.object({
  datasetId: z.string().min(1),
  fieldId: z.string().min(1),
  organizationId: z.uuid().optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(25),
  filters: z.array(filterSchema).default([]),
});

export type FieldValueSuggestionsRequest = z.infer<typeof fieldValueSuggestionsSchema>;

// =============================================================================
// Dataset Definitions
// =============================================================================

export const datasetJoinSchema = z.object({
  table: z.string().min(1),
  type: z.enum(["inner", "left", "right"]),
  on: z.object({
    left: z.string().min(1),
    right: z.string().min(1),
  }),
});

export type DatasetJoin = z.infer<typeof datasetJoinSchema>;

export const formatOptionsSchema = z.object({
  decimals: z.number().int().min(0).optional(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  thousandsSeparator: z.string().optional(),
  dateFormat: z.string().optional(),
  currency: z.string().optional(),
});

export type FormatOptions = z.infer<typeof formatOptionsSchema>;

export const datasetFreshnessSchema = z.object({
  sourceSystem: z.string().min(1),
  updateCadence: z.string().min(1),
  lastUpdatedField: z.string().optional(),
});

export type DatasetFreshness = z.infer<typeof datasetFreshnessSchema>;

export const datasetFieldSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  sourceColumn: z.string().min(1),
  sourceTable: z.string().optional(),
  derivedFrom: z.string().optional(),
  timeGrain: z.enum(["day", "week", "month", "quarter"]).optional(),
  dataType: z.enum([
    "string",
    "number",
    "date",
    "datetime",
    "boolean",
    "enum",
    "json",
    "uuid",
  ]),
  piiClassification: z.enum(["none", "personal", "sensitive", "restricted"]).optional(),
  requiredPermission: z.string().optional(),
  formatType: z
    .enum(["text", "number", "currency", "percent", "date", "datetime"])
    .optional(),
  formatOptions: formatOptionsSchema.optional(),
  allowFilter: z.boolean().optional(),
  allowSort: z.boolean().optional(),
  allowGroupBy: z.boolean().optional(),
  allowAggregate: z.boolean().optional(),
  defaultAggregation: aggregationTypeSchema.optional(),
  enumValues: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
      }),
    )
    .optional(),
});

export type DatasetField = z.infer<typeof datasetFieldSchema>;

export const datasetDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  baseTable: z.string().min(1),
  joins: z.array(datasetJoinSchema).optional(),
  fields: z.array(datasetFieldSchema),
  isPublic: z.boolean().optional(),
  allowedRoles: z.array(z.string()).optional(),
  freshness: datasetFreshnessSchema.optional(),
});

export type DatasetDefinition = z.infer<typeof datasetDefinitionSchema>;

// =============================================================================
// Pivot Config + Queries
// =============================================================================

export const pivotMeasureSchema = z.object({
  id: z.string().min(1).optional(),
  field: z.string().min(1).nullable().optional(),
  metricId: z.string().min(1).optional(),
  aggregation: aggregationTypeSchema,
  label: z.string().optional(),
});

export type PivotMeasure = z.infer<typeof pivotMeasureSchema>;

export const pivotQuerySchema = z.object({
  datasetId: z.string().min(1),
  organizationId: z.uuid().optional(),
  rows: z.array(z.string()).default([]),
  columns: z.array(z.string()).default([]),
  measures: z.array(pivotMeasureSchema).min(1),
  filters: z.array(filterSchema).default([]),
  limit: z.number().int().min(1).max(10000).default(1000),
});

export type PivotQuery = z.infer<typeof pivotQuerySchema>;

// =============================================================================
// Pivot Results
// =============================================================================

export const pivotMeasureMetaSchema = z.object({
  field: z.string().nullable(),
  aggregation: aggregationTypeSchema,
  key: z.string().min(1),
  label: z.string().min(1),
});

export type PivotMeasureMeta = z.infer<typeof pivotMeasureMetaSchema>;

export const pivotColumnKeySchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  values: z.record(z.string(), z.string()),
});

export const pivotRowSchema = z.object({
  key: z.string().min(1),
  values: z.record(z.string(), z.string()),
  cells: z.record(z.string(), z.record(z.string(), z.number().nullable())),
});

export const pivotResultSchema = z.object({
  rowFields: z.array(z.string()),
  columnFields: z.array(z.string()),
  measures: z.array(pivotMeasureMetaSchema),
  columnKeys: z.array(pivotColumnKeySchema),
  rows: z.array(pivotRowSchema),
});

export type PivotResult = z.infer<typeof pivotResultSchema>;

// =============================================================================
// Exports
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
// SQL Workbench
// =============================================================================

export const sqlQuerySchema = z.object({
  sql: z.string().min(1),
  parameters: jsonRecordSchema.optional(),
  datasetId: z.string().min(1).optional(),
});

export type SqlQueryRequest = z.infer<typeof sqlQuerySchema>;

export const sqlSchemaRequestSchema = z.object({
  datasetId: z.string().min(1).optional(),
});

export type SqlSchemaRequest = z.infer<typeof sqlSchemaRequestSchema>;

export const biQueryLogFilterSchema = z.object({
  organizationId: z.uuid().optional(),
  userId: z.string().min(1).optional(),
  queryType: z.enum(["sql", "pivot", "export"]).optional(),
  datasetId: z.uuid().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.number().int().min(1).max(200).optional(),
});

export type BiQueryLogFilter = z.infer<typeof biQueryLogFilterSchema>;
