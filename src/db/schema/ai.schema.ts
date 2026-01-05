import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { JsonRecord } from "~/shared/lib/json";
import { user } from "./auth.schema";
import { organizations } from "./organizations.schema";

export const aiPromptVersionStatusEnum = pgEnum("ai_prompt_version_status", [
  "draft",
  "active",
  "archived",
]);

export const aiUsageStatusEnum = pgEnum("ai_usage_status", ["success", "error"]);

export const aiUsageOperationEnum = pgEnum("ai_usage_operation", [
  "text",
  "structured",
  "embedding",
]);

export const aiPromptTemplates = pgTable(
  "ai_prompt_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: text("key").notNull().unique(),
    organizationId: uuid("organization_id").references(() => organizations.id),
    name: text("name").notNull(),
    description: text("description"),
    audiences: jsonb("audiences").$type<string[]>().notNull().default([]),
    isArchived: boolean("is_archived").notNull().default(false),
    createdBy: text("created_by").references(() => user.id),
    updatedBy: text("updated_by").references(() => user.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("ai_prompt_templates_org_idx").on(table.organizationId, table.key),
    index("ai_prompt_templates_updated_idx").on(table.updatedAt),
  ],
);

export const aiPromptVersions = pgTable(
  "ai_prompt_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    templateId: uuid("template_id")
      .notNull()
      .references(() => aiPromptTemplates.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    status: aiPromptVersionStatusEnum("status").notNull().default("draft"),
    systemPrompt: text("system_prompt"),
    userPrompt: text("user_prompt").notNull(),
    model: text("model").notNull(),
    temperature: real("temperature"),
    topP: real("top_p"),
    maxTokens: integer("max_tokens"),
    modelOptions: jsonb("model_options").$type<JsonRecord>().notNull().default({}),
    variables: jsonb("variables").$type<string[]>().notNull().default([]),
    notes: text("notes"),
    createdBy: text("created_by").references(() => user.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("ai_prompt_versions_template_version_idx").on(
      table.templateId,
      table.version,
    ),
    index("ai_prompt_versions_template_status_idx").on(table.templateId, table.status),
    uniqueIndex("ai_prompt_versions_active_unique")
      .on(table.templateId)
      .where(sql`${table.status} = 'active'`),
  ],
);

export const aiUsageLogs = pgTable(
  "ai_usage_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    operation: aiUsageOperationEnum("operation").notNull().default("text"),
    status: aiUsageStatusEnum("status").notNull().default("success"),
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    templateId: uuid("template_id").references(() => aiPromptTemplates.id),
    promptVersionId: uuid("prompt_version_id").references(() => aiPromptVersions.id),
    organizationId: uuid("organization_id").references(() => organizations.id),
    userId: text("user_id").references(() => user.id),
    requestId: text("request_id"),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    totalTokens: integer("total_tokens"),
    latencyMs: integer("latency_ms"),
    costUsdMicros: integer("cost_usd_micros"),
    errorMessage: text("error_message"),
    metadata: jsonb("metadata").$type<JsonRecord>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("ai_usage_logs_org_idx").on(table.organizationId, table.createdAt),
    index("ai_usage_logs_user_idx").on(table.userId, table.createdAt),
    index("ai_usage_logs_template_idx").on(table.templateId, table.createdAt),
    index("ai_usage_logs_version_idx").on(table.promptVersionId, table.createdAt),
    index("ai_usage_logs_status_idx").on(table.status, table.createdAt),
  ],
);

export type AiPromptTemplate = typeof aiPromptTemplates.$inferSelect;
export type NewAiPromptTemplate = typeof aiPromptTemplates.$inferInsert;
export type AiPromptVersion = typeof aiPromptVersions.$inferSelect;
export type NewAiPromptVersion = typeof aiPromptVersions.$inferInsert;
export type AiUsageLog = typeof aiUsageLogs.$inferSelect;
export type NewAiUsageLog = typeof aiUsageLogs.$inferInsert;
