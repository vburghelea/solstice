import { index, inet, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { JsonRecord, JsonValue } from "~/shared/lib/json";
import { user } from "./auth.schema";
import { organizations } from "./organizations.schema";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),

    actorUserId: text("actor_user_id").references(() => user.id),
    actorOrgId: uuid("actor_org_id").references(() => organizations.id),
    actorIp: inet("actor_ip"),
    actorUserAgent: text("actor_user_agent"),

    action: text("action").notNull(),
    actionCategory: text("action_category").notNull(),

    targetType: text("target_type"),
    targetId: text("target_id"),
    targetOrgId: uuid("target_org_id").references(() => organizations.id),

    changes:
      jsonb("changes").$type<Record<string, { old?: JsonValue; new?: JsonValue }>>(),
    metadata: jsonb("metadata").$type<JsonRecord>().notNull().default({}),

    requestId: text("request_id").notNull(),
    prevHash: text("prev_hash"),
    entryHash: text("entry_hash").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("audit_logs_actor_idx").on(table.actorUserId, table.occurredAt),
    index("audit_logs_target_idx").on(table.targetType, table.targetId, table.occurredAt),
    index("audit_logs_action_idx").on(table.actionCategory, table.occurredAt),
    index("audit_logs_org_idx").on(table.targetOrgId, table.occurredAt),
    index("audit_logs_request_idx").on(table.requestId),
  ],
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
