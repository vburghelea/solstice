import { relations } from "drizzle-orm";
import { integer, pgTable, serial, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { gameSystemMechanics } from "./game-systems.schema";

export const externalMechanicMap = pgTable(
  "external_mechanic_map",
  {
    id: serial("id").primaryKey(),
    source: varchar("source", { length: 50 }).notNull(),
    externalTag: varchar("external_tag", { length: 255 }).notNull(),
    mechanicId: integer("mechanic_id")
      .references(() => gameSystemMechanics.id)
      .notNull(),
    confidence: integer("confidence").default(0).notNull(),
  },
  (t) => ({
    uniqueSourceTag: uniqueIndex("external_mechanic_map_source_tag_unique").on(
      t.source,
      t.externalTag,
    ),
  }),
);

export const externalMechanicMapRelations = relations(externalMechanicMap, ({ one }) => ({
  mechanic: one(gameSystemMechanics, {
    fields: [externalMechanicMap.mechanicId],
    references: [gameSystemMechanics.id],
  }),
}));
