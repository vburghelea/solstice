import {
  date,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { JsonRecord } from "~/shared/lib/json";
import { user } from "./auth.schema";
import { forms, formSubmissions, formSubmissionVersions } from "./forms.schema";
import { organizations } from "./organizations.schema";

export const reportingCycleStatusEnum = pgEnum("reporting_cycle_status", [
  "upcoming",
  "active",
  "closed",
  "archived",
]);

export const reportingSubmissionStatusEnum = pgEnum("reporting_submission_status", [
  "not_started",
  "in_progress",
  "submitted",
  "under_review",
  "changes_requested",
  "approved",
  "overdue",
]);

export const reportingCycles = pgTable("reporting_cycles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: reportingCycleStatusEnum("status").notNull().default("upcoming"),
  createdBy: text("created_by").references(() => user.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const reportingTasks = pgTable("reporting_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  cycleId: uuid("cycle_id")
    .notNull()
    .references(() => reportingCycles.id, { onDelete: "cascade" }),
  formId: uuid("form_id")
    .notNull()
    .references(() => forms.id),
  organizationId: uuid("organization_id").references(() => organizations.id),
  organizationType: text("organization_type"),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: date("due_date").notNull(),
  reminderConfig: jsonb("reminder_config").$type<JsonRecord>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const reportingSubmissions = pgTable(
  "reporting_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => reportingTasks.id),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    formSubmissionId: uuid("form_submission_id").references(() => formSubmissions.id),
    status: reportingSubmissionStatusEnum("status").notNull().default("not_started"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    submittedBy: text("submitted_by").references(() => user.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewedBy: text("reviewed_by").references(() => user.id),
    reviewNotes: text("review_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("reporting_submissions_unique").on(table.taskId, table.organizationId),
  ],
);

export const reportingSubmissionHistory = pgTable("reporting_submission_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  reportingSubmissionId: uuid("reporting_submission_id")
    .notNull()
    .references(() => reportingSubmissions.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  actorId: text("actor_id").references(() => user.id),
  notes: text("notes"),
  formSubmissionVersionId: uuid("form_submission_version_id").references(
    () => formSubmissionVersions.id,
  ),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ReportingCycle = typeof reportingCycles.$inferSelect;
export type NewReportingCycle = typeof reportingCycles.$inferInsert;
export type ReportingTask = typeof reportingTasks.$inferSelect;
export type NewReportingTask = typeof reportingTasks.$inferInsert;
export type ReportingSubmission = typeof reportingSubmissions.$inferSelect;
export type NewReportingSubmission = typeof reportingSubmissions.$inferInsert;
export type ReportingSubmissionHistory = typeof reportingSubmissionHistory.$inferSelect;
export type NewReportingSubmissionHistory =
  typeof reportingSubmissionHistory.$inferInsert;
