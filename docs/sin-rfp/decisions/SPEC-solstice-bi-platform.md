# Solstice BI Platform Specification (ARCHIVED)

> **ARCHIVED**: This document has been replaced by the consolidated BI documentation at:
>
> **[src/features/bi/docs/](../../../src/features/bi/docs/)**
>
> - [SPEC-bi-platform.md](../../../src/features/bi/docs/SPEC-bi-platform.md) - Consolidated specification
> - [PLAN-bi-implementation.md](../../../src/features/bi/docs/PLAN-bi-implementation.md) - Implementation approach
> - [GUIDE-bi-testing.md](../../../src/features/bi/docs/GUIDE-bi-testing.md) - Testing strategy
> - [CHECKLIST-sql-workbench-gate.md](../../../src/features/bi/docs/CHECKLIST-sql-workbench-gate.md) - SQL Workbench prerequisites
> - [WORKLOG-bi-implementation.md](../../../src/features/bi/docs/WORKLOG-bi-implementation.md) - Implementation worklog
>
> **Do not use this document for new work.** It is retained for historical reference only.

Status: Archived (replaced by bi/ directory)
Date: 2025-12-30
Author: Technical Architecture

## Executive Summary

This specification defines the end-state architecture for a fully-featured Business Intelligence (BI) platform built natively within Solstice. The platform provides two authoring modes:

1. **Visual Builder** - Drag-and-drop pivot tables, charts, and dashboards for business users
2. **SQL Workbench** - Direct SQL access for power users with parameterization and governance

