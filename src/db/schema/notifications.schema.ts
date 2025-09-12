import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

// Simple email events table for idempotency of scheduled jobs and bulk notifications
// Stores a deduplication key and minimal metadata
export const emailEvents = pgTable("email_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  dedupeKey: text("dedupe_key").notNull().unique(),
  type: varchar("type", { length: 100 }).notNull(),
  entityId: text("entity_id"),
  recipientEmail: text("recipient_email").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export type EmailEvent = typeof emailEvents.$inferSelect;
export type NewEmailEvent = typeof emailEvents.$inferInsert;
