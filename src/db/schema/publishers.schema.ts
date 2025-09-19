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

export const publishers = pgTable("publishers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  websiteUrl: varchar("website_url", { length: 255 }),
  wikipediaUrl: varchar("wikipedia_url", { length: 255 }),
  bggPublisherId: integer("bgg_publisher_id"),
  verified: boolean("verified").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Publisher = typeof publishers.$inferSelect;
export type NewPublisher = typeof publishers.$inferInsert;

export const publishersRelations = relations(publishers, ({ many }) => ({
  systems: many(gameSystems),
}));
