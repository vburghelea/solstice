/**
 * BI Module - Public API
 */

// =============================================================================
// Schemas (contract-first types)
// =============================================================================

export {
  aggregationTypeSchema,
  chartTypeSchema,
  datasetDefinitionSchema,
  datasetFieldSchema,
  datasetJoinSchema,
  exportFormatSchema,
  exportRequestSchema,
  filterOperatorSchema,
  filterSchema,
  filterValueSchema,
  formatOptionsSchema,
  biQueryLogFilterSchema,
  pivotMeasureMetaSchema,
  pivotMeasureSchema,
  pivotQuerySchema,
  pivotResultSchema,
  sqlQuerySchema,
  sqlSchemaRequestSchema,
  widgetTypeSchema,
} from "./bi.schemas";

export type {
  AggregationType,
  ChartType,
  DatasetDefinition,
  DatasetField,
  DatasetJoin,
  ExportFormat,
  ExportRequest,
  FilterConfig,
  FilterOperator,
  FilterValue,
  FormatOptions,
  PivotMeasure,
  PivotMeasureMeta,
  PivotQuery,
  PivotResult,
  BiQueryLogFilter,
  SqlQueryRequest,
  SqlSchemaRequest,
  WidgetType,
} from "./bi.schemas";

// =============================================================================
// Types (complex/internal types)
// =============================================================================

export type {
  BiQueryLogEntry,
  ChartConfig,
  Dashboard,
  DashboardLayout,
  DashboardWidget as DashboardWidgetType,
  DashboardWidgetPosition,
  DatasetConfig,
  DatasetField as DatasetFieldConfig,
  QueryContext,
  QueryExecutionResult,
  SqlConfig,
  WidgetConfig,
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
  getSqlSchema,
  executeSqlQuery,
  listBiQueryLogs,
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

export {
  aggregators,
  aggregatorsPhase2,
  applyFilters,
  buildPivotResult,
  executeAggregation,
} from "./engine";

// =============================================================================
// Hooks + UI Components
// =============================================================================

export { useCreateDashboard, useDashboard, useDashboards } from "./hooks/use-dashboard";

export { PivotBuilder } from "./components/pivot-builder/PivotBuilder";
export { SqlWorkbench } from "./components/sql-workbench/SqlWorkbench";
export { DashboardCanvas } from "./components/dashboard/DashboardCanvas";
export { DashboardWidget } from "./components/dashboard/DashboardWidget";
export { AddWidgetModal } from "./components/dashboard/AddWidgetModal";
