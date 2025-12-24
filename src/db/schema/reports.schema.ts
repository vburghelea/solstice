import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { JsonRecord } from "~/shared/lib/json";
import { user } from "./auth.schema";
import { organizations } from "./organizations.schema";

export const savedReports = pgTable("saved_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id),
  name: text("name").notNull(),
  description: text("description"),
  dataSource: text("data_source").notNull(),
  filters: jsonb("filters").$type<JsonRecord>().notNull().default({}),
  columns: jsonb("columns").$type<string[]>().notNull().default([]),
  sort: jsonb("sort").$type<JsonRecord>().default({}),
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

export const exportHistory = pgTable("export_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  organizationId: uuid("organization_id").references(() => organizations.id),
  reportId: uuid("report_id").references(() => savedReports.id),
  exportType: text("export_type").notNull(),
  dataSource: text("data_source").notNull(),
  filtersUsed: jsonb("filters_used").$type<JsonRecord>().notNull(),
  rowCount: integer("row_count").notNull(),
  fileKey: text("file_key"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SavedReport = typeof savedReports.$inferSelect;
export type NewSavedReport = typeof savedReports.$inferInsert;
export type ExportHistory = typeof exportHistory.$inferSelect;
export type NewExportHistory = typeof exportHistory.$inferInsert;
