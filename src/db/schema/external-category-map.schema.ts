import { relations } from "drizzle-orm";
import { integer, pgTable, serial, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { gameSystemCategories } from "./game-systems.schema";

export const externalCategoryMap = pgTable(
  "external_category_map",
  {
    id: serial("id").primaryKey(),
    source: varchar("source", { length: 50 }).notNull(),
    externalTag: varchar("external_tag", { length: 255 }).notNull(),
    categoryId: integer("category_id")
      .references(() => gameSystemCategories.id)
      .notNull(),
    confidence: integer("confidence").default(0).notNull(),
  },
  (t) => ({
    uniqueSourceTag: uniqueIndex("external_category_map_source_tag_unique").on(
      t.source,
      t.externalTag,
    ),
  }),
);

export const externalCategoryMapRelations = relations(externalCategoryMap, ({ one }) => ({
  category: one(gameSystemCategories, {
    fields: [externalCategoryMap.categoryId],
    references: [gameSystemCategories.id],
  }),
}));
