import { relations } from "drizzle-orm";
import {
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { gameSystems } from "./game-systems.schema";

export const systemCrawlEvents = pgTable("system_crawl_events", {
  id: serial("id").primaryKey(),
  gameSystemId: integer("game_system_id")
    .references(() => gameSystems.id)
    .notNull(),
  source: varchar("source", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  startedAt: timestamp("started_at").notNull(),
  finishedAt: timestamp("finished_at").notNull(),
  httpStatus: integer("http_status"),
  errorMessage: text("error_message"),
  severity: varchar("severity", { length: 50 }).notNull().default("info"),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const systemCrawlEventsRelations = relations(systemCrawlEvents, ({ one }) => ({
  system: one(gameSystems, {
    fields: [systemCrawlEvents.gameSystemId],
    references: [gameSystems.id],
  }),
}));
