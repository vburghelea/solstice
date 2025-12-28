import { index, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
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
    status: supportRequestStatusEnum("status").notNull().default("open"),
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

export type SupportRequest = typeof supportRequests.$inferSelect;
export type NewSupportRequest = typeof supportRequests.$inferInsert;
