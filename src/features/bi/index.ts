/**
 * BI Module - Public API
 *
 * Self-service analytics and reporting for Solstice.
 * Implements viaSport requirements: RP-AGG-005, RP-AGG-003, SEC-AGG-004.
 *
 * @see docs/sin-rfp/decisions/bi/SPEC-bi-platform.md
 * @see docs/sin-rfp/decisions/bi/PLAN-bi-implementation.md
 */

// =============================================================================
// Schemas (contract-first types)
// =============================================================================

export {
  // Aggregation schemas
  aggregationTypeSchema,
  // Export schemas
  exportFormatSchema,
  exportRequestSchema,
  // Filter schemas
  filterOperatorSchema,
  filterSchema,
  filterValueSchema,
  pivotCellSchema,
  // Pivot schemas
  pivotDimensionSchema,
  pivotMeasureSchema,
  pivotQuerySchema,
  pivotResultSchema,
} from "./bi.schemas";

export type {
  AggregationType,
  ExportFormat,
  ExportRequest,
  Filter,
  FilterOperator,
  FilterValue,
  PivotCell,
  PivotDimension,
  PivotMeasure,
  PivotQuery,
  PivotResult,
} from "./bi.schemas";

// =============================================================================
// Types (complex/internal types)
// =============================================================================

export type {
  BiQueryLogEntry,
  Dashboard,
  DashboardWidget,
  DatasetConfig,
  DatasetField,
  QueryContext,
  QueryExecutionResult,
  WidgetPosition,
} from "./bi.types";

// =============================================================================
// Server Functions - Queries
// =============================================================================

export {
  executePivotQuery,
  getAvailableDatasets,
  getDashboard,
  getDashboards,
  getDatasetFields,
} from "./bi.queries";

// =============================================================================
// Server Functions - Mutations
// =============================================================================

export {
  addWidget,
  createDashboard,
  deleteDashboard,
  exportPivotResults,
  removeWidget,
  updateDashboard,
  updateWidget,
} from "./bi.mutations";

// =============================================================================
// Engine (internal - exported for testing)
// =============================================================================

// TODO: Export after Slice 1 implementation
// export { buildPivotResult } from './engine/pivot-aggregator';
// export { aggregators } from './engine/aggregations';
// export { applyFilters } from './engine/filters';

// =============================================================================
// Governance (internal - exported for testing)
// =============================================================================

// TODO: Export after Slice 2 implementation
// export { applyOrgScoping } from './governance/org-scoping';
// export { applyFieldAcl } from './governance/field-acl';
