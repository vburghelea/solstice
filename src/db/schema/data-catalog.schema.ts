import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { JsonRecord } from "~/shared/lib/json";
import { user } from "./auth.schema";
import { organizations } from "./organizations.schema";

export const dataCatalogEntries = pgTable(
  "data_catalog_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").references(() => organizations.id),
    sourceType: text("source_type").notNull(),
    sourceId: text("source_id").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    metadata: jsonb("metadata").$type<JsonRecord>().notNull().default({}),
    sourceUpdatedAt: timestamp("source_updated_at", { withTimezone: true }),
    createdBy: text("created_by").references(() => user.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("data_catalog_source_unique").on(table.sourceType, table.sourceId),
    index("data_catalog_org_idx").on(table.organizationId, table.sourceType),
    index("data_catalog_title_idx").on(table.title),
  ],
);

export type DataCatalogEntry = typeof dataCatalogEntries.$inferSelect;
export type NewDataCatalogEntry = typeof dataCatalogEntries.$inferInsert;
