import { createId } from "@paralleldrive/cuid2";
import {
  date,
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth.schema";

export const membershipTypes = pgTable(
  "membership_types",
  {
    id: varchar("id", { length: 255 })
      .$defaultFn(() => createId())
      .primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: varchar("description", { length: 1000 }),
    priceCents: integer("price_cents").notNull(),
    durationMonths: integer("duration_months").notNull(),
    status: varchar("status", { length: 50 })
      .$type<"active" | "inactive">()
      .notNull()
      .default("active"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    statusIdx: index("membership_types_status_idx").on(table.status),
  }),
);

export const memberships = pgTable(
  "memberships",
  {
    id: varchar("id", { length: 255 })
      .$defaultFn(() => createId())
      .primaryKey(),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    membershipTypeId: varchar("membership_type_id", { length: 255 })
      .notNull()
      .references(() => membershipTypes.id),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    status: varchar("status", { length: 50 })
      .$type<"active" | "expired" | "cancelled">()
      .notNull()
      .default("active"),
    paymentProvider: varchar("payment_provider", { length: 100 }),
    paymentId: varchar("payment_id", { length: 255 }),
    metadata: jsonb("metadata").$type<{
      paymentDetails?: Record<string, unknown>;
      notes?: string;
      [key: string]: unknown;
    }>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("memberships_user_id_idx").on(table.userId),
    statusIdx: index("memberships_status_idx").on(table.status),
    endDateIdx: index("memberships_end_date_idx").on(table.endDate),
    paymentIdIdx: index("memberships_payment_id_idx").on(table.paymentId),
  }),
);

// Export inferred types
export type MembershipType = typeof membershipTypes.$inferSelect;
export type NewMembershipType = typeof membershipTypes.$inferInsert;
export type Membership = typeof memberships.$inferSelect;
export type NewMembership = typeof memberships.$inferInsert;
