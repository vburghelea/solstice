import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth.schema";
import { organizations } from "./organizations.schema";

export const templateContextEnum = pgEnum("template_context", [
  "forms",
  "imports",
  "reporting",
  "analytics",
  "general",
]);

export const templates = pgTable(
  "templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").references(() => organizations.id),
    name: text("name").notNull(),
    description: text("description"),
    context: templateContextEnum("context").notNull().default("general"),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    storageKey: text("storage_key").notNull(),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
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
    index("templates_context_idx").on(table.context, table.organizationId),
    index("templates_org_idx").on(table.organizationId, table.createdAt),
  ],
);

export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;
