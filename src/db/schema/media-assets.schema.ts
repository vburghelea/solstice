import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { gameSystems } from "./game-systems.schema";

export const mediaAssets = pgTable("media_assets", {
  id: serial("id").primaryKey(),
  gameSystemId: integer("game_system_id")
    .references(() => gameSystems.id)
    .notNull(),
  publicId: varchar("public_id", { length: 255 }).notNull(),
  secureUrl: text("secure_url").notNull(),
  width: integer("width"),
  height: integer("height"),
  format: varchar("format", { length: 50 }),
  license: varchar("license", { length: 255 }),
  licenseUrl: varchar("license_url", { length: 255 }),
  kind: varchar("kind", { length: 50 }),
  orderIndex: integer("order_index").default(0),
  moderated: boolean("moderated").notNull().default(false),
  checksum: varchar("checksum", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type MediaAsset = typeof mediaAssets.$inferSelect;
export type NewMediaAsset = typeof mediaAssets.$inferInsert;

export const mediaAssetsRelations = relations(mediaAssets, ({ one }) => ({
  system: one(gameSystems, {
    fields: [mediaAssets.gameSystemId],
    references: [gameSystems.id],
  }),
}));
