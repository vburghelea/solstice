/**
 * BI Module Types
 *
 * TypeScript types for the BI module. Most types are inferred from Zod schemas,
 * but complex or internal types are defined here.
 *
 * @see docs/sin-rfp/decisions/bi/SPEC-bi-platform.md
 */

import type {
  AggregationType,
  ExportFormat,
  Filter,
  FilterOperator,
  PivotCell,
  PivotDimension,
  PivotMeasure,
  PivotQuery,
  PivotResult,
} from "./bi.schemas";

// Re-export schema-derived types for convenience
export type {
  AggregationType,
  ExportFormat,
  Filter,
  FilterOperator,
  PivotCell,
  PivotDimension,
  PivotMeasure,
  PivotQuery,
  PivotResult,
};

// =============================================================================
// Dataset Configuration Types
// =============================================================================

/**
 * Field definition within a dataset
 */
export interface DatasetField {
  /** Database column name */
  column: string;
  /** Display label */
  label: string;
  /** Data type for UI rendering and validation */
  type: "string" | "number" | "boolean" | "date" | "datetime";
  /** Whether this field can be used as a dimension */
  allowDimension: boolean;
  /** Whether this field can be used as a measure */
  allowMeasure: boolean;
  /** Aggregations allowed when used as measure */
  allowedAggregations?: AggregationType[];
  /** Filter operators allowed for this field */
  allowedOperators?: FilterOperator[];
  /** Whether this field contains PII (requires step-up auth for export) */
  isPii?: boolean;
  /** Minimum role required to view this field */
  minRole?: "owner" | "admin" | "reporter";
}

/**
 * Dataset configuration - defines what data is queryable
 */
export interface DatasetConfig {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Description for users */
  description: string;
  /** Database table or view name */
  source: string;
  /** Available fields */
  fields: DatasetField[];
  /** Whether this dataset requires org scoping */
  requiresOrgScope: boolean;
  /** Column used for org scoping */
  orgScopeColumn?: string;
  /** Maximum rows that can be returned */
  maxRows?: number;
}

// =============================================================================
// Query Execution Types
// =============================================================================

/**
 * Internal query context passed through the execution pipeline
 */
export interface QueryContext {
  /** Authenticated user ID */
  userId: string;
  /** User's organization ID */
  organizationId: string;
  /** User's role in the organization */
  orgRole: "owner" | "admin" | "reporter";
  /** Whether user has global admin permissions */
  isGlobalAdmin: boolean;
  /** Whether user has completed step-up auth recently */
  hasRecentAuth: boolean;
  /** Request timestamp */
  timestamp: Date;
}

/**
 * Result of query execution with metadata
 */
export interface QueryExecutionResult<T> {
  /** Query result data */
  data: T;
  /** Execution time in milliseconds */
  executionTimeMs: number;
  /** Whether result was truncated */
  truncated: boolean;
  /** Total rows before truncation */
  totalRows: number;
  /** Query hash for audit logging */
  queryHash: string;
}

// =============================================================================
// Audit Types
// =============================================================================

/**
 * BI query log entry
 */
export interface BiQueryLogEntry {
  id: string;
  userId: string;
  organizationId: string | null;
  queryType: "pivot" | "sql" | "export";
  queryHash: string;
  datasetId: string | null;
  sqlQuery: string | null;
  parameters: Record<string, unknown> | null;
  rowsReturned: number;
  executionTimeMs: number;
  previousLogId: string | null;
  checksum: string | null;
  createdAt: Date;
}

// =============================================================================
// Dashboard Types (Phase 2)
// =============================================================================

/**
 * Widget position on dashboard grid
 */
export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Dashboard widget configuration
 */
export interface DashboardWidget {
  id: string;
  type: "pivot-table" | "bar-chart" | "line-chart" | "kpi-card";
  title: string;
  position: WidgetPosition;
  query: PivotQuery;
  chartConfig?: Record<string, unknown>;
}

/**
 * Dashboard definition
 */
export interface Dashboard {
  id: string;
  name: string;
  description: string | null;
  organizationId: string;
  createdById: string;
  widgets: DashboardWidget[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}
