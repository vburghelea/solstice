/**
 * BI Module Types
 *
 * TypeScript types for BI operations, datasets, and governance.
 *
 * @see src/features/bi/docs/SPEC-bi-platform.md
 */

import type { OrganizationRole } from "~/lib/auth/guards/org-guard";
import type { JsonRecord } from "~/shared/lib/json";
import type {
  AggregationType,
  ChartType,
  DatasetDefinition,
  ExportFormat,
  FilterConfig,
  FilterOperator,
  PivotMeasure,
  PivotQuery,
  PivotResult,
  WidgetType,
} from "./bi.schemas";

export type {
  AggregationType,
  ChartType,
  DatasetDefinition,
  ExportFormat,
  FilterConfig,
  FilterOperator,
  PivotMeasure,
  PivotQuery,
  PivotResult,
  WidgetType,
};

// =============================================================================
// Dataset Types
// =============================================================================

export interface DatasetJoin {
  table: string;
  type: "inner" | "left" | "right";
  on: { left: string; right: string };
}

export interface DatasetFreshness {
  sourceSystem: string;
  updateCadence: string;
  lastUpdatedField?: string;
}

export interface FormatOptions {
  decimals?: number;
  prefix?: string;
  suffix?: string;
  thousandsSeparator?: string;
  dateFormat?: string;
  currency?: string;
}

export interface DatasetField {
  id: string;
  name: string;
  description?: string;
  sourceColumn: string;
  sourceTable?: string;
  derivedFrom?: string;
  timeGrain?: "day" | "week" | "month" | "quarter";
  dataType:
    | "string"
    | "number"
    | "date"
    | "datetime"
    | "boolean"
    | "enum"
    | "json"
    | "uuid";
  piiClassification?: "none" | "personal" | "sensitive" | "restricted";
  requiredPermission?: string;
  formatType?: "text" | "number" | "currency" | "percent" | "date" | "datetime";
  formatOptions?: FormatOptions;
  allowFilter?: boolean;
  allowSort?: boolean;
  allowGroupBy?: boolean;
  allowAggregate?: boolean;
  defaultAggregation?: AggregationType;
  enumValues?: Array<{ value: string; label: string }>;
}

export interface DatasetConfig {
  id: string;
  name: string;
  description?: string;
  baseTable: string;
  joins?: DatasetJoin[];
  fields: DatasetField[];
  isPublic?: boolean;
  allowedRoles?: string[];
  freshness?: DatasetFreshness;
  requiresOrgScope?: boolean;
  orgScopeColumn?: string;
}

// =============================================================================
// Query Config Types
// =============================================================================

export interface PivotConfig {
  rows: string[];
  columns: string[];
  measures: Array<{
    id?: string;
    field: string | null;
    aggregation: AggregationType;
    metricId?: string;
    label?: string;
    format?: FormatOptions;
  }>;
  showRowTotals?: boolean;
  showColumnTotals?: boolean;
  showGrandTotal?: boolean;
}

export interface SqlConfig {
  query: string;
  parameters: Array<{
    name: string;
    type: "string" | "number" | "date" | "uuid";
    defaultValue?: unknown;
    required?: boolean;
  }>;
}

export interface ChartConfig {
  xAxis?: string;
  yAxis?: string | string[];
  series?: string;
  colorBy?: string;
  options?: Record<string, unknown>;
}

export interface ChartOptions {
  colorSchemeId?: string;
  showLegend?: boolean;
  legendPosition?: "top" | "bottom" | "left" | "right";
  showLabels?: boolean;
  stacked?: boolean;
  smoothLines?: boolean;
  donutRadius?: number;
}

// =============================================================================
// Dashboard Types
// =============================================================================

export interface DashboardLayout {
  columns: number;
  rowHeight: number;
  compactType: "vertical" | "horizontal" | null;
}

export interface WidgetConfig {
  title?: string;
  subtitle?: string;
  chartType?: ChartType;
  chartOptions?: ChartOptions;
  query?: PivotQuery;
  kpiField?: string;
  kpiAggregation?: AggregationType;
  kpiFormat?: FormatOptions;
  textContent?: string;
  textFormat?: "plain" | "markdown";
  filterDatasetId?: string;
  filterField?: string;
  filterType?: "select" | "date_range" | "search";
  filterOperator?: FilterOperator;
}

export interface DashboardWidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DashboardWidget {
  id: string;
  dashboardId: string;
  widgetType: WidgetType;
  reportId?: string | null;
  position: DashboardWidgetPosition;
  config?: WidgetConfig | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Dashboard {
  id: string;
  organizationId: string | null;
  name: string;
  description: string | null;
  layout: DashboardLayout;
  globalFilters: FilterConfig[];
  ownerId: string;
  sharedWith: string[];
  isOrgWide: boolean;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// Query Execution + Governance Types
// =============================================================================

export interface QueryContext {
  userId: string;
  organizationId: string | null;
  orgRole: OrganizationRole | null;
  isGlobalAdmin: boolean;
  permissions: Set<string>;
  hasRecentAuth: boolean;
  timestamp: Date;
}

export interface QueryExecutionResult<T> {
  data: T;
  executionTimeMs: number;
  truncated: boolean;
  totalRows: number;
  queryHash: string;
}

export interface BiQueryLogEntry {
  id: string;
  userId: string;
  organizationId: string | null;
  queryType: "pivot" | "sql" | "export";
  queryHash: string;
  datasetId: string | null;
  sqlQuery: string | null;
  parameters: JsonRecord | null;
  pivotConfig: PivotConfig | null;
  rowsReturned: number | null;
  executionTimeMs: number | null;
  previousLogId: string | null;
  checksum: string | null;
  createdAt: Date;
}
