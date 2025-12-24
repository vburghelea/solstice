import {
  integer,
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
import { organizations } from "./organizations.schema";

export const formStatusEnum = pgEnum("form_status", ["draft", "published", "archived"]);

export const formSubmissionStatusEnum = pgEnum("form_submission_status", [
  "draft",
  "submitted",
  "under_review",
  "changes_requested",
  "approved",
  "rejected",
]);

export const forms = pgTable(
  "forms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").references(() => organizations.id),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    status: formStatusEnum("status").notNull().default("draft"),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("forms_org_slug_unique").on(table.organizationId, table.slug)],
);

export const formVersions = pgTable(
  "form_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    formId: uuid("form_id")
      .notNull()
      .references(() => forms.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    definition: jsonb("definition").$type<JsonRecord>().notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    publishedBy: text("published_by").references(() => user.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("form_versions_unique").on(table.formId, table.versionNumber)],
);

export const formSubmissions = pgTable("form_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  formId: uuid("form_id")
    .notNull()
    .references(() => forms.id),
  formVersionId: uuid("form_version_id")
    .notNull()
    .references(() => formVersions.id),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  importJobId: uuid("import_job_id"),
  submitterId: text("submitter_id").references(() => user.id),
  status: formSubmissionStatusEnum("status").notNull().default("draft"),
  payload: jsonb("payload").$type<JsonRecord>().notNull(),
  completenessScore: integer("completeness_score"),
  missingFields: jsonb("missing_fields").$type<string[]>().default([]),
  validationErrors: jsonb("validation_errors")
    .$type<Array<{ field: string; message: string }>>()
    .default([]),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  reviewedBy: text("reviewed_by").references(() => user.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const formSubmissionVersions = pgTable(
  "form_submission_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => formSubmissions.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    payloadSnapshot: jsonb("payload_snapshot").$type<JsonRecord>().notNull(),
    changedBy: text("changed_by").references(() => user.id),
    changeReason: text("change_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("form_submission_versions_unique").on(
      table.submissionId,
      table.versionNumber,
    ),
  ],
);

export const submissionFiles = pgTable("submission_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  submissionId: uuid("submission_id")
    .notNull()
    .references(() => formSubmissions.id, { onDelete: "cascade" }),
  fieldKey: text("field_key").notNull(),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  checksum: text("checksum").notNull(),
  storageKey: text("storage_key").notNull(),
  uploadedBy: text("uploaded_by").references(() => user.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Form = typeof forms.$inferSelect;
export type NewForm = typeof forms.$inferInsert;
export type FormVersion = typeof formVersions.$inferSelect;
export type NewFormVersion = typeof formVersions.$inferInsert;
export type FormSubmission = typeof formSubmissions.$inferSelect;
export type NewFormSubmission = typeof formSubmissions.$inferInsert;
export type FormSubmissionVersion = typeof formSubmissionVersions.$inferSelect;
export type NewFormSubmissionVersion = typeof formSubmissionVersions.$inferInsert;
export type SubmissionFile = typeof submissionFiles.$inferSelect;
export type NewSubmissionFile = typeof submissionFiles.$inferInsert;
