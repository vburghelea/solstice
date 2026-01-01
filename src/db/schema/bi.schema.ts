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
import type {
  ChartConfig,
  DashboardLayout,
  DatasetField as DatasetFieldConfig,
  DatasetJoin,
  FilterConfig,
  FormatOptions,
  PivotConfig,
  SqlConfig,
  WidgetConfig,
} from "~/features/bi/bi.types";
import type { JsonRecord } from "~/shared/lib/json";
import { user } from "./auth.schema";
import { organizations } from "./organizations.schema";

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

export const biDatasets = pgTable("bi_datasets", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id),
  name: text("name").notNull(),
  description: text("description"),
  baseTable: text("base_table").notNull(),
  joins: jsonb("joins").$type<DatasetJoin[]>(),
  fields: jsonb("fields").$type<DatasetFieldConfig[]>().notNull(),
  isPublic: boolean("is_public").notNull().default(false),
  allowedRoles: jsonb("allowed_roles").$type<string[]>().default([]),
  createdBy: text("created_by").references(() => user.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

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
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

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
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

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
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

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
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const biQueryLog = pgTable("bi_query_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  organizationId: uuid("organization_id").references(() => organizations.id),
  queryType: text("query_type").notNull(),
  queryHash: text("query_hash").notNull(),
  datasetId: uuid("dataset_id").references(() => biDatasets.id),
  sqlQuery: text("sql_query"),
  parameters: jsonb("parameters").$type<JsonRecord>(),
  pivotConfig: jsonb("pivot_config").$type<PivotConfig>(),
  rowsReturned: integer("rows_returned"),
  executionTimeMs: integer("execution_time_ms"),
  previousLogId: uuid("previous_log_id"),
  checksum: text("checksum"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
