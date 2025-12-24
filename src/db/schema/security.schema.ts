import {
  inet,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { JsonRecord } from "~/shared/lib/json";
import { user } from "./auth.schema";

export const securityEvents = pgTable("security_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => user.id),
  eventType: text("event_type").notNull(),
  ipAddress: inet("ip_address").notNull(),
  userAgent: text("user_agent"),
  geoCountry: text("geo_country"),
  geoRegion: text("geo_region"),
  riskScore: integer("risk_score").notNull().default(0),
  riskFactors: jsonb("risk_factors").$type<string[]>().notNull().default([]),
  metadata: jsonb("metadata").$type<JsonRecord>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accountLocks = pgTable("account_locks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  reason: text("reason").notNull(),
  lockedAt: timestamp("locked_at", { withTimezone: true }).notNull().defaultNow(),
  unlockAt: timestamp("unlock_at", { withTimezone: true }),
  unlockedBy: text("unlocked_by").references(() => user.id),
  unlockedAt: timestamp("unlocked_at", { withTimezone: true }),
  unlockReason: text("unlock_reason"),
  metadata: jsonb("metadata").$type<JsonRecord>().notNull().default({}),
});

export type SecurityEvent = typeof securityEvents.$inferSelect;
export type NewSecurityEvent = typeof securityEvents.$inferInsert;
export type AccountLock = typeof accountLocks.$inferSelect;
export type NewAccountLock = typeof accountLocks.$inferInsert;
