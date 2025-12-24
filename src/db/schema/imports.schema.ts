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
import type { JsonRecord } from "~/shared/lib/json";
import { user } from "./auth.schema";
import { forms } from "./forms.schema";
import { organizations } from "./organizations.schema";

export const importTypeEnum = pgEnum("import_type", ["csv", "excel"]);
export const importLaneEnum = pgEnum("import_lane", ["interactive", "batch"]);
export const importStatusEnum = pgEnum("import_status", [
  "pending",
  "validating",
  "validated",
  "importing",
  "completed",
  "failed",
  "cancelled",
  "rolled_back",
]);

export const importJobs = pgTable("import_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  type: importTypeEnum("type").notNull(),
  lane: importLaneEnum("lane").notNull(),
  sourceFileKey: text("source_file_key").notNull(),
  sourceFileHash: text("source_file_hash").notNull(),
  sourceRowCount: integer("source_row_count"),
  targetFormId: uuid("target_form_id").references(() => forms.id),
  mappingTemplateId: uuid("mapping_template_id"),
  status: importStatusEnum("status").notNull().default("pending"),
  progressCheckpoint: integer("progress_checkpoint").default(0),
  stats: jsonb("stats").$type<JsonRecord>().notNull().default({}),
  errorReportKey: text("error_report_key"),
  errorSummary: jsonb("error_summary").$type<JsonRecord>().default({}),
  canRollback: boolean("can_rollback").notNull().default(true),
  rollbackBefore: timestamp("rollback_before", { withTimezone: true }),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const importMappingTemplates = pgTable("import_mapping_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id),
  name: text("name").notNull(),
  description: text("description"),
  targetFormId: uuid("target_form_id").references(() => forms.id),
  mappings: jsonb("mappings").$type<JsonRecord>().notNull(),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const importJobErrors = pgTable("import_job_errors", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id")
    .notNull()
    .references(() => importJobs.id, { onDelete: "cascade" }),
  rowNumber: integer("row_number").notNull(),
  fieldKey: text("field_key"),
  errorType: text("error_type").notNull(),
  errorMessage: text("error_message").notNull(),
  rawValue: text("raw_value"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ImportJob = typeof importJobs.$inferSelect;
export type NewImportJob = typeof importJobs.$inferInsert;
export type ImportMappingTemplate = typeof importMappingTemplates.$inferSelect;
export type NewImportMappingTemplate = typeof importMappingTemplates.$inferInsert;
export type ImportJobError = typeof importJobErrors.$inferSelect;
export type NewImportJobError = typeof importJobErrors.$inferInsert;
