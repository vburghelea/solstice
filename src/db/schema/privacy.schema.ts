import {
  boolean,
  date,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth.schema";

export const policyTypeEnum = pgEnum("policy_type", [
  "privacy_policy",
  "terms_of_service",
  "data_agreement",
]);

export const privacyRequestTypeEnum = pgEnum("privacy_request_type", [
  "access",
  "export",
  "erasure",
  "correction",
]);

export const privacyRequestStatusEnum = pgEnum("privacy_request_status", [
  "pending",
  "processing",
  "completed",
  "rejected",
]);

export const policyDocuments = pgTable(
  "policy_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: policyTypeEnum("type").notNull(),
    version: text("version").notNull(),
    contentUrl: text("content_url"),
    contentHash: text("content_hash").notNull(),
    effectiveDate: date("effective_date").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    publishedBy: text("published_by").references(() => user.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("policy_documents_unique").on(table.type, table.version)],
);

export const userPolicyAcceptances = pgTable(
  "user_policy_acceptances",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    policyId: uuid("policy_id")
      .notNull()
      .references(() => policyDocuments.id),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }).notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
  },
  (table) => [
    uniqueIndex("user_policy_acceptances_unique").on(table.userId, table.policyId),
  ],
);

export const privacyRequests = pgTable("privacy_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  type: privacyRequestTypeEnum("type").notNull(),
  status: privacyRequestStatusEnum("status").notNull().default("pending"),
  requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
  processedBy: text("processed_by").references(() => user.id),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  resultUrl: text("result_url"),
  resultNotes: text("result_notes"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const retentionPolicies = pgTable(
  "retention_policies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dataType: text("data_type").notNull(),
    retentionDays: integer("retention_days").notNull(),
    archiveAfterDays: integer("archive_after_days"),
    purgeAfterDays: integer("purge_after_days"),
    legalHold: boolean("legal_hold").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("retention_policies_unique").on(table.dataType)],
);

export type PolicyDocument = typeof policyDocuments.$inferSelect;
export type NewPolicyDocument = typeof policyDocuments.$inferInsert;
export type UserPolicyAcceptance = typeof userPolicyAcceptances.$inferSelect;
export type NewUserPolicyAcceptance = typeof userPolicyAcceptances.$inferInsert;
export type PrivacyRequest = typeof privacyRequests.$inferSelect;
export type NewPrivacyRequest = typeof privacyRequests.$inferInsert;
export type RetentionPolicy = typeof retentionPolicies.$inferSelect;
export type NewRetentionPolicy = typeof retentionPolicies.$inferInsert;
