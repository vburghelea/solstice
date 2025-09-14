import { relations } from "drizzle-orm";
import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { gameSystems } from "./game-systems.schema";

export const faqs = pgTable("faqs", {
  id: serial("id").primaryKey(),
  gameSystemId: integer("game_system_id")
    .references(() => gameSystems.id)
    .notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  source: text("source"),
  isCmsOverride: boolean("is_cms_override").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Faq = typeof faqs.$inferSelect;
export type NewFaq = typeof faqs.$inferInsert;

export const faqsRelations = relations(faqs, ({ one }) => ({
  system: one(gameSystems, {
    fields: [faqs.gameSystemId],
    references: [gameSystems.id],
  }),
}));
