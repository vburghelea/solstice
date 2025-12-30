# Solstice BI Platform Specification

**Status**: Approved
**Date**: 2025-12-30
**Author**: Technical Architecture
**Version**: 2.0 (consolidated)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Scope, Personas, and Non-Goals](#2-scope-personas-and-non-goals)
3. [Requirements Traceability](#3-requirements-traceability)
4. [Architecture Overview](#4-architecture-overview)
5. [File Structure](#5-file-structure)
6. [Database Schema](#6-database-schema)
7. [Core Modules](#7-core-modules)
8. [Governance Model](#8-governance-model)
9. [Access Control](#9-access-control)
10. [User Interface](#10-user-interface)
11. [Integration Points](#11-integration-points)

---

## 1. Executive Summary

This specification defines the architecture for Solstice Analytics (BI) to satisfy
viaSport "Strength in Numbers" requirements:

| Requirement                     | ID          | Summary                                                      |
| ------------------------------- | ----------- | ------------------------------------------------------------ |
| Self-service analytics + export | RP-AGG-005  | Ad-hoc charts, pivots, CSV/Excel export with field-level ACL |
| Dashboards                      | RP-AGG-003  | Visualize submitted data in dashboard format                 |
| Audit trail                     | SEC-AGG-004 | Immutable, tamper-evident logging of queries and exports     |

### Platform Decision

Solstice is the **sole analytics platform** for end users and analysts. We are
building native BI capabilities from scratch to maintain full control over governance,
tenancy, and audit requirements. External BI tools (Evidence, Metabase, Superset)
were evaluated and not pursued.

### Key Capabilities

| Capability               | Description                                            |
| ------------------------ | ------------------------------------------------------ |
| **Visual Pivot Builder** | Drag-and-drop pivot tables and charts                  |
| **Dashboard Canvas**     | Composable widgets with cross-filtering                |
| **SQL Workbench**        | Governed SQL access for power users (behind hard gate) |
| **Semantic Layer**       | Curated datasets, metrics, calculated fields           |
| **Export**               | CSV, XLSX with step-up auth and audit logging          |

### Key Constraints

| Constraint               | Requirement                                          |
| ------------------------ | ---------------------------------------------------- |
| **Data Residency**       | AWS `ca-central-1` (Canada) for PIPEDA compliance    |
| **Organization Scoping** | Enforced by default; cross-org requires Global Admin |
| **Field-Level Access**   | ACL rules and PII masking across UI + export         |
| **Export Controls**      | Step-up authentication required; all exports audited |
| **Audit Trail**          | Tamper-evident logging with integrity verification   |

---

## 2. Scope, Personas, and Non-Goals

### 2.1 Personas

| Persona          | Description                              | Analytics Access                      |
| ---------------- | ---------------------------------------- | ------------------------------------- |
| **Org Member**   | Consumes shared dashboards/reports       | View shared reports                   |
| **Reporter**     | Creates reports/pivots for their org     | Full pivot builder, exports (step-up) |
| **Admin/Owner**  | Manages org-wide sharing, dataset config | Org-wide sharing, dataset admin       |
| **Global Admin** | Cross-org access for support/governance  | Unrestricted (audited)                |

> **Note**: "Analyst" is a **permission set** (`analytics.author`, `analytics.sql`),
> not a separate role. This aligns with existing org roles (`owner`, `admin`, `reporter`).

### 2.2 In Scope

- **Visual Pivot Builder**: Pivot tables, chart presets, saved reports, sharing
- **Dashboard Canvas**: Layout, widgets, global filters, sharing
- **Exports**: CSV/XLSX, step-up auth, audit events, field-level controls
- **Semantic Layer**: Curated datasets, metrics definitions, calculated fields
- **SQL Workbench**: Governed SQL access (Phase 4, behind hard gate)

### 2.3 Out of Scope

| Feature                    | Status      | Notes                                 |
| -------------------------- | ----------- | ------------------------------------- |
| Alerts / Scheduled Reports | Phase 5+    | Requires scheduler infrastructure     |
| Plugin Ecosystem           | Not planned | ECharts covers chart types            |
| Raw-Table SQL Access       | Prohibited  | SQL Workbench uses curated views only |
| Public Dashboard Links     | Not planned | All access requires authentication    |
| PDF/PNG Export             | Optional    | Stretch goal if needed                |
| Real-time Streaming        | Not planned | Batch/on-demand only                  |

### 2.4 Related Decisions

| ADR                             | Status    | Implication                                 |
| ------------------------------- | --------- | ------------------------------------------- |
| D0.16 (Analytics charts/pivots) | Accepted  | ECharts + pivot builder is committed path   |
| D0.19 (BI platform direction)   | Withdrawn | Building native; external tools not pursued |

---

## 3. Requirements Traceability

### 3.1 Traceability Matrix

| Requirement                     | ID          | Spec Coverage                        | Acceptance Criteria                                                  |
| ------------------------------- | ----------- | ------------------------------------ | -------------------------------------------------------------------- |
| Self-Service Analytics & Export | RP-AGG-005  | Visual Builder + Exports + Field ACL | User builds chart, exports to CSV; export respects field-level rules |
| Dashboards                      | RP-AGG-003  | Dashboard Canvas + Widgets + Sharing | Users view data in dashboard format                                  |
| Audit Trail                     | SEC-AGG-004 | Query/Export audit + tamper evidence | Filter logs by user/record; verify integrity via hashing             |
| Data Governance                 | DM-AGG-003  | Org scoping + Field ACL + Roles      | Users access data based on permission only                           |
| Privacy Compliance              | SEC-AGG-003 | PII masking + ca-central-1 residency | Sensitive data encrypted, stored securely                            |

### 3.2 Acceptance Scenarios

**RP-AGG-005 - Self-Service Analytics**:

1. Reporter creates pivot table with organization filter
2. Reporter switches chart type to bar chart
3. Reporter exports to CSV → step-up auth triggered
4. Export excludes PII fields (masked as `***`)
5. Export logged in `export_history` with filters used

**SEC-AGG-004 - Audit Trail**:

1. User runs pivot query → `bi_query_log` entry created
2. User exports data → `export_history` + audit event
3. Admin queries audit logs by user ID → results returned
4. Integrity checksum verified on audit entries

---

## 4. Architecture Overview

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
│  │  │ Builder      │  │ (AST-based)  │  │ Aggregator               │   │   │
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
│  │  │                    PostgreSQL (RDS ca-central-1)              │   │   │
│  │  │   Curated Views  │  Raw Tables  │  Aggregation Cache         │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. File Structure

```
src/
├── features/
│   └── bi/                                    # BI Platform Feature Module
│       ├── index.ts                           # Public exports
│       │
│       ├── # ─── SCHEMAS & TYPES ───
│       ├── bi.schemas.ts                      # Zod schemas for all BI operations
│       ├── bi.types.ts                        # TypeScript types & interfaces
│       │
│       ├── # ─── SERVER-SIDE ───
│       ├── bi.queries.ts                      # Read operations
│       ├── bi.mutations.ts                    # Write operations
│       │
│       ├── # ─── SEMANTIC LAYER ───
│       ├── semantic/
│       │   ├── index.ts
│       │   ├── datasets.config.ts             # Dataset definitions
│       │   ├── metrics.config.ts              # Reusable metrics
│       │   ├── calculated-fields.ts           # Formula evaluation
│       │   └── field-metadata.ts              # Field labels, types
│       │
│       ├── # ─── QUERY ENGINE ───
│       ├── engine/
│       │   ├── index.ts
│       │   ├── query-builder.ts               # Drizzle query construction
│       │   ├── pivot-aggregator.ts            # Pivot computation
│       │   ├── aggregations.ts                # Aggregation functions
│       │   ├── filters.ts                     # Filter normalization
│       │   ├── sorting.ts                     # Sort normalization
│       │   └── sql-parser.ts                  # AST-based SQL validation
│       │
│       ├── # ─── GOVERNANCE ───
│       ├── governance/
│       │   ├── index.ts
│       │   ├── org-scoping.ts                 # Tenancy enforcement
│       │   ├── field-acl.ts                   # Field-level access
│       │   ├── pii-masking.ts                 # Sensitive data redaction
│       │   ├── export-controls.ts             # Step-up auth
│       │   └── query-audit.ts                 # Audit logging
│       │
│       ├── # ─── COMPONENTS ───
│       ├── components/
│       │   ├── pivot-builder/
│       │   │   ├── PivotBuilder.tsx           # Main drag-and-drop UI
│       │   │   ├── FieldPalette.tsx           # Available fields
│       │   │   ├── DropZone.tsx               # Row/Column/Measure targets
│       │   │   ├── MeasureConfig.tsx          # Aggregation selector
│       │   │   ├── FilterPanel.tsx            # Visual filter builder
│       │   │   └── PivotPreview.tsx           # Live preview
│       │   │
│       │   ├── sql-workbench/
│       │   │   ├── SqlWorkbench.tsx           # Main SQL editor
│       │   │   ├── SqlEditor.tsx              # CodeMirror editor
│       │   │   ├── QueryHistory.tsx           # User's query history
│       │   │   └── ResultsTable.tsx           # Results display
│       │   │
│       │   ├── charts/
│       │   │   ├── ChartContainer.tsx         # ECharts wrapper
│       │   │   ├── BarChart.tsx
│       │   │   ├── LineChart.tsx
│       │   │   ├── PieChart.tsx
│       │   │   └── KpiCard.tsx
│       │   │
│       │   ├── pivot-table/
│       │   │   ├── PivotTable.tsx             # Pivot renderer
│       │   │   ├── PivotHeader.tsx
│       │   │   ├── PivotRow.tsx
│       │   │   └── TotalsRow.tsx
│       │   │
│       │   ├── filters/
│       │   │   ├── FilterBuilder.tsx          # Typed filter UI
│       │   │   ├── FilterGroup.tsx
│       │   │   ├── DateFilter.tsx
│       │   │   ├── EnumFilter.tsx
│       │   │   └── NumericFilter.tsx
│       │   │
│       │   ├── dashboard/
│       │   │   ├── DashboardCanvas.tsx        # Grid layout
│       │   │   ├── DashboardWidget.tsx
│       │   │   ├── WidgetToolbar.tsx
│       │   │   └── DashboardFilters.tsx
│       │   │
│       │   └── shared/
│       │       ├── DataSourcePicker.tsx
│       │       ├── FieldPicker.tsx
│       │       ├── AggregationPicker.tsx
│       │       ├── ExportMenu.tsx
│       │       └── SaveReportDialog.tsx
│       │
│       ├── # ─── HOOKS ───
│       ├── hooks/
│       │   ├── usePivotQuery.ts
│       │   ├── useSqlQuery.ts
│       │   ├── useDatasets.ts
│       │   ├── useSavedReports.ts
│       │   └── useExport.ts
│       │
│       └── # ─── TESTS ───
│           __tests__/
│           ├── aggregations.test.ts
│           ├── filters.test.ts
│           ├── pivot-aggregator.test.ts
│           ├── sql-parser.test.ts
│           ├── field-acl.test.ts
│           └── bi.integration.test.ts
│
├── db/
│   └── schema/
│       └── bi.schema.ts                       # BI database tables
│
└── routes/
    └── dashboard/
        └── analytics/
            ├── index.tsx                      # Analytics home
            ├── explore.tsx                    # Pivot builder
            ├── sql.tsx                        # SQL workbench
            ├── dashboards/
            │   ├── index.tsx
            │   ├── $dashboardId.tsx
            │   └── new.tsx
            └── reports/
                ├── $reportId.tsx
                └── $reportId.edit.tsx
```

---

## 6. Database Schema

### 6.1 New Tables

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

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

export const chartTypeEnum = pgEnum("bi_chart_type", [
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

export const widgetTypeEnum = pgEnum("bi_widget_type", [
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
  baseTable: text("base_table").notNull(),
  joins: jsonb("joins").$type<DatasetJoin[]>(),
  fields: jsonb("fields").$type<DatasetField[]>().notNull(),
  isPublic: boolean("is_public").notNull().default(false),
  allowedRoles: jsonb("allowed_roles").$type<string[]>().default([]),
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
  expression: text("expression").notNull(),
  aggregation: text("aggregation"),
  formatType: text("format_type").notNull().default("number"),
  formatOptions: jsonb("format_options").$type<FormatOptions>(),
  createdBy: text("created_by").references(() => user.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// SAVED REPORTS
// ─────────────────────────────────────────────────────────────────────────────

export const biReports = pgTable("bi_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id),
  datasetId: uuid("dataset_id").references(() => biDatasets.id),
  name: text("name").notNull(),
  description: text("description"),
  reportType: text("report_type").notNull().default("pivot"),
  pivotConfig: jsonb("pivot_config").$type<PivotConfig>(),
  sqlConfig: jsonb("sql_config").$type<SqlConfig>(),
  chartType: chartTypeEnum("chart_type"),
  chartConfig: jsonb("chart_config").$type<ChartConfig>(),
  filters: jsonb("filters").$type<FilterConfig[]>().default([]),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id),
  sharedWith: jsonb("shared_with").$type<string[]>().default([]),
  isOrgWide: boolean("is_org_wide").notNull().default(false),
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
  layout: jsonb("layout").$type<DashboardLayout>().notNull(),
  globalFilters: jsonb("global_filters").$type<FilterConfig[]>().default([]),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id),
  sharedWith: jsonb("shared_with").$type<string[]>().default([]),
  isOrgWide: boolean("is_org_wide").notNull().default(false),
  isPublished: boolean("is_published").notNull().default(false),
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
  widgetType: widgetTypeEnum("widget_type").notNull(),
  reportId: uuid("report_id").references(() => biReports.id),
  x: integer("x").notNull().default(0),
  y: integer("y").notNull().default(0),
  w: integer("w").notNull().default(4),
  h: integer("h").notNull().default(3),
  config: jsonb("config").$type<WidgetConfig>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// QUERY AUDIT LOG (Own tamper-evident chain)
// ─────────────────────────────────────────────────────────────────────────────

export const biQueryLog = pgTable("bi_query_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  organizationId: uuid("organization_id").references(() => organizations.id),
  queryType: text("query_type").notNull(), // "pivot" | "sql" | "export"
  queryHash: text("query_hash").notNull(),
  datasetId: uuid("dataset_id").references(() => biDatasets.id),
  sqlQuery: text("sql_query"),
  parameters: jsonb("parameters").$type<Record<string, unknown>>(),
  pivotConfig: jsonb("pivot_config").$type<PivotConfig>(),
  rowsReturned: integer("rows_returned"),
  executionTimeMs: integer("execution_time_ms"),
  // Tamper-evident chain (separate from main audit_logs)
  previousLogId: uuid("previous_log_id"),
  checksum: text("checksum"), // HMAC-SHA256
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

### 6.2 Type Definitions

```typescript
// src/features/bi/bi.types.ts

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
  options?: Record<string, unknown>;
}

export interface FilterConfig {
  field: string;
  operator: FilterOperator;
  value: unknown;
  label?: string;
}

// Current implementation (Phase 1)
export type FilterOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in"
  | "between";

// Phase 2 additions
export type FilterOperatorPhase2 =
  | FilterOperator
  | "not_in"
  | "contains"
  | "starts_with"
  | "ends_with"
  | "is_null"
  | "is_not_null";

// Current implementation (Phase 1)
export type AggregationType = "count" | "sum" | "avg" | "min" | "max";

// Phase 2 additions
export type AggregationTypePhase2 =
  | AggregationType
  | "count_distinct"
  | "median"
  | "percentile"
  | "stddev"
  | "variance";

export interface DashboardLayout {
  columns: number;
  rowHeight: number;
  compactType: "vertical" | "horizontal" | null;
}

export interface WidgetConfig {
  title?: string;
  subtitle?: string;
  kpiField?: string;
  kpiAggregation?: AggregationType;
  kpiFormat?: FormatOptions;
  textContent?: string;
  textFormat?: "plain" | "markdown";
  filterField?: string;
  filterType?: "select" | "date_range" | "search";
}
```

---

## 7. Core Modules

### 7.1 Aggregation Functions

```typescript
// src/features/bi/engine/aggregations.ts

export type AggregatorFn = (values: number[]) => number | null;

// Phase 1: Currently implemented
export const aggregators: Record<AggregationType, AggregatorFn> = {
  count: (values) => values.length,
  sum: (values) => values.reduce((a, b) => a + b, 0),
  avg: (values) =>
    values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null,
  min: (values) => (values.length > 0 ? Math.min(...values) : null),
  max: (values) => (values.length > 0 ? Math.max(...values) : null),
};

// Phase 2: To be added
export const aggregatorsPhase2: Record<string, AggregatorFn> = {
  count_distinct: (values) => new Set(values).size,

  median: (values) => {
    if (values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
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
};

// Welford's algorithm for streaming statistics
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
    const v = this.getVariance();
    return v !== null ? Math.sqrt(v) : null;
  }
  getCount() {
    return this.n;
  }
}
```

### 7.2 SQL Parser (AST-Based)

> **Note**: Use a proper AST parser (e.g., `pgsql-ast-parser`), not regex.

```typescript
// src/features/bi/engine/sql-parser.ts

import { parse } from "pgsql-ast-parser";

export interface ParsedQuery {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  tables: string[];
  columns: string[];
  parameters: Array<{ name: string; position: number }>;
  statementType: string;
}

const BLOCKED_STATEMENTS = new Set([
  "insert",
  "update",
  "delete",
  "drop",
  "truncate",
  "alter",
  "create",
  "grant",
  "revoke",
  "execute",
]);

export function parseAndValidateSql(sql: string): ParsedQuery {
  const result: ParsedQuery = {
    isValid: true,
    errors: [],
    warnings: [],
    tables: [],
    columns: [],
    parameters: [],
    statementType: "",
  };

  try {
    const ast = parse(sql);

    if (ast.length > 1) {
      result.isValid = false;
      result.errors.push("Multiple statements not allowed");
      return result;
    }

    const stmt = ast[0];
    result.statementType = stmt.type;

    if (BLOCKED_STATEMENTS.has(stmt.type.toLowerCase())) {
      result.isValid = false;
      result.errors.push(`Statement type "${stmt.type}" is not allowed`);
      return result;
    }

    // Extract tables from FROM and JOIN clauses
    if (stmt.type === "select") {
      extractTables(stmt, result.tables);
      extractColumns(stmt, result.columns);
    }

    // Extract {{param}} placeholders
    const paramRegex = /\{\{(\w+)\}\}/g;
    let match;
    while ((match = paramRegex.exec(sql)) !== null) {
      result.parameters.push({ name: match[1], position: match.index });
    }
  } catch (e) {
    result.isValid = false;
    result.errors.push(`SQL parse error: ${e.message}`);
  }

  return result;
}

export function validateAgainstDataset(
  parsed: ParsedQuery,
  allowedTables: Set<string>,
  allowedColumns: Map<string, Set<string>>,
): string[] {
  const errors: string[] = [];

  for (const table of parsed.tables) {
    if (!allowedTables.has(table.toLowerCase())) {
      errors.push(`Table "${table}" is not in the allowed dataset`);
    }
  }

  for (const col of parsed.columns) {
    const [table, column] = col.includes(".") ? col.split(".") : [null, col];

    if (table && allowedColumns.has(table)) {
      const cols = allowedColumns.get(table)!;
      if (!cols.has(column) && !cols.has("*")) {
        errors.push(`Column "${col}" is not accessible`);
      }
    }
  }

  return errors;
}
```

---

## 8. Governance Model

### 8.1 Enforcement Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ENFORCEMENT LAYERS                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Layer 1: APPLICATION ALLOWLISTS (Visual Builder)                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ • Only approved datasets/fields/filters can be constructed          │   │
│  │ • Server validates queries before execution                         │   │
│  │ • Implementation: datasets.config.ts, bi.schemas.ts                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                        │
│  Layer 2: DATABASE BOUNDARY (SQL Workbench)                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ • SQL executes against curated views only (bi_v_*)                  │   │
│  │ • Tenancy via RLS or session context (app.org_id)                   │   │
│  │ • Restricted columns excluded from views                            │   │
│  │ • Read-only database role (bi_readonly)                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                        │
│  Layer 3: OUTPUT CONTROLS                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ • PII masking applied post-query for display                        │   │
│  │ • Exports require step-up auth                                      │   │
│  │ • All exports logged with full context                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Field-Level Access Control

```typescript
// src/features/bi/governance/field-acl.ts

export const SENSITIVE_FIELDS = [
  "email",
  "phone",
  "dateOfBirth",
  "emergencyContact",
  "emergencyContactPhone",
  "emergencyContactEmail",
];

export const PII_PERMISSIONS = ["*", "pii.read", "pii:read", "data.pii.read"];

export function canViewSensitiveFields(permissions: Set<string>): boolean {
  return PII_PERMISSIONS.some((p) => permissions.has(p));
}

export function applyFieldMasking(
  rows: Array<Record<string, unknown>>,
  canViewPii: boolean,
): Array<Record<string, unknown>> {
  if (canViewPii) return rows;

  return rows.map((row) => {
    const masked = { ...row };
    for (const field of SENSITIVE_FIELDS) {
      if (field in masked) {
        masked[field] = "***";
      }
    }
    return masked;
  });
}
```

### 8.3 Audit Logging

**Chain Architecture**:

| Event Type      | Storage                             | Chain                    |
| --------------- | ----------------------------------- | ------------------------ |
| Query execution | `bi_query_log`                      | Own tamper-evident chain |
| Data export     | `export_history` + `logExportEvent` | Main audit chain         |
| Report CRUD     | `logDataChange`                     | Main audit chain         |

**Why Separate Chains**:

1. **Volume**: Query logs are high-volume; separate chain avoids bloating main audit
2. **Retention**: Different retention policies possible
3. **Verification**: Auditors can verify BI activity independently

**Implementation**:

```typescript
// Each bi_query_log entry includes:
{
  previous_log_id: "uuid",  // Prior entry in BI chain
  checksum: "hmac-sha256",  // HMAC of (entry || prev_checksum || secret)
}
```

Periodic checkpoints anchor BI chain to main audit via `audit_logs` entries.

---

## 9. Access Control

### 9.1 Access Matrix

| Feature               | Org Member | Reporter             | Admin/Owner     | Global Admin |
| --------------------- | ---------- | -------------------- | --------------- | ------------ |
| View shared reports   | Yes        | Yes                  | Yes             | Yes          |
| Create visual reports | No         | Yes                  | Yes             | Yes          |
| SQL Workbench         | No         | With `analytics.sql` | Yes             | Yes          |
| Create dashboards     | No         | Yes                  | Yes             | Yes          |
| Share org-wide        | No         | No                   | Yes             | Yes          |
| Export data           | Step-up    | Step-up              | Step-up         | Step-up      |
| View PII fields       | No         | With `pii.read`      | With `pii.read` | Yes          |
| Define datasets       | No         | No                   | Yes             | Yes          |
| Cross-org queries     | No         | No                   | No              | Yes          |

### 9.2 Permission Sets

```typescript
export const ANALYTICS_PERMISSIONS = {
  "analytics.view": "View shared reports and dashboards",
  "analytics.author": "Create and edit reports",
  "analytics.sql": "Access SQL Workbench",
  "analytics.share": "Share reports org-wide",
  "analytics.export": "Export data (still requires step-up)",
  "analytics.admin": "Configure datasets and metrics",
} as const;
```

---

## 10. User Interface

### 10.1 Visual Pivot Builder

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ┌─────────────────┐                                                         │
│  │ Data Source     │  [Organizations ▼]                                      │
│  └─────────────────┘                                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐   ┌─────────────────────────────────────────────┐  │
│  │ Available Fields    │   │  ROWS               COLUMNS                 │  │
│  │ ┌─────────────────┐ │   │  ┌───────────────┐ ┌───────────────┐        │  │
│  │ │ name            │ │   │  │ type          │ │ status        │        │  │
│  │ │ type            │ │   │  └───────────────┘ └───────────────┘        │  │
│  │ │ status          │ │   │                                             │  │
│  │ │ createdAt       │ │   │  MEASURES                                   │  │
│  │ └─────────────────┘ │   │  ┌─────────────┐  ┌─────────┐               │  │
│  │                     │   │  │ name        │  │ COUNT ▼ │               │  │
│  │ Filters             │   │  └─────────────┘  └─────────┘               │  │
│  │ ┌─────────────────┐ │   └─────────────────────────────────────────────┘  │
│  │ │ + Add Filter    │ │                                                     │
│  │ └─────────────────┘ │   Chart Type: [Table ▼] [Bar] [Line] [Pie]         │
│  └─────────────────────┘                                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│  [Run Query]  [Save Report]  [Export ▼]                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                    PIVOT TABLE RESULTS                                       │
│  ┌────────┬─────────┬─────────┬─────────┐                                   │
│  │        │ active  │ pending │ Total   │                                   │
│  ├────────┼─────────┼─────────┼─────────┤                                   │
│  │ club   │    42   │    8    │   50    │                                   │
│  │ league │    12   │    3    │   15    │                                   │
│  │ Total  │    54   │   11    │   65    │                                   │
│  └────────┴─────────┴─────────┴─────────┘                                   │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Dashboard Canvas

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Dashboard: Organization Overview                    [Edit] [Share] [Export] │
├──────────────────────────────────────────────────────────────────────────────┤
│  Filters:  [All Organizations ▼]  [Last 30 Days ▼]                          │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐             │
│  │  Active Orgs     │ │  Total Members   │ │  Pending Tasks   │             │
│  │      156         │ │     2,847        │ │       23         │             │
│  │    ▲ +12%        │ │    ▲ +8%         │ │    ▼ -15%        │             │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘             │
│                                                                              │
│  ┌────────────────────────────────────┐ ┌────────────────────────────────┐  │
│  │ Organizations by Type              │ │ Member Growth                  │  │
│  │  ┌────┐                            │ │     ──────────────             │  │
│  │  │    │  ┌────┐                    │ │    /              \            │  │
│  │  │    │  │    │  ┌────┐            │ │   /                            │  │
│  │  └────┴──┴────┴──┴────┘            │ │  Jan Feb Mar Apr May           │  │
│  │  Club   League  Region             │ │                                │  │
│  └────────────────────────────────────┘ └────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Integration Points

### 11.1 Existing Solstice Systems

| System              | Integration                  | Notes                                |
| ------------------- | ---------------------------- | ------------------------------------ |
| Better Auth         | Session context, permissions | Already implemented                  |
| Organizations       | Tenancy scoping              | Already implemented                  |
| Roles & Permissions | Field ACL, feature access    | Extend `PermissionService`           |
| Audit Log           | Query/export logging         | Extend existing + add `bi_query_log` |
| Forms               | Form submission data source  | Add dataset config                   |
| Members             | Member data source           | Add dataset config                   |
| Events              | Event data source            | Add dataset config                   |

### 11.2 Default Datasets

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
      { id: "type", name: "Type", sourceColumn: "type", dataType: "enum" },
      { id: "status", name: "Status", sourceColumn: "status", dataType: "enum" },
      { id: "createdAt", name: "Created", sourceColumn: "created_at", dataType: "date" },
    ],
  },
  {
    id: "form_submissions",
    name: "Form Submissions",
    baseTable: "form_submissions",
    joins: [
      {
        table: "organizations",
        type: "left",
        on: { left: "organization_id", right: "id" },
      },
    ],
    fields: [
      { id: "id", name: "ID", sourceColumn: "id", dataType: "uuid" },
      { id: "status", name: "Status", sourceColumn: "status", dataType: "enum" },
      {
        id: "completenessScore",
        name: "Completeness",
        sourceColumn: "completeness_score",
        dataType: "number",
      },
      {
        id: "submittedAt",
        name: "Submitted",
        sourceColumn: "submitted_at",
        dataType: "date",
      },
      {
        id: "payload",
        name: "Data",
        sourceColumn: "payload",
        dataType: "json",
        piiClassification: "sensitive",
      },
      {
        id: "orgName",
        name: "Organization",
        sourceColumn: "name",
        sourceTable: "organizations",
        dataType: "string",
      },
    ],
  },
];
```

---

## Links

- [PLAN-bi-implementation.md](./PLAN-bi-implementation.md) - Implementation approach and phases
- [GUIDE-bi-testing.md](./GUIDE-bi-testing.md) - Testing strategy and fixtures
- [CHECKLIST-sql-workbench-gate.md](./CHECKLIST-sql-workbench-gate.md) - SQL Workbench prerequisites
- [ADR-2025-12-26-d0-16](../ADR-2025-12-26-d0-16-analytics-charts-pivots-scope.md) - Analytics decision
- [viaSport Requirements](../../source/VIASPORT-PROVIDED-system-requirements-addendum.md)
