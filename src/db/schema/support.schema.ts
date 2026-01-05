import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth.schema";
import { organizations } from "./organizations.schema";

export const supportRequestStatusEnum = pgEnum("support_request_status", [
  "open",
  "in_progress",
  "resolved",
  "closed",
]);

export const supportRequestCategoryEnum = pgEnum("support_request_category", [
  "question",
  "issue",
  "feature_request",
  "feedback",
]);

export const supportRequestPriorityEnum = pgEnum("support_request_priority", [
  "low",
  "normal",
  "high",
  "urgent",
]);

export const supportRequests = pgTable(
  "support_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").references(() => organizations.id),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    subject: text("subject").notNull(),
    message: text("message").notNull(),
    category: supportRequestCategoryEnum("category").notNull().default("question"),
    priority: supportRequestPriorityEnum("priority").notNull().default("normal"),
    status: supportRequestStatusEnum("status").notNull().default("open"),
    slaTargetAt: timestamp("sla_target_at", { withTimezone: true }),
    responseMessage: text("response_message"),
    respondedBy: text("responded_by").references(() => user.id),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("support_requests_user_idx").on(table.userId, table.createdAt),
    index("support_requests_org_idx").on(table.organizationId, table.createdAt),
    index("support_requests_status_idx").on(table.status, table.createdAt),
  ],
);

export const supportRequestAttachments = pgTable(
  "support_request_attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => supportRequests.id, { onDelete: "cascade" }),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    storageKey: text("storage_key").notNull(),
    uploadedBy: text("uploaded_by").references(() => user.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("support_request_attachments_request_idx").on(table.requestId, table.createdAt),
    uniqueIndex("support_request_attachments_key_unique").on(table.storageKey),
  ],
);

export type SupportRequest = typeof supportRequests.$inferSelect;
export type NewSupportRequest = typeof supportRequests.$inferInsert;
export type SupportRequestAttachment = typeof supportRequestAttachments.$inferSelect;
export type NewSupportRequestAttachment = typeof supportRequestAttachments.$inferInsert;