Both modes share the same semantic layer, security model, and visualization engine.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [File Structure](#2-file-structure)
3. [Database Schema](#3-database-schema)
4. [Core Modules](#4-core-modules)
5. [User Interface](#5-user-interface)
6. [Security & Governance](#6-security--governance)
7. [Integration Points](#7-integration-points)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SOLSTICE BI PLATFORM                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     PRESENTATION LAYER                               │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │   │
│  │  │ Visual       │  │ SQL          │  │ Dashboard                │   │   │
│  │  │ Pivot Builder│  │ Workbench    │  │ Canvas                   │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     VISUALIZATION ENGINE                             │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │   │
│  │  │ ECharts      │  │ Pivot Table  │  │ Data Grid                │   │   │
│  │  │ Charts       │  │ Renderer     │  │ (TanStack)               │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     SEMANTIC LAYER                                   │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │   │
│  │  │ Datasets     │  │ Metrics      │  │ Calculated               │   │   │
│  │  │ (curated)    │  │ Definitions  │  │ Fields                   │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     QUERY ENGINE                                     │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │   │
│  │  │ Query        │  │ SQL Parser   │  │ Pivot                    │   │   │
│  │  │ Builder      │  │ & Validator  │  │ Aggregator               │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     GOVERNANCE LAYER                                 │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │   │
│  │  │ Org Scoping  │  │ Field ACL    │  │ Audit                    │   │   │
│  │  │ & Tenancy    │  │ & PII Mask   │  │ Logging                  │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     DATA LAYER                                       │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │                    PostgreSQL (RDS)                           │   │   │
│  │  │   Materialized Views  │  Raw Tables  │  Aggregation Tables   │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. File Structure

### End-State Directory Layout

```
src/
├── features/
│   └── bi/                                    # BI Platform Feature Module
│       ├── index.ts                           # Public exports
│       │
│       ├── # ─────────────────────────────────────────────────────────────
│       ├── # SCHEMAS & TYPES
│       ├── # ─────────────────────────────────────────────────────────────
│       ├── bi.schemas.ts                      # Zod schemas for all BI operations
│       ├── bi.types.ts                        # TypeScript types & interfaces
│       │
│       ├── # ─────────────────────────────────────────────────────────────
│       ├── # SERVER-SIDE (Queries & Mutations)
│       ├── # ─────────────────────────────────────────────────────────────
│       ├── bi.queries.ts                      # Read operations (datasets, reports, dashboards)
│       ├── bi.mutations.ts                    # Write operations (save, delete, share)
│       ├── bi.sql-executor.ts                 # SQL workbench execution engine
│       │
│       ├── # ─────────────────────────────────────────────────────────────
│       ├── # SEMANTIC LAYER
│       ├── # ─────────────────────────────────────────────────────────────
│       ├── semantic/
│       │   ├── index.ts
│       │   ├── datasets.config.ts             # Dataset definitions (allowlists, joins)
│       │   ├── metrics.config.ts              # Reusable metric definitions
│       │   ├── calculated-fields.ts           # Formula evaluation engine
│       │   └── field-metadata.ts              # Field labels, types, formatting
│       │
│       ├── # ─────────────────────────────────────────────────────────────
│       ├── # QUERY ENGINE
│       ├── # ─────────────────────────────────────────────────────────────
│       ├── engine/
│       │   ├── index.ts
│       │   ├── query-builder.ts               # Drizzle query construction
│       │   ├── pivot-aggregator.ts            # In-memory pivot computation
│       │   ├── sql-pivot-builder.ts           # SQL GROUP BY ROLLUP generation
│       │   ├── aggregations.ts                # Aggregation functions (sum, avg, median, etc.)
│       │   ├── filters.ts                     # Filter normalization & validation
│       │   ├── sorting.ts                     # Sort normalization
│       │   └── sql-parser.ts                  # SQL validation & parameterization
│       │
│       ├── # ─────────────────────────────────────────────────────────────
│       ├── # GOVERNANCE
│       ├── # ─────────────────────────────────────────────────────────────
│       ├── governance/
│       │   ├── index.ts
│       │   ├── org-scoping.ts                 # Organization tenancy enforcement
│       │   ├── field-acl.ts                   # Field-level access control
│       │   ├── pii-masking.ts                 # Sensitive data redaction
│       │   ├── export-controls.ts             # Step-up auth for exports
│       │   └── query-audit.ts                 # Query logging & audit trail
│       │
│       ├── # ─────────────────────────────────────────────────────────────
│       ├── # VISUALIZATION COMPONENTS
│       ├── # ─────────────────────────────────────────────────────────────
│       ├── components/
│       │   ├── index.ts
│       │   │
│       │   ├── # ─── Visual Pivot Builder ───
│       │   ├── pivot-builder/
│       │   │   ├── PivotBuilder.tsx           # Main drag-and-drop pivot UI
│       │   │   ├── FieldPalette.tsx           # Available fields panel
│       │   │   ├── DropZone.tsx               # Row/Column/Measure drop targets
│       │   │   ├── MeasureConfig.tsx          # Aggregation selector per measure
│       │   │   ├── FilterPanel.tsx            # Visual filter builder
│       │   │   ├── SortConfig.tsx             # Sort configuration
│       │   │   └── PivotPreview.tsx           # Live pivot preview
│       │   │
│       │   ├── # ─── SQL Workbench ───
│       │   ├── sql-workbench/
│       │   │   ├── SqlWorkbench.tsx           # Main SQL editor view
│       │   │   ├── SqlEditor.tsx              # Monaco/CodeMirror SQL editor
│       │   │   ├── SqlAutocomplete.ts         # Schema-aware autocomplete
│       │   │   ├── QueryHistory.tsx           # User's query history
│       │   │   ├── ResultsTable.tsx           # Query results display
│       │   │   ├── QueryParameters.tsx        # Parameter inputs (e.g., {{org_id}})
│       │   │   └── ExplainPlan.tsx            # Query execution plan viewer
│       │   │
│       │   ├── # ─── Charting ───
│       │   ├── charts/
│       │   │   ├── ChartContainer.tsx         # ECharts wrapper with loading states
│       │   │   ├── BarChart.tsx               # Bar chart preset
│       │   │   ├── LineChart.tsx              # Line/Area chart preset
│       │   │   ├── PieChart.tsx               # Pie/Donut chart preset
│       │   │   ├── HeatmapChart.tsx           # Heatmap preset
│       │   │   ├── ScatterChart.tsx           # Scatter plot preset
│       │   │   ├── TableChart.tsx             # Tabular display
│       │   │   ├── KpiCard.tsx                # Single-value KPI display
│       │   │   └── chart-options.ts           # ECharts option builders
│       │   │
│       │   ├── # ─── Pivot Table Rendering ───
│       │   ├── pivot-table/
│       │   │   ├── PivotTable.tsx             # Main pivot table renderer
│       │   │   ├── PivotHeader.tsx            # Multi-level column headers
│       │   │   ├── PivotRow.tsx               # Row with cells and totals
│       │   │   ├── PivotCell.tsx              # Individual cell with formatting
│       │   │   ├── TotalsRow.tsx              # Grand total / subtotal rows
│       │   │   └── pivot-utils.ts             # Cell formatting, conditional styles
│       │   │
│       │   ├── # ─── Filter Builder ───
│       │   ├── filters/
│       │   │   ├── FilterBuilder.tsx          # Main filter UI
│       │   │   ├── FilterGroup.tsx            # AND/OR grouping
│       │   │   ├── FilterCondition.tsx        # Single filter row
│       │   │   ├── DateFilter.tsx             # Date/time specific filters
│       │   │   ├── EnumFilter.tsx             # Multi-select for enums
│       │   │   ├── NumericFilter.tsx          # Numeric comparison filters
│       │   │   └── TextFilter.tsx             # Text/pattern filters
│       │   │
│       │   ├── # ─── Dashboard Canvas ───
│       │   ├── dashboard/
│       │   │   ├── DashboardCanvas.tsx        # Grid-based dashboard layout
│       │   │   ├── DashboardWidget.tsx        # Individual widget container
│       │   │   ├── WidgetToolbar.tsx          # Widget actions (edit, delete, resize)
│       │   │   ├── DashboardFilters.tsx       # Cross-filter controls
│       │   │   ├── AddWidgetModal.tsx         # Widget type selector
│       │   │   └── DashboardExport.tsx        # PDF/PNG export
│       │   │
│       │   ├── # ─── Shared Components ───
│       │   ├── shared/
│       │   │   ├── DataSourcePicker.tsx       # Dataset/data source selector
│       │   │   ├── FieldPicker.tsx            # Field multi-select
│       │   │   ├── AggregationPicker.tsx      # Aggregation function selector
│       │   │   ├── ChartTypePicker.tsx        # Chart type selector with icons
│       │   │   ├── ColorPicker.tsx            # Color/palette selector
│       │   │   ├── ExportMenu.tsx             # CSV/Excel/PDF export options
│       │   │   └── SaveReportDialog.tsx       # Save/update report modal
│       │   │
│       │   └── # ─── Report Management ───
│       │   ├── reports/
│       │       ├── ReportList.tsx             # List of saved reports
│       │       ├── ReportCard.tsx             # Report thumbnail/preview
│       │       ├── ReportViewer.tsx           # Read-only report view
│       │       └── ShareDialog.tsx            # Share with users/org
│       │
│       ├── # ─────────────────────────────────────────────────────────────
│       ├── # HOOKS
│       ├── # ─────────────────────────────────────────────────────────────
│       ├── hooks/
│       │   ├── index.ts
│       │   ├── usePivotQuery.ts               # React Query wrapper for pivot execution
│       │   ├── useSqlQuery.ts                 # React Query wrapper for SQL execution
│       │   ├── useDatasets.ts                 # Available datasets for current user
│       │   ├── useSavedReports.ts             # User's saved reports
│       │   ├── useDashboard.ts                # Dashboard state management
│       │   └── useExport.ts                   # Export with step-up auth
│       │
│       └── # ─────────────────────────────────────────────────────────────
│       └── # TESTS
│       └── # ─────────────────────────────────────────────────────────────
│           __tests__/
│           ├── aggregations.test.ts           # Unit tests for aggregators
│           ├── filters.test.ts                # Unit tests for filter normalization
│           ├── pivot-aggregator.test.ts       # Pivot computation tests
│           ├── sql-parser.test.ts             # SQL validation tests
│           ├── field-acl.test.ts              # ACL enforcement tests
│           └── bi.integration.test.ts         # End-to-end BI flow tests
│
├── db/
│   └── schema/
│       └── bi.schema.ts                       # BI-specific database tables
│
└── routes/
    └── dashboard/
        ├── analytics/                         # BI Routes
        │   ├── index.tsx                      # Analytics home (report list)
        │   ├── explore.tsx                    # Visual pivot builder
        │   ├── sql.tsx                        # SQL workbench
        │   ├── dashboards/
        │   │   ├── index.tsx                  # Dashboard list
        │   │   ├── $dashboardId.tsx           # Dashboard view/edit
        │   │   └── new.tsx                    # Create new dashboard
        │   └── reports/
        │       ├── $reportId.tsx              # View saved report
        │       └── $reportId.edit.tsx         # Edit saved report
        │
        └── sin/
            └── analytics.tsx                  # SIN-specific analytics entry (feature-gated)
```

---

## 3. Database Schema

### New Tables

```typescript
// src/db/schema/bi.schema.ts

import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth.schema";
import { organizations } from "./organizations.schema";

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

export const chartTypeEnum = pgEnum("chart_type", [
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

export const widgetTypeEnum = pgEnum("widget_type", [
  "chart",
  "pivot",
  "kpi",
  "text",
  "filter",
]);

// ─────────────────────────────────────────────────────────────────────────────
// DATASETS (Semantic Layer)
// ─────────────────────────────────────────────────────────────────────────────

export const biDatasets = pgTable("bi_datasets", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id),
  name: text("name").notNull(),
  description: text("description"),

  // Core definition
  baseTable: text("base_table").notNull(), // e.g., "organizations"
  joins: jsonb("joins").$type<DatasetJoin[]>(), // Related table joins

  // Field configuration
  fields: jsonb("fields").$type<DatasetField[]>().notNull(),

  // Access control
  isPublic: boolean("is_public").notNull().default(false),
  allowedRoles: jsonb("allowed_roles").$type<string[]>().default([]),

  // Metadata
  createdBy: text("created_by").references(() => user.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// METRICS (Reusable Calculations)
// ─────────────────────────────────────────────────────────────────────────────

export const biMetrics = pgTable("bi_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id),
  datasetId: uuid("dataset_id").references(() => biDatasets.id),

  name: text("name").notNull(),
  description: text("description"),

  // Metric definition
  expression: text("expression").notNull(), // e.g., "SUM(amount) / COUNT(*)"
  aggregation: text("aggregation"), // Base aggregation if simple

  // Formatting
  formatType: text("format_type").notNull().default("number"), // number, percent, currency
  formatOptions: jsonb("format_options").$type<FormatOptions>(),

  // Metadata
  createdBy: text("created_by").references(() => user.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// SAVED REPORTS (Enhanced)
// ─────────────────────────────────────────────────────────────────────────────

export const biReports = pgTable("bi_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id),
  datasetId: uuid("dataset_id").references(() => biDatasets.id),

  name: text("name").notNull(),
  description: text("description"),

  // Report type
  reportType: text("report_type").notNull().default("pivot"), // "pivot" | "sql" | "chart"

  // Visual builder config
  pivotConfig: jsonb("pivot_config").$type<PivotConfig>(),

  // SQL workbench config
  sqlConfig: jsonb("sql_config").$type<SqlConfig>(),

  // Chart config
  chartType: chartTypeEnum("chart_type"),
  chartConfig: jsonb("chart_config").$type<ChartConfig>(),

  // Filters
  filters: jsonb("filters").$type<FilterConfig[]>().default([]),

  // Sharing
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id),
  sharedWith: jsonb("shared_with").$type<string[]>().default([]),
  isOrgWide: boolean("is_org_wide").notNull().default(false),

  // Metadata
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARDS
// ─────────────────────────────────────────────────────────────────────────────

export const biDashboards = pgTable("bi_dashboards", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id),

  name: text("name").notNull(),
  description: text("description"),

  // Layout configuration
  layout: jsonb("layout").$type<DashboardLayout>().notNull(),

  // Global filters
  globalFilters: jsonb("global_filters").$type<FilterConfig[]>().default([]),

  // Sharing
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id),
  sharedWith: jsonb("shared_with").$type<string[]>().default([]),
  isOrgWide: boolean("is_org_wide").notNull().default(false),
  isPublished: boolean("is_published").notNull().default(false),

  // Metadata
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD WIDGETS
// ─────────────────────────────────────────────────────────────────────────────

export const biDashboardWidgets = pgTable("bi_dashboard_widgets", {
  id: uuid("id").primaryKey().defaultRandom(),
  dashboardId: uuid("dashboard_id")
    .notNull()
    .references(() => biDashboards.id, { onDelete: "cascade" }),

  // Widget configuration
  widgetType: widgetTypeEnum("widget_type").notNull(),
  reportId: uuid("report_id").references(() => biReports.id), // For chart/pivot widgets

  // Layout position (react-grid-layout compatible)
  x: integer("x").notNull().default(0),
  y: integer("y").notNull().default(0),
  w: integer("w").notNull().default(4),
  h: integer("h").notNull().default(3),

  // Widget-specific config
  config: jsonb("config").$type<WidgetConfig>(),

  // Metadata
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// QUERY AUDIT LOG
// ─────────────────────────────────────────────────────────────────────────────

export const biQueryLog = pgTable("bi_query_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  organizationId: uuid("organization_id").references(() => organizations.id),

  // Query details
  queryType: text("query_type").notNull(), // "pivot" | "sql" | "export"
  queryHash: text("query_hash").notNull(), // For deduplication/caching
  datasetId: uuid("dataset_id").references(() => biDatasets.id),

  // For SQL queries
  sqlQuery: text("sql_query"),
  parameters: jsonb("parameters").$type<Record<string, unknown>>(),

  // For pivot queries
  pivotConfig: jsonb("pivot_config").$type<PivotConfig>(),

  // Execution stats
  rowsReturned: integer("rows_returned"),
  executionTimeMs: integer("execution_time_ms"),

  // Tamper-evident
  previousLogId: uuid("previous_log_id"),
  checksum: text("checksum"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

export interface DatasetJoin {
  table: string;
  type: "inner" | "left" | "right";
  on: { left: string; right: string };
}

export interface DatasetField {
  id: string;
  name: string;
  description?: string;
  sourceColumn: string;
  sourceTable?: string;
  dataType: "string" | "number" | "date" | "boolean" | "enum" | "json";

  // Access control
  piiClassification?: "none" | "personal" | "sensitive" | "restricted";
  requiredPermission?: string;

  // Formatting
  formatType?: "text" | "number" | "currency" | "percent" | "date" | "datetime";
  formatOptions?: FormatOptions;

  // Behavior
  allowFilter?: boolean;
  allowSort?: boolean;
  allowGroupBy?: boolean;
  allowAggregate?: boolean;
  defaultAggregation?: string;

  // Enum values (for dropdowns)
  enumValues?: Array<{ value: string; label: string }>;
}

export interface FormatOptions {
  decimals?: number;
  prefix?: string;
  suffix?: string;
  thousandsSeparator?: string;
  dateFormat?: string;
  currency?: string;
}

export interface PivotConfig {
  rows: string[];
  columns: string[];
  measures: Array<{
    field: string;
    aggregation: AggregationType;
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
  options?: Record<string, unknown>; // ECharts options override
}

export interface FilterConfig {
  field: string;
  operator: FilterOperator;
  value: unknown;
  label?: string;
}

export type FilterOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in"
  | "not_in"
  | "between"
  | "contains"
  | "starts_with"
  | "ends_with"
  | "is_null"
  | "is_not_null";

export type AggregationType =
  | "count"
  | "count_distinct"
  | "sum"
  | "avg"
  | "min"
  | "max"
  | "median"
  | "percentile"
  | "stddev"
  | "variance"
  | "first"
  | "last"
  | "percent_of_total"
  | "percent_of_row"
  | "percent_of_column";

export interface DashboardLayout {
  columns: number; // Grid columns (default: 12)
  rowHeight: number; // Pixels per row unit (default: 60)
  compactType: "vertical" | "horizontal" | null;
}

export interface WidgetConfig {
  title?: string;
  subtitle?: string;

  // For KPI widgets
  kpiField?: string;
  kpiAggregation?: AggregationType;
  kpiFormat?: FormatOptions;
  kpiComparison?: {
    type: "previous_period" | "same_period_last_year" | "target";
    value?: number;
  };

  // For text widgets
  textContent?: string;
  textFormat?: "plain" | "markdown";

  // For filter widgets
  filterField?: string;
  filterType?: "select" | "date_range" | "search";
}
```

---

## 4. Core Modules

### 4.1 Aggregation Functions

```typescript
// src/features/bi/engine/aggregations.ts

export type AggregatorFn = (values: number[]) => number | null;

export const aggregators: Record<AggregationType, AggregatorFn> = {
  count: (values) => values.length,
  count_distinct: (values) => new Set(values).size,
  sum: (values) => values.reduce((a, b) => a + b, 0),
  avg: (values) =>
    values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null,
  min: (values) => (values.length > 0 ? Math.min(...values) : null),
  max: (values) => (values.length > 0 ? Math.max(...values) : null),

  median: (values) => {
    if (values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  },

  percentile: (values, p = 0.5) => {
    if (values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const index = (sorted.length - 1) * p;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    return lower === upper
      ? sorted[lower]
      : sorted[lower] * (upper - index) + sorted[upper] * (index - lower);
  },

  stddev: (values) => {
    if (values.length < 2) return null;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map((v) => (v - mean) ** 2);
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
  },

  variance: (values) => {
    if (values.length < 2) return null;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map((v) => (v - mean) ** 2);
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  },

  first: (values) => (values.length > 0 ? values[0] : null),
  last: (values) => (values.length > 0 ? values[values.length - 1] : null),

  // Fraction aggregators (require context)
  percent_of_total: () => null, // Computed post-aggregation
  percent_of_row: () => null,
  percent_of_column: () => null,
};

// Running statistics (Welford's algorithm for streaming mean/variance)
export class RunningStats {
  private n = 0;
  private mean = 0;
  private m2 = 0;

  push(value: number) {
    this.n++;
    const delta = value - this.mean;
    this.mean += delta / this.n;
    const delta2 = value - this.mean;
    this.m2 += delta * delta2;
  }

  getMean() {
    return this.n > 0 ? this.mean : null;
  }
  getVariance() {
    return this.n > 1 ? this.m2 / (this.n - 1) : null;
  }
  getStdDev() {
    const variance = this.getVariance();
    return variance !== null ? Math.sqrt(variance) : null;
  }
  getCount() {
    return this.n;
  }
}
```

### 4.2 SQL Parser & Validator

```typescript
// src/features/bi/engine/sql-parser.ts

import { z } from "zod";

// Allowed SQL operations (no mutations)
const ALLOWED_KEYWORDS = new Set([
  "SELECT",
  "FROM",
  "WHERE",
  "AND",
  "OR",
  "NOT",
  "GROUP",
  "BY",
  "ORDER",
  "ASC",
  "DESC",
  "LIMIT",
  "OFFSET",
  "JOIN",
  "LEFT",
  "RIGHT",
  "INNER",
  "OUTER",
  "ON",
  "AS",
  "DISTINCT",
  "COUNT",
  "SUM",
  "AVG",
  "MIN",
  "MAX",
  "CASE",
  "WHEN",
  "THEN",
  "ELSE",
  "END",
  "NULL",
  "IS",
  "IN",
  "BETWEEN",
  "LIKE",
  "ILIKE",
  "HAVING",
  "COALESCE",
  "NULLIF",
  "CAST",
  "EXTRACT",
  "DATE_TRUNC",
  "WITH",
  "UNION",
  "ALL",
  "EXCEPT",
  "INTERSECT",
]);

// Blocked SQL operations
const BLOCKED_PATTERNS = [
  /\b(INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER|CREATE|GRANT|REVOKE)\b/i,
  /\b(EXECUTE|EXEC|CALL)\b/i,
  /;.*?;/, // Multiple statements
  /--/, // SQL comments
  /\/\*/, // Block comments
];

export interface ParsedSqlQuery {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  tables: string[];
  columns: string[];
  parameters: Array<{ name: string; position: number }>;
  normalizedQuery: string;
}

export function parseSqlQuery(query: string): ParsedSqlQuery {
  const result: ParsedSqlQuery = {
    isValid: true,
    errors: [],
    warnings: [],
    tables: [],
    columns: [],
    parameters: [],
    normalizedQuery: query.trim(),
  };

  // Check for blocked patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(query)) {
      result.isValid = false;
      result.errors.push(`Blocked SQL pattern detected: ${pattern.source}`);
    }
  }

  // Extract parameter placeholders ({{param_name}} syntax)
  const paramRegex = /\{\{(\w+)\}\}/g;
  let match;
  while ((match = paramRegex.exec(query)) !== null) {
    result.parameters.push({
      name: match[1],
      position: match.index,
    });
  }

  // Extract table names (simplified - production would use proper parser)
  const fromRegex = /\bFROM\s+(\w+)/gi;
  const joinRegex = /\bJOIN\s+(\w+)/gi;

  while ((match = fromRegex.exec(query)) !== null) {
    result.tables.push(match[1].toLowerCase());
  }
  while ((match = joinRegex.exec(query)) !== null) {
    result.tables.push(match[1].toLowerCase());
  }

  return result;
}

export function validateSqlAgainstDataset(
  query: ParsedSqlQuery,
  allowedTables: Set<string>,
  allowedColumns: Map<string, Set<string>>,
): string[] {
  const errors: string[] = [];

  for (const table of query.tables) {
    if (!allowedTables.has(table)) {
      errors.push(`Access to table "${table}" is not permitted`);
    }
  }

  return errors;
}

export function substituteParameters(
  query: string,
  parameters: Record<string, unknown>,
): { query: string; values: unknown[] } {
  const values: unknown[] = [];
  let paramIndex = 1;

  const substituted = query.replace(/\{\{(\w+)\}\}/g, (_, name) => {
    if (!(name in parameters)) {
      throw new Error(`Missing parameter: ${name}`);
    }
    values.push(parameters[name]);
    return `$${paramIndex++}`;
  });

  return { query: substituted, values };
}
```

---

## 5. User Interface

### 5.1 Visual Pivot Builder Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ┌─────────────────┐                                                         │
│  │ Data Source     │  [Organizations ▼]                                      │
│  └─────────────────┘                                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────┐   ┌─────────────────────────────────────────────┐  │
│  │ Available Fields    │   │                                             │  │
│  │ ┌─────────────────┐ │   │  ROWS               COLUMNS                 │  │
│  │ │ 📝 name         │ │   │  ┌───────────────┐ ┌───────────────┐        │  │
│  │ │ 📝 slug         │ │   │  │ Drop fields   │ │ Drop fields   │        │  │
│  │ │ 🏷️ type         │ │ ⟵ │  │ here          │ │ here          │        │  │
│  │ │ 🏷️ status       │ │   │  │               │ │               │        │  │
│  │ │ 📅 createdAt    │ │   │  │ ┌───────────┐ │ │ ┌───────────┐ │        │  │
│  │ │ 📅 updatedAt    │ │   │  │ │ type      │ │ │ │ status    │ │        │  │
│  │ └─────────────────┘ │   │  │ └───────────┘ │ │ └───────────┘ │        │  │
│  │                     │   │  └───────────────┘ └───────────────┘        │  │
│  │ Metrics             │   │                                             │  │
│  │ ┌─────────────────┐ │   │  MEASURES                                   │  │
│  │ │ Active Members  │ │   │  ┌───────────────────────────────────────┐  │  │
│  │ │ Total Revenue   │ │   │  │ ┌─────────────┐  ┌─────────┐         │  │  │
│  │ └─────────────────┘ │   │  │ │ name        │  │ COUNT ▼ │  [×]    │  │  │
│  └─────────────────────┘   │  │ └─────────────┘  └─────────┘         │  │  │
│                            │  │ ┌─────────────┐  ┌─────────┐         │  │  │
│  ┌─────────────────────┐   │  │ │ createdAt   │  │ COUNT ▼ │  [×]    │  │  │
│  │ Filters             │   │  │ └─────────────┘  └─────────┘         │  │  │
│  │ ┌─────────────────┐ │   │  └───────────────────────────────────────┘  │  │
│  │ │ + Add Filter    │ │   │                                             │  │
│  │ └─────────────────┘ │   └─────────────────────────────────────────────┘  │
│  │                     │                                                     │
│  │ createdAt           │   ┌─────────────────────────────────────────────┐  │
│  │ ┌───────┬─────────┐ │   │ Chart Type: [Table ▼] [Bar] [Line] [Pie]    │  │
│  │ │ >= ▼  │ 2024-01 │ │   └─────────────────────────────────────────────┘  │
│  │ └───────┴─────────┘ │                                                     │
│  └─────────────────────┘                                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [Run Query]  [Save Report]  [Export ▼]                                     │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                    ┌──────────────────────────────────────────┐              │
│                    │             PIVOT TABLE                  │              │
│                    │ ┌────────┬─────────┬─────────┬─────────┐ │              │
│                    │ │        │ active  │ pending │ Total   │ │              │
│                    │ ├────────┼─────────┼─────────┼─────────┤ │              │
│                    │ │ club   │    42   │    8    │   50    │ │              │
│                    │ │ league │    12   │    3    │   15    │ │              │
│                    │ │ region │     5   │    1    │    6    │ │              │
│                    │ ├────────┼─────────┼─────────┼─────────┤ │              │
│                    │ │ Total  │    59   │   12    │   71    │ │              │
│                    │ └────────┴─────────┴─────────┴─────────┘ │              │
│                    └──────────────────────────────────────────┘              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 SQL Workbench Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  SQL Workbench                                              [Save] [Export]  │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ SELECT                                                                 │  │
│  │   o.name,                                                              │  │
│  │   o.type,                                                              │  │
│  │   COUNT(*) as member_count                                             │  │
│  │ FROM organizations o                                                   │  │
│  │ JOIN organization_members om ON om.organization_id = o.id              │  │
│  │ WHERE o.status = 'active'                                              │  │
│  │   AND o.id = {{org_id}}                                                │  │
│  │ GROUP BY o.name, o.type                                                │  │
│  │ ORDER BY member_count DESC                                             │  │
│  │ LIMIT 100                                                              │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌────────────────────┐                                                      │
│  │ Parameters         │                                                      │
│  │ org_id: [uuid    ] │                                                      │
│  └────────────────────┘                                                      │
│                                                                              │
│  [▶ Run Query]  [Explain Plan]                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│  Results (42 rows, 23ms)                                                     │
│  ┌────────────────────┬──────────┬──────────────┐                           │
│  │ name               │ type     │ member_count │                           │
│  ├────────────────────┼──────────┼──────────────┤                           │
│  │ Vancouver Vipers   │ club     │ 156          │                           │
│  │ Pacific League     │ league   │ 89           │                           │
│  │ BC Region          │ region   │ 45           │                           │
│  │ ...                │ ...      │ ...          │                           │
│  └────────────────────┴──────────┴──────────────┘                           │
├──────────────────────────────────────────────────────────────────────────────┤
│  Query History                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ 10:23 AM  SELECT o.name... (42 rows, 23ms)              [Load] [Del]│   │
│  │ 10:15 AM  SELECT COUNT(*)... (1 row, 12ms)              [Load] [Del]│   │
│  │ 09:58 AM  SELECT * FROM org... (156 rows, 45ms)         [Load] [Del]│   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Dashboard Canvas

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Dashboard: Organization Overview                    [Edit] [Share] [Export] │
├──────────────────────────────────────────────────────────────────────────────┤
│  Filters:  [All Organizations ▼]  [Last 30 Days ▼]  [All Statuses ▼]        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐             │
│  │    Active Orgs   │ │  Total Members   │ │  Pending Tasks   │             │
│  │       156        │ │      2,847       │ │        23        │             │
│  │    ▲ +12%        │ │    ▲ +8%         │ │    ▼ -15%        │             │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘             │
│                                                                              │
│  ┌────────────────────────────────────┐ ┌────────────────────────────────┐  │
│  │ Organizations by Type              │ │ Member Growth                  │  │
│  │                                    │ │                                │  │
│  │  ┌────┐                            │ │     ──────────────             │  │
│  │  │    │  ┌────┐                    │ │    /              \            │  │
│  │  │    │  │    │  ┌────┐            │ │   /                            │  │
│  │  │    │  │    │  │    │            │ │  /                             │  │
│  │  └────┴──┴────┴──┴────┘            │ │ Jan Feb Mar Apr May Jun        │  │
│  │  Club   League  Region             │ │                                │  │
│  └────────────────────────────────────┘ └────────────────────────────────┘  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ Recent Activity                                                       │   │
│  │ ┌────────────────────┬──────────┬───────────┬──────────────────────┐ │   │
│  │ │ Organization       │ Action   │ User      │ Time                 │ │   │
│  │ ├────────────────────┼──────────┼───────────┼──────────────────────┤ │   │
│  │ │ Vancouver Vipers   │ Created  │ J. Smith  │ 2 hours ago          │ │   │
│  │ │ Pacific League     │ Updated  │ M. Jones  │ 4 hours ago          │ │   │
│  │ └────────────────────┴──────────┴───────────┴──────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Security & Governance

### 6.1 Access Control Matrix

| Feature               | End User | Analyst | Admin     | Global Admin |
| --------------------- | -------- | ------- | --------- | ------------ |
| View shared reports   | ✅       | ✅      | ✅        | ✅           |
| Create visual reports | ❌       | ✅      | ✅        | ✅           |
| SQL Workbench         | ❌       | ✅      | ✅        | ✅           |
| Create dashboards     | ❌       | ✅      | ✅        | ✅           |
| Share org-wide        | ❌       | ❌      | ✅        | ✅           |
| Export data           | Step-up  | Step-up | Step-up   | Step-up      |
| View PII fields       | ❌       | Masked  | With perm | ✅           |
| Define datasets       | ❌       | ❌      | ✅        | ✅           |
| Cross-org queries     | ❌       | ❌      | ❌        | ✅           |

### 6.2 Field-Level ACL

```typescript
// src/features/bi/governance/field-acl.ts

export interface FieldAclRule {
  field: string;
  table: string;
  piiClassification: "none" | "personal" | "sensitive" | "restricted";
  requiredPermission?: string;
  maskingStrategy?: "redact" | "hash" | "partial" | "none";
}

export const FIELD_ACL_RULES: FieldAclRule[] = [
  // Personal information
  {
    field: "email",
    table: "*",
    piiClassification: "personal",
    maskingStrategy: "partial",
  },
  {
    field: "phone",
    table: "*",
    piiClassification: "personal",
    maskingStrategy: "partial",
  },
  {
    field: "dateOfBirth",
    table: "*",
    piiClassification: "personal",
    maskingStrategy: "redact",
  },

  // Sensitive data
  {
    field: "emergencyContact*",
    table: "*",
    piiClassification: "sensitive",
    maskingStrategy: "redact",
  },
  {
    field: "payload",
    table: "form_submissions",
    piiClassification: "sensitive",
    requiredPermission: "pii.read",
  },

  // Restricted data
  {
    field: "password*",
    table: "*",
    piiClassification: "restricted",
    maskingStrategy: "redact",
  },
];

export function applyFieldMasking(
  rows: Record<string, unknown>[],
  userPermissions: Set<string>,
  fieldRules: FieldAclRule[],
): Record<string, unknown>[] {
  return rows.map((row) => {
    const masked = { ...row };

    for (const rule of fieldRules) {
      if (rule.piiClassification === "none") continue;
      if (rule.requiredPermission && userPermissions.has(rule.requiredPermission))
        continue;

      for (const key of Object.keys(masked)) {
        const matches = rule.field.endsWith("*")
          ? key.startsWith(rule.field.slice(0, -1))
          : key === rule.field;

        if (matches) {
          switch (rule.maskingStrategy) {
            case "redact":
              masked[key] = "[REDACTED]";
              break;
            case "hash":
              masked[key] = hashValue(masked[key]);
              break;
            case "partial":
              masked[key] = partialMask(masked[key]);
              break;
          }
        }
      }
    }

    return masked;
  });
}

function partialMask(value: unknown): string {
  if (typeof value !== "string") return "***";
  if (value.includes("@")) {
    // Email: j***@example.com
    const [local, domain] = value.split("@");
    return `${local[0]}***@${domain}`;
  }
  // Default: first 2 chars visible
  return value.slice(0, 2) + "***";
}
```

### 6.3 Audit Logging

Every query execution logs:

```typescript
interface QueryAuditEntry {
  id: string;
  userId: string;
  organizationId: string | null;
  queryType: "pivot" | "sql" | "export";

  // Query details (sanitized)
  queryHash: string; // SHA-256 of normalized query
  datasetId: string | null;
  tablesAccessed: string[];
  columnsAccessed: string[];
  filtersApplied: Record<string, unknown>;

  // Execution metadata
  rowsReturned: number;
  executionTimeMs: number;

  // For exports
  exportFormat?: "csv" | "xlsx" | "pdf";
  exportedRowCount?: number;

  // Tamper evidence
  previousLogId: string; // Chain reference
  checksum: string; // HMAC of entry

  createdAt: Date;
}
```

---

## 7. Integration Points

### 7.1 Existing Solstice Integration

| System              | Integration                       | Notes                      |
| ------------------- | --------------------------------- | -------------------------- |
| Auth (Better Auth)  | Session context, user permissions | Already implemented        |
| Organizations       | Tenancy scoping                   | Already implemented        |
| Roles & Permissions | Field ACL, feature access         | Extend `PermissionService` |
| Audit Log           | Query logging                     | Extend `logDataChange`     |
| Forms               | Form submission data source       | Add dataset config         |
| Members             | Member data source                | Add dataset config         |
| Events              | Event data source                 | Add dataset config         |

### 7.2 Default Datasets

```typescript
// src/features/bi/semantic/datasets.config.ts

export const DEFAULT_DATASETS: DatasetDefinition[] = [
  {
    id: "organizations",
    name: "Organizations",
    baseTable: "organizations",
    fields: [
      { id: "id", name: "ID", sourceColumn: "id", dataType: "uuid" },
      { id: "name", name: "Name", sourceColumn: "name", dataType: "string" },
      { id: "type", name: "Type", sourceColumn: "type", dataType: "enum", enumValues: [...] },
      { id: "status", name: "Status", sourceColumn: "status", dataType: "enum", enumValues: [...] },
      { id: "createdAt", name: "Created At", sourceColumn: "created_at", dataType: "date" },
    ],
  },

  {
    id: "members",
    name: "Organization Members",
    baseTable: "organization_members",
    joins: [
      { table: "user", type: "left", on: { left: "user_id", right: "id" } },
      { table: "organizations", type: "left", on: { left: "organization_id", right: "id" } },
    ],
    fields: [
      { id: "userId", name: "User ID", sourceColumn: "user_id", dataType: "string" },
      { id: "orgId", name: "Org ID", sourceColumn: "organization_id", dataType: "uuid" },
      { id: "role", name: "Role", sourceColumn: "role", dataType: "enum", enumValues: [...] },
      { id: "status", name: "Status", sourceColumn: "status", dataType: "enum", enumValues: [...] },
      { id: "joinedAt", name: "Joined At", sourceColumn: "created_at", dataType: "date" },
      // Joined fields
      { id: "userName", name: "User Name", sourceColumn: "name", sourceTable: "user", dataType: "string" },
      { id: "userEmail", name: "User Email", sourceColumn: "email", sourceTable: "user", dataType: "string", piiClassification: "personal" },
      { id: "orgName", name: "Organization", sourceColumn: "name", sourceTable: "organizations", dataType: "string" },
    ],
  },

  {
    id: "form_submissions",
    name: "Form Submissions",
    baseTable: "form_submissions",
    joins: [
      { table: "organizations", type: "left", on: { left: "organization_id", right: "id" } },
      { table: "forms", type: "left", on: { left: "form_id", right: "id" } },
    ],
    fields: [
      { id: "id", name: "Submission ID", sourceColumn: "id", dataType: "uuid" },
      { id: "formId", name: "Form ID", sourceColumn: "form_id", dataType: "uuid" },
      { id: "status", name: "Status", sourceColumn: "status", dataType: "enum", enumValues: [...] },
      { id: "completenessScore", name: "Completeness", sourceColumn: "completeness_score", dataType: "number" },
      { id: "submittedAt", name: "Submitted At", sourceColumn: "submitted_at", dataType: "date" },
      { id: "payload", name: "Data", sourceColumn: "payload", dataType: "json", piiClassification: "sensitive" },
      // Joined fields
      { id: "orgName", name: "Organization", sourceColumn: "name", sourceTable: "organizations", dataType: "string" },
      { id: "formName", name: "Form", sourceColumn: "name", sourceTable: "forms", dataType: "string" },
    ],
  },

  {
    id: "events",
    name: "Events",
    baseTable: "events",
    fields: [
      { id: "id", name: "Event ID", sourceColumn: "id", dataType: "uuid" },
      { id: "name", name: "Event Name", sourceColumn: "name", dataType: "string" },
      { id: "type", name: "Event Type", sourceColumn: "type", dataType: "enum", enumValues: [...] },
      { id: "status", name: "Status", sourceColumn: "status", dataType: "enum", enumValues: [...] },
      { id: "startDate", name: "Start Date", sourceColumn: "start_date", dataType: "date" },
      { id: "endDate", name: "End Date", sourceColumn: "end_date", dataType: "date" },
      { id: "capacity", name: "Capacity", sourceColumn: "capacity", dataType: "number" },
    ],
  },
];
```

---

## Implementation Phases

### Phase 1: Foundation (6-8 weeks)

- [ ] Enhance existing pivot builder with totals/subtotals
- [ ] Port aggregation functions from react-pivottable
- [ ] Implement typed filter builder component
- [ ] Add calculated fields support
- [ ] Improve chart formatting

### Phase 2: Semantic Layer (4-6 weeks)

- [ ] Dataset definition schema & storage
- [ ] Field metadata configuration
- [ ] Reusable metrics library
- [ ] Multi-table joins in query builder

### Phase 3: SQL Workbench (4-6 weeks)

- [ ] SQL parser & validator
- [ ] Parameter substitution
- [ ] Schema-aware autocomplete
- [ ] Query history
- [ ] Execution plan viewer

### Phase 4: Dashboards (4-6 weeks)

- [ ] Dashboard canvas with react-grid-layout
- [ ] Widget types (chart, pivot, KPI, text)
- [ ] Global filter controls
- [ ] Cross-filtering between widgets
- [ ] Dashboard sharing

### Phase 5: Governance & Scale (3-4 weeks)

- [ ] Query audit logging with tamper evidence
- [ ] SQL-side GROUP BY ROLLUP for large pivots
- [ ] Query caching layer
- [ ] Export scheduling

---

## Links

- ADR-2025-12-26-d0-16: Analytics charts and pivots scope
- ADR-2025-12-30-d0-19: BI analytics platform direction
- react-pivottable: MIT-licensed aggregator templates
- tinypivot: MIT-licensed calculated fields pattern
- ECharts documentation: https://echarts.apache.org/en/option.html
